import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Chef IA (`/ia/gerar` + `/ia/consumo` + `/ingredientes-disponiveis`)
class ChefIaScreen extends StatefulWidget {
  final VoidCallback onOpenRankingPro;

  const ChefIaScreen({super.key, required this.onOpenRankingPro});

  @override
  State<ChefIaScreen> createState() => _ChefIaScreenState();
}

class _ChefIaScreenState extends State<ChefIaScreen> {
  final ApiService _api = ApiService.instance;
  final TextEditingController _promptCtrl = TextEditingController();
  final TextEditingController _ingInputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();

  List<ChatMessage> _messages = [];
  bool _sending = false;
  bool _showFilters = false;

  String _maxTime = 'Qualquer';
  String _diet = 'Nenhuma';
  final String _difficulty = 'Qualquer';

  static const List<String> _suggestions = [
    'Criar receita com os ingredientes da minha geladeira',
    'Jantar rápido e sofisticado em até 20 minutos',
    'Sobremesa cremosa com poucos ingredientes',
    'Prato proteico saudável para o almoço',
  ];

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _api.fetchIaConsumption();
  }

  @override
  void dispose() {
    _promptCtrl.dispose();
    _ingInputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _loadHistory() {
    final key = 'sabore_chat_${_api.currentUser?.email ?? 'guest'}';
    final raw = StorageService.instance.getJsonList(key);
    if (raw.isNotEmpty) {
      _messages = raw.map((e) => ChatMessage.fromJson(e)).toList();
    } else {
      _messages = const [
        ChatMessage(
          id: 'welcome',
          isUser: false,
          text:
              'Olá, Chef! Sou a Inteligência Gastronômica do Saboré. Adicione ingredientes na sua Geladeira ou peça qualquer prato e eu criarei uma receita completa com medidas exatas e passo a passo para você!',
          timestamp: 'Agora',
        ),
      ];
    }
  }

  Future<void> _saveHistory() async {
    final key = 'sabore_chat_${_api.currentUser?.email ?? 'guest'}';
    await StorageService.instance.setJsonList(
      key,
      _messages.map((m) => m.toJson()).toList(),
    );
  }

  Future<void> _sendMessage([String? presetPrompt]) async {
    final text = (presetPrompt ?? _promptCtrl.text).trim();
    if (text.isEmpty || _sending) return;

    _promptCtrl.clear();
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      isUser: true,
      text: text,
      timestamp: 'Agora',
    );
    setState(() {
      _messages.add(userMsg);
      _sending = true;
    });
    await _saveHistory();
    _scrollToBottom();

    final res = await _api.generateChefIaRecipe(
      prompt: text,
      tempoMaximo: _maxTime,
      restricao: _diet,
      dificuldade: _difficulty,
    );

    final aiMsg = ChatMessage(
      id: '${DateTime.now().millisecondsSinceEpoch}_ai',
      isUser: false,
      text: res.replyText,
      timestamp: 'Agora',
      recipe: res.recipe,
    );

    if (mounted) {
      setState(() {
        _messages.add(aiMsg);
        _sending = false;
      });
      await _saveHistory();
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent + 180,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cons = _api.iaConsumption;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: SaboreCreditBanner(
            featureTitle: 'Chef IA',
            isPro: cons.isPro,
            remaining: cons.chatRestantes,
            limit: cons.chatLimite,
            onOpenRankingPro: widget.onOpenRankingPro,
          ),
        ),

        // Barra de Filtros e Geladeira Expansível
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: InkWell(
            onTap: () => setState(() => _showFilters = !_showFilters),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tune_rounded, color: AppColors.accent, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Geladeira (${_api.fridgeIngredients.length} itens) • Tempo: $_maxTime • Dieta: $_diet',
                      style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (_messages.length > 1)
                    TextButton(
                      onPressed: () async {
                        final key = 'sabore_chat_${_api.currentUser?.email ?? 'guest'}';
                        await StorageService.instance.remove(key);
                        setState(() => _loadHistory());
                      },
                      child: const Text('Limpar Chat', style: TextStyle(fontSize: 11.5)),
                    ),
                  Icon(
                    _showFilters ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                    color: AppColors.secondary,
                  ),
                ],
              ),
            ),
          ),
        ),

        if (_showFilters)
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _ingInputCtrl,
                        onSubmitted: (v) async {
                          if (v.trim().isNotEmpty) {
                            await _api.addFridgeIngredient(v);
                            _ingInputCtrl.clear();
                          }
                        },
                        decoration: const InputDecoration(
                          hintText: 'Adicionar ingrediente à Geladeira...',
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () async {
                        if (_ingInputCtrl.text.trim().isNotEmpty) {
                          await _api.addFridgeIngredient(_ingInputCtrl.text);
                          _ingInputCtrl.clear();
                        }
                      },
                      child: const Text('Add'),
                    ),
                  ],
                ),
                if (_api.fridgeIngredients.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _api.fridgeIngredients
                        .map(
                          (i) => Chip(
                            label: Text(i.nome, style: const TextStyle(fontSize: 11.5)),
                            visualDensity: VisualDensity.compact,
                            onDeleted: () => _api.removeFridgeIngredient(i.id),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _maxTime,
                        dropdownColor: AppColors.darkCard,
                        decoration: const InputDecoration(labelText: 'Tempo Máximo', isDense: true),
                        items: const [
                          DropdownMenuItem(value: 'Qualquer', child: Text('Qualquer')),
                          DropdownMenuItem(value: '15 min', child: Text('Até 15 min')),
                          DropdownMenuItem(value: '30 min', child: Text('Até 30 min')),
                          DropdownMenuItem(value: '45 min', child: Text('Até 45 min')),
                          DropdownMenuItem(value: '60 min', child: Text('Até 60 min')),
                        ],
                        onChanged: (v) => setState(() => _maxTime = v ?? 'Qualquer'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: _diet,
                        dropdownColor: AppColors.darkCard,
                        decoration: const InputDecoration(labelText: 'Restrição', isDense: true),
                        items: const [
                          DropdownMenuItem(value: 'Nenhuma', child: Text('Nenhuma')),
                          DropdownMenuItem(value: 'Vegetariano', child: Text('Vegetariano')),
                          DropdownMenuItem(value: 'Vegano', child: Text('Vegano')),
                          DropdownMenuItem(value: 'Sem Glúten', child: Text('Sem Glúten')),
                          DropdownMenuItem(value: 'Sem Lactose', child: Text('Sem Lactose')),
                          DropdownMenuItem(value: 'Low Carb', child: Text('Low Carb')),
                        ],
                        onChanged: (v) => setState(() => _diet = v ?? 'Nenhuma'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

        // Sugestões Rápidas
        SizedBox(
          height: 44,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            itemCount: _suggestions.length,
            itemBuilder: (_, idx) {
              final s = _suggestions[idx];
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  avatar: const Icon(Icons.auto_awesome_rounded, size: 14, color: AppColors.accent),
                  label: Text(s, style: const TextStyle(fontSize: 12)),
                  backgroundColor: AppColors.darkCard,
                  onPressed: () => _sendMessage(s),
                ),
              );
            },
          ),
        ),

        // Mensagens do Chat
        Expanded(
          child: ListView.builder(
            controller: _scrollCtrl,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            itemCount: _messages.length + (_sending ? 1 : 0),
            itemBuilder: (context, idx) {
              if (idx == _messages.length) {
                return Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                        ),
                        SizedBox(width: 10),
                        Text('O Chef IA está elaborando sua receita...'),
                      ],
                    ),
                  ),
                );
              }

              final msg = _messages[idx];
              return _buildMessageBubble(msg);
            },
          ),
        ),

        // Campo de Envio
        Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          decoration: const BoxDecoration(
            color: AppColors.dark,
            border: Border(top: BorderSide(color: AppColors.glassBorder)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promptCtrl,
                  onSubmitted: (_) => _sendMessage(),
                  decoration: const InputDecoration(
                    hintText: 'Peça uma receita ao Chef IA...',
                    prefixIcon: Icon(Icons.smart_toy_outlined),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _sending ? null : () => _sendMessage(),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                ),
                child: const Icon(Icons.send_rounded, size: 20),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 540),
        margin: const EdgeInsets.symmetric(vertical: 6),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: isUser ? AppColors.accentGradient : null,
          color: isUser ? null : AppColors.darkCard,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 18 : 4),
            bottomRight: Radius.circular(isUser ? 4 : 18),
          ),
          border: isUser ? null : Border.all(color: AppColors.glassBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              msg.text,
              style: AppTextStyles.bodyLg.copyWith(
                color: isUser ? Colors.white : AppColors.textPrimary,
              ),
            ),
            if (msg.recipe != null) ...[
              const SizedBox(height: 12),
              _buildGeneratedRecipeCard(msg.recipe!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGeneratedRecipeCard(Recipe rec) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkDeep,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.restaurant_menu_rounded, color: AppColors.accent, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(rec.titulo, style: AppTextStyles.headingSm),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '⏱ ${rec.tempoPreparo} min • 🍽 ${rec.porcoes} porções • ${rec.dificuldade}',
            style: AppTextStyles.mono.copyWith(fontSize: 12),
          ),
          if (rec.ingredientes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text('Ingredientes principais:', style: AppTextStyles.label),
            const SizedBox(height: 4),
            ...rec.ingredientes.take(5).map(
                  (i) => Text(
                    '• ${i.displayText}',
                    style: AppTextStyles.bodyMuted.copyWith(fontSize: 12.5),
                  ),
                ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton.icon(
                onPressed: () => showSaveRecipeToBookDialog(context, rec),
                icon: const Icon(Icons.bookmark_add_rounded, size: 16),
                label: const Text('Salvar esta Receita'),
              ),
              OutlinedButton.icon(
                onPressed: () => showRecipeDetailModal(context, rec),
                icon: const Icon(Icons.menu_book_rounded, size: 16),
                label: const Text('Modo Passo a Passo'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
