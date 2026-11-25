import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/chef_profile_modal.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Comunidade / Explorar (`#view-community`) com:
/// 1) Feed da Comunidade ("Para Você", "Seguindo" e "Recentes", Busca, Hashtags em Alta com contagem 🔥, Chefs em Destaque, Publicar)
/// 2) Desafio da Semana (Card, Modal de Participação com "Escolher arquivo", Pré-visualização, +30 pts PRO, Galeria e Histórico)
/// 3) Eventos Especiais / Competições Sazonais (Cronograma de Fases, Regulamento, Inscrição de Receitas, Confirmação de Voto, Denúncia e Vencedor Oficial)
class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final ApiService _api = ApiService.instance;
  int _subTab = 0; // 0: Feed, 1: Desafio da Semana, 2: Eventos Especiais
  String _feedMode = 'for-you'; // 'for-you', 'following', 'recent'
  String _selectedCategory = 'Todas';
  final TextEditingController _searchCtrl = TextEditingController();

  static const List<String> _categories = [
    'Todas',
    'Massas',
    'Carnes',
    'Aves',
    'Frutos do Mar',
    'Vegano',
    'Sobremesas',
    'Rápidas',
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  // Modal Completo de Participação no Desafio da Semana (com "Escolher arquivo", preview, nome/tamanho, remover foto e validação)
  void _openWeeklyChallengeParticipationModal(WeeklyChallenge challenge) {
    final dishNameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final learnedCtrl = TextEditingController();
    PickedImageData? pickedPhoto;
    int? linkedRecipeId;
    bool submitting = false;
    String? errorMessage;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 18,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: DraggableScrollableSheet(
                expand: false,
                initialChildSize: 0.88,
                minChildSize: 0.55,
                maxChildSize: 0.95,
                builder: (_, scrollCtrl) {
                  return ListView(
                    controller: scrollCtrl,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.emoji_events_rounded, color: AppColors.proGold),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Participar do Desafio da Semana',
                              style: AppTextStyles.headingMd,
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            icon: const Icon(Icons.close_rounded),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.proGold.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.proBorder),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.stars_rounded, color: AppColors.proGold, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '${challenge.titulo} • Ganhe +${challenge.pontosParticipacao} pontos no Ranking PRO!',
                                style: const TextStyle(
                                  color: AppColors.secondary,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Upload de Foto da Receita Preparada ("Escolher arquivo" com preview e validação)
                      Text('Foto do Prato Preparado *', style: AppTextStyles.label),
                      const SizedBox(height: 8),
                      if (pickedPhoto == null)
                        InkWell(
                          onTap: () async {
                            final res = await showSaboreImagePicker(
                              ctx,
                              title: 'Escolher arquivo — Foto do Desafio',
                            );
                            if (res != null) {
                              setModalState(() {
                                pickedPhoto = res;
                                errorMessage = null;
                              });
                            }
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppColors.darkCard,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.accentBorder, width: 1.5),
                            ),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.cloud_upload_outlined,
                                  size: 40,
                                  color: AppColors.accent,
                                ),
                                const SizedBox(height: 10),
                                ElevatedButton.icon(
                                  onPressed: () async {
                                    final res = await showSaboreImagePicker(
                                      ctx,
                                      title: 'Escolher arquivo — Foto do Desafio',
                                    );
                                    if (res != null) {
                                      setModalState(() {
                                        pickedPhoto = res;
                                        errorMessage = null;
                                      });
                                    }
                                  },
                                  icon: const Icon(Icons.folder_open_rounded, size: 18),
                                  label: const Text('Escolher arquivo'),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Formatos aceitos: JPG, PNG, WEBP, GIF (máx. 10 MB)',
                                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.darkCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.success.withValues(alpha: 0.5)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SaboreImage(
                                imageSource: pickedPhoto!.dataUri,
                                height: 185,
                                width: double.infinity,
                                borderRadius: BorderRadius.circular(12),
                                fallbackLabel: pickedPhoto!.fileName,
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.success,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      '${pickedPhoto!.fileName} (${pickedPhoto!.sizeKb.toStringAsFixed(1)} KB)',
                                      style: AppTextStyles.body.copyWith(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  TextButton.icon(
                                    onPressed: () async {
                                      final res = await showSaboreImagePicker(
                                        ctx,
                                        title: 'Trocar Foto do Desafio',
                                      );
                                      if (res != null) {
                                        setModalState(() => pickedPhoto = res);
                                      }
                                    },
                                    icon: const Icon(Icons.sync_rounded, size: 16),
                                    label: const Text('Trocar', style: TextStyle(fontSize: 12)),
                                  ),
                                  TextButton.icon(
                                    onPressed: () => setModalState(() => pickedPhoto = null),
                                    style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                    icon: const Icon(Icons.delete_outline_rounded, size: 16),
                                    label: const Text('Remover', style: TextStyle(fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 16),
                      TextField(
                        controller: dishNameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Nome do seu Prato *',
                          hintText: 'Ex: Meu Risoto Cremoso Especial',
                          prefixIcon: Icon(Icons.restaurant_menu_rounded),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_api.myRecipes.isNotEmpty) ...[
                        DropdownButtonFormField<int?>(
                          initialValue: linkedRecipeId,
                          dropdownColor: AppColors.darkCard,
                          decoration: const InputDecoration(
                            labelText: 'Vincular a uma receita do seu livro (opcional)',
                            prefixIcon: Icon(Icons.menu_book_rounded),
                          ),
                          items: [
                            const DropdownMenuItem<int?>(
                              value: null,
                              child: Text('Sem vínculo (apenas publicação do desafio)'),
                            ),
                            ..._api.myRecipes.map(
                              (r) => DropdownMenuItem<int?>(
                                value: r.id,
                                child: Text(r.titulo, overflow: TextOverflow.ellipsis),
                              ),
                            ),
                          ],
                          onChanged: (v) {
                            setModalState(() {
                              linkedRecipeId = v;
                              if (v != null && dishNameCtrl.text.trim().isEmpty) {
                                final r = _api.myRecipes.where((e) => e.id == v).firstOrNull;
                                if (r != null) dishNameCtrl.text = r.titulo;
                              }
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: descCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Como você preparou este prato? *',
                          hintText:
                              'Conte sobre os ingredientes e o toque especial que você deu...',
                          alignLabelWithHint: true,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: learnedCtrl,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'O que você aprendeu neste desafio?',
                          hintText: 'Ex: Aprendi o ponto ideal da emulsão com manteiga gelada!',
                          alignLabelWithHint: true,
                        ),
                      ),

                      if (errorMessage != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.danger.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.danger),
                          ),
                          child: Text(
                            errorMessage!,
                            style: const TextStyle(color: AppColors.danger, fontSize: 12.5),
                          ),
                        ),
                      ],

                      const SizedBox(height: 18),
                      ElevatedButton.icon(
                        onPressed: submitting
                            ? null
                            : () async {
                                if (pickedPhoto == null) {
                                  setModalState(() {
                                    errorMessage =
                                        'Por favor, clique em "Escolher arquivo" e selecione a foto da receita preparada antes de publicar.';
                                  });
                                  return;
                                }
                                if (dishNameCtrl.text.trim().isEmpty) {
                                  setModalState(() {
                                    errorMessage = 'Informe o nome do prato que você preparou.';
                                  });
                                  return;
                                }
                                setModalState(() {
                                  submitting = true;
                                  errorMessage = null;
                                });
                                final res = await _api.submitWeeklyChallenge(
                                  tituloReceita: dishNameCtrl.text,
                                  descricao: descCtrl.text,
                                  aprendizado: learnedCtrl.text,
                                  imagemBase64: pickedPhoto!.dataUri,
                                  receitaId: linkedRecipeId,
                                );
                                if (ctx.mounted) {
                                  setModalState(() => submitting = false);
                                  if (res.ok) {
                                    Navigator.of(ctx).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(res.message)),
                                    );
                                  } else {
                                    setModalState(() => errorMessage = res.message);
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.proGold,
                          foregroundColor: AppColors.darkDeep,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                        ),
                        icon: submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.darkDeep,
                                ),
                              )
                            : const Icon(Icons.publish_rounded),
                        label: Text(
                          submitting
                              ? 'Publicando Participação...'
                              : 'Publicar no Desafio (+30 pts PRO)',
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  void _openCreatePublicationModal() {
    bool publishExisting = _api.myRecipes.where((r) => !r.publica).isNotEmpty;
    int? selectedPrivateRecipeId = _api.myRecipes.where((r) => !r.publica).firstOrNull?.id;
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final stepsCtrl = TextEditingController();
    final ingsCtrl = TextEditingController();
    PickedImageData? pickedPhoto;
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final privateRecipes = _api.myRecipes.where((r) => !r.publica).toList();

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 18,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.public_rounded, color: AppColors.accent),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Publicar na Comunidade (+10 pts)',
                            style: AppTextStyles.headingSm,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    if (privateRecipes.isNotEmpty) ...[
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('Publicar do Meu Livro'),
                              selected: publishExisting,
                              selectedColor: AppColors.accent,
                              onSelected: (_) => setModalState(() => publishExisting = true),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ChoiceChip(
                              label: const Text('Criar Nova Receita'),
                              selected: !publishExisting,
                              selectedColor: AppColors.accent,
                              onSelected: (_) => setModalState(() => publishExisting = false),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (publishExisting && privateRecipes.isNotEmpty) ...[
                      DropdownButtonFormField<int>(
                        initialValue: selectedPrivateRecipeId,
                        dropdownColor: AppColors.darkCard,
                        decoration:
                            const InputDecoration(labelText: 'Escolha a receita para publicar'),
                        items: privateRecipes
                            .map(
                              (r) => DropdownMenuItem<int>(
                                value: r.id,
                                child: Text(r.titulo),
                              ),
                            )
                            .toList(),
                        onChanged: (v) => setModalState(() => selectedPrivateRecipeId = v),
                      ),
                    ] else ...[
                      if (pickedPhoto != null)
                        Stack(
                          children: [
                            SaboreImage(
                              imageSource: pickedPhoto!.dataUri,
                              height: 140,
                              width: double.infinity,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            Positioned(
                              top: 6,
                              right: 6,
                              child: IconButton(
                                onPressed: () => setModalState(() => pickedPhoto = null),
                                icon: const Icon(Icons.cancel_rounded, color: AppColors.danger),
                              ),
                            ),
                          ],
                        )
                      else
                        OutlinedButton.icon(
                          onPressed: () async {
                            final p = await showSaboreImagePicker(ctx);
                            if (p != null) setModalState(() => pickedPhoto = p);
                          },
                          icon: const Icon(Icons.image_outlined),
                          label: const Text('Escolher arquivo de foto'),
                        ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: titleCtrl,
                        decoration: const InputDecoration(labelText: 'Título da Receita *'),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: descCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Descrição e #hashtags',
                          hintText: 'Ex: Deliciosa receita de família #MassasArtesanais',
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: ingsCtrl,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Ingredientes (separados por vírgula)',
                          hintText: 'Ex: 300g de farinha, 3 ovos, 1 pitada de sal',
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextField(
                        controller: stepsCtrl,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Modo de Preparo *',
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: saving
                          ? null
                          : () async {
                              setModalState(() => saving = true);
                              if (publishExisting && selectedPrivateRecipeId != null) {
                                final target = privateRecipes
                                    .where((r) => r.id == selectedPrivateRecipeId)
                                    .firstOrNull;
                                if (target != null) {
                                  final res = await _api.toggleRecipePublic(target);
                                  if (ctx.mounted) {
                                    Navigator.of(ctx).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(res.message)),
                                    );
                                  }
                                }
                              } else {
                                if (titleCtrl.text.trim().isEmpty ||
                                    stepsCtrl.text.trim().isEmpty) {
                                  setModalState(() => saving = false);
                                  return;
                                }
                                final ingList = ingsCtrl.text
                                    .split(',')
                                    .where((s) => s.trim().isNotEmpty)
                                    .map((s) => {
                                          'nome': s.trim(),
                                          'quantidade': '1',
                                          'unidadeMedida': 'porção',
                                        })
                                    .toList();
                                final res = await _api.createRecipe(
                                  titulo: titleCtrl.text,
                                  descricao: descCtrl.text,
                                  modoPreparo: stepsCtrl.text,
                                  tempoPreparo: 30,
                                  porcoes: 2,
                                  dificuldade: 'Médio',
                                  ingredientes: ingList,
                                  publica: true,
                                  imagemBase64: pickedPhoto?.dataUri,
                                );
                                if (ctx.mounted) {
                                  Navigator.of(ctx).pop();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(res.message)),
                                  );
                                }
                              }
                            },
                      icon: const Icon(Icons.publish_rounded),
                      label: Text(saving ? 'Publicando...' : 'Publicar Agora (+10 pts PRO)'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Seletor superior: Feed / Desafio da Semana / Eventos Especiais
        Container(
          margin: const EdgeInsets.fromLTRB(18, 12, 18, 6),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Row(
            children: [
              _tabPill(0, Icons.dynamic_feed_rounded, 'Feed'),
              _tabPill(1, Icons.local_fire_department_rounded, 'Desafio Semanal'),
              _tabPill(2, Icons.celebration_rounded, 'Eventos'),
            ],
          ),
        ),
        Expanded(
          child: _subTab == 0
              ? _buildCommunityFeed()
              : (_subTab == 1 ? _buildWeeklyChallengeTab() : _buildSpecialEventsTab()),
        ),
      ],
    );
  }

  Widget _tabPill(int index, IconData icon, String label) {
    final active = _subTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _subTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: active ? AppColors.accentGradient : null,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15, color: active ? Colors.white : AppColors.textMuted),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: active ? Colors.white : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCommunityFeed() {
    final followingIds = _api.featuredChefs.where((c) => c.seguindo).map((c) => c.id).toSet();
    final query = _searchCtrl.text.trim().toLowerCase();

    var recipes = _api.publicRecipes.where((r) {
      if (_feedMode == 'following' && (r.autorId == null || !followingIds.contains(r.autorId))) {
        return false;
      }
      if (_selectedCategory != 'Todas') {
        final matchCat = r.categoria.toLowerCase().contains(_selectedCategory.toLowerCase()) ||
            r.categorias.any((c) => c.toLowerCase().contains(_selectedCategory.toLowerCase())) ||
            r.titulo.toLowerCase().contains(_selectedCategory.toLowerCase()) ||
            r.descricao.toLowerCase().contains(_selectedCategory.toLowerCase());
        if (!matchCat) return false;
      }
      if (query.isNotEmpty) {
        final matchQuery = r.titulo.toLowerCase().contains(query) ||
            r.descricao.toLowerCase().contains(query) ||
            r.autorNome.toLowerCase().contains(query) ||
            r.hashtags.any((h) => h.toLowerCase().contains(query));
        if (!matchQuery) return false;
      }
      return true;
    }).toList();

    // Ordenação idêntica ao Web (`Front-End/Dashboard/explorar/script.js`)
    if (_feedMode == 'for-you') {
      recipes.sort((a, b) {
        if (a.autorIsPro != b.autorIsPro) return a.autorIsPro ? -1 : 1;
        final scoreA = (a.totalFavoritos * 2) + (a.totalComentarios * 3) + (a.mediaAvaliacoes * 2);
        final scoreB = (b.totalFavoritos * 2) + (b.totalComentarios * 3) + (b.mediaAvaliacoes * 2);
        return scoreB.compareTo(scoreA);
      });
    } else if (_feedMode == 'recent') {
      recipes.sort((a, b) => b.id.compareTo(a.id));
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () async {
        await Future.wait([
          _api.fetchPublicRecipes(),
          _api.fetchFeaturedChefs(),
          _api.fetchTrendingHashtags(),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 36),
        children: [
          // Cabeçalho (Para Você / Seguindo / Recentes) + Criar Publicação
          Row(
            children: [
              ChoiceChip(
                label: const Text('Para Você'),
                selected: _feedMode == 'for-you',
                selectedColor: AppColors.accent,
                onSelected: (_) => setState(() => _feedMode = 'for-you'),
              ),
              const SizedBox(width: 6),
              ChoiceChip(
                label: const Text('Seguindo'),
                selected: _feedMode == 'following',
                selectedColor: AppColors.accent,
                onSelected: (_) => setState(() => _feedMode = 'following'),
              ),
              const SizedBox(width: 6),
              ChoiceChip(
                label: const Text('Recentes'),
                selected: _feedMode == 'recent',
                selectedColor: AppColors.accent,
                onSelected: (_) => setState(() => _feedMode = 'recent'),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _openCreatePublicationModal,
                icon: const Icon(Icons.add_photo_alternate_outlined, size: 17),
                label: const Text('Publicar'),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Busca de receitas e chefs
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Buscar receitas, ingredientes, #hashtags ou chefs...',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      onPressed: () => setState(() => _searchCtrl.clear()),
                      icon: const Icon(Icons.clear_rounded),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 10),

          if (_api.trendingHashtags.isNotEmpty) ...[
            // Hashtags em Alta com contagem 🔥
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _api.trendingHashtags.map((tag) {
                  final normalized = tag.startsWith('#') ? tag : '#$tag';
                  final count = _api.trendingHashtagCounts[normalized];
                  final label = count != null && count > 0
                      ? '$normalized 🔥$count'
                      : normalized;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ActionChip(
                      label: Text(
                        label,
                        style: const TextStyle(
                          color: AppColors.secondary,
                          fontSize: 12,
                        ),
                      ),
                      backgroundColor: AppColors.darkCard,
                      onPressed: () => setState(
                        () => _searchCtrl.text = normalized.replaceAll('#', ''),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Filtro de Categorias
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _categories.map((cat) {
                final sel = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: sel,
                    selectedColor: AppColors.accent,
                    onSelected: (_) => setState(() => _selectedCategory = cat),
                  ),
                );
              }).toList(),
            ),
          ),

          // Carrossel de Chefs em Destaque (/social/perfis)
          if (_api.featuredChefs.isNotEmpty) ...[
            const SizedBox(height: 18),
            Text('Chefs em Destaque', style: AppTextStyles.headingSm),
            const SizedBox(height: 10),
            SizedBox(
              height: 150,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _api.featuredChefs.length,
                itemBuilder: (ctx, i) {
                  final chef = _api.featuredChefs[i];
                  return GestureDetector(
                    onTap: () => showChefProfileModal(
                      context,
                      userId: chef.id,
                      fallbackName: chef.nome,
                    ),
                    child: Container(
                      width: 136,
                      margin: const EdgeInsets.only(right: 10),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.darkCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.glassBorder),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SaboreAvatar(
                            name: chef.nome,
                            imageSource: chef.fotoPerfil,
                            frameId: chef.molduraAtiva,
                            isPro: chef.isPro,
                            radius: 22,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            chef.nome,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 12.5,
                            ),
                          ),
                          Text(
                            '${chef.totalReceitas} receitas',
                            style: AppTextStyles.bodyMuted.copyWith(fontSize: 11),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            height: 26,
                            child: OutlinedButton(
                              onPressed: () => _api.toggleFollowChef(
                                chef.id,
                                currentlyFollowing: chef.seguindo,
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                backgroundColor:
                                    chef.seguindo ? AppColors.accent : Colors.transparent,
                                foregroundColor:
                                    chef.seguindo ? Colors.white : AppColors.secondary,
                              ),
                              child: Text(
                                chef.seguindo ? 'Seguindo' : 'Seguir',
                                style: const TextStyle(fontSize: 11),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],

          const SizedBox(height: 18),
          Text('Publicações da Comunidade (${recipes.length})', style: AppTextStyles.headingSm),
          const SizedBox(height: 10),

          if (recipes.isEmpty)
            Container(
              padding: const EdgeInsets.all(26),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
              ),
              alignment: Alignment.center,
              child: Text(
                _feedMode == 'following'
                    ? 'Siga outros Chefs em Destaque acima para ver as receitas deles aqui!'
                    : 'Nenhuma receita encontrada para este filtro.',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMuted,
              ),
            )
          else
            ...recipes.map((r) => _buildCommunityRecipeCard(r)),
        ],
      ),
    );
  }

  Widget _buildCommunityRecipeCard(Recipe r) {
    final isFav = _api.isFavorite(r.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho do Card com Autor clicável
          ListTile(
            leading: SaboreAvatar(
              name: r.autorNome,
              imageSource: r.autorFoto,
              frameId: r.autorMoldura,
              isPro: r.autorIsPro,
              radius: 19,
            ),
            title: Row(
              children: [
                Flexible(
                  child: Text(
                    r.autorNome,
                    style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (r.autorIsPro) ...[
                  const SizedBox(width: 6),
                  const SaborePlanBadge(isPro: true, compact: true),
                ],
              ],
            ),
            subtitle: Text(
              r.categoria,
              style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
            ),
            trailing: IconButton(
              icon: Icon(
                isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                color: isFav ? AppColors.danger : AppColors.textMuted,
              ),
              onPressed: () => _api.toggleFavorite(r),
            ),
            onTap: r.autorId != null
                ? () => showChefProfileModal(context, userId: r.autorId!, fallbackName: r.autorNome)
                : null,
          ),

          // Foto da Receita
          GestureDetector(
            onTap: () => showRecipeDetailModal(context, r),
            child: SaboreImage(
              imageSource: r.imagem,
              height: 195,
              width: double.infinity,
              fallbackLabel: r.titulo,
            ),
          ),

          // Corpo e Ações
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.titulo, style: AppTextStyles.headingSm),
                if (r.descricao.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    r.descricao,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodyMuted,
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.warning, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      '${r.mediaAvaliacoes.toStringAsFixed(1)} (${r.totalAvaliacoes})',
                      style: AppTextStyles.mono.copyWith(fontSize: 12.5),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.timer_outlined, color: AppColors.secondary, size: 17),
                    const SizedBox(width: 4),
                    Text('${r.tempoPreparo} min', style: AppTextStyles.bodyMuted),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () => showSaveRecipeToBookDialog(context, r),
                      icon: const Icon(Icons.bookmark_add_outlined, size: 17),
                      label: const Text('Salvar'),
                    ),
                    ElevatedButton(
                      onPressed: () => showRecipeDetailModal(context, r),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('Ver Receita'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyChallengeTab() {
    final ch = _api.activeWeeklyChallenge ??
        const WeeklyChallenge(
          id: 1,
          titulo: 'Desafio da Semana: Sabores Brasileiros Contemporâneos',
          descricao:
              'Prepare um prato autoral valorizando ingredientes regionais brasileiros e compartilhe a foto do seu empratamento!',
          ingredienteFoco: 'Mandioca, Castanhas, Queijo Coalho ou Ervas Frescas',
          dicaChef: 'Aposte no contraste de texturas entre cremoso e crocante para surpreender.',
          pontosParticipacao: 30,
        );

    return RefreshIndicator(
      color: AppColors.proGold,
      onRefresh: _api.fetchWeeklyChallenge,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 36),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.proBannerGradient,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.proBorder, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        gradient: AppColors.proGoldGradient,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'DESAFIO SEMANAL ATIVO',
                        style: TextStyle(
                          color: AppColors.darkDeep,
                          fontWeight: FontWeight.w900,
                          fontSize: 10.5,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '+${ch.pontosParticipacao} pts PRO',
                      style: AppTextStyles.mono.copyWith(
                        color: AppColors.proGold,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(ch.titulo, style: AppTextStyles.headingLg),
                const SizedBox(height: 8),
                Text(ch.descricao, style: AppTextStyles.bodyLg),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.darkDeep.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '🥗 Ingrediente / Foco: ${ch.ingredienteFoco}',
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (ch.dicaChef.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          '💡 Dica do Chef: ${ch.dicaChef}',
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 12.5),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openWeeklyChallengeParticipationModal(ch),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.proGold,
                      foregroundColor: AppColors.darkDeep,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                    ),
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text(
                      'Enviar Foto e Participar do Desafio (+30 pts)',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Text(
            'Pratos Enviados pela Comunidade (${ch.participacoes.length})',
            style: AppTextStyles.headingSm,
          ),
          const SizedBox(height: 10),
          if (ch.participacoes.isEmpty)
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'Seja o primeiro chef a publicar a foto do prato preparado neste desafio semanal!',
                style: AppTextStyles.bodyMuted,
              ),
            )
          else
            ...ch.participacoes.map(
              (p) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      leading: SaboreAvatar(
                        name: p.usuarioNome,
                        imageSource: p.usuarioFoto,
                        frameId: p.usuarioMoldura,
                        isPro: p.usuarioIsPro,
                        radius: 18,
                      ),
                      title: Text(
                        p.usuarioNome,
                        style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        p.tituloReceita,
                        style: const TextStyle(color: AppColors.secondary, fontSize: 12.5),
                      ),
                    ),
                    if (p.imagem != null && p.imagem!.isNotEmpty)
                      SaboreImage(
                        imageSource: p.imagem,
                        height: 180,
                        width: double.infinity,
                        fallbackLabel: p.tituloReceita,
                      ),
                    if (p.descricao.isNotEmpty || p.aprendizado.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (p.descricao.isNotEmpty) Text(p.descricao, style: AppTextStyles.body),
                            if (p.aprendizado.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                '✨ Aprendizado: ${p.aprendizado}',
                                style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                              ),
                            ],
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),

          if (_api.weeklyChallengeHistory.isNotEmpty) ...[
            const SizedBox(height: 22),
            Text('Histórico de Desafios Anteriores', style: AppTextStyles.headingSm),
            const SizedBox(height: 10),
            ..._api.weeklyChallengeHistory.map(
              (h) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.history_edu_rounded, color: AppColors.secondary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            h.titulo,
                            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            '${h.participacoes.length} participações enviadas',
                            style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSpecialEventsTab() {
    final events = _api.specialEvents.isNotEmpty
        ? _api.specialEvents
        : [
            const SpecialEvent(
              id: '1',
              slug: 'natal-2026',
              titulo: 'Ceia de Natal Saboré 2026',
              subtitulo: 'Competição Gastronômica de Fim de Ano',
              tema: 'Pratos Natalinos Autorais & Sobremesas Festivas',
              descricao:
                  'Inscreva sua melhor receita natalina, receba votos da comunidade e conquiste o Emblema Espírito Natalino + Moldura Exclusiva + 30 dias de Saboré PRO!',
              regras:
                  '1. Cada chef pode inscrever 1 receita autoral pública.\n2. Durante a fase de votação, cada usuário tem direito a 1 voto oficial.\n3. O prato mais votado recebe o Emblema, Moldura e 30 dias PRO.',
              emblemaAsset: 'assets/images/espirito-natalino-2026.png',
              molduraId: 'moldura-natal-2026',
              status: 'VOTACAO',
            ),
            const SpecialEvent(
              id: '2',
              slug: 'reveillon-2027',
              titulo: 'Sabor da Virada 2027',
              subtitulo: 'Alta Gastronomia de Ano Novo',
              tema: 'Receitas Comemorativas & Brinde de Réveillon',
              descricao:
                  'Participe da competição especial de Ano Novo e desbloqueie o Emblema Sabor da Virada 2027 + Moldura Dourada Réveillon!',
              regras:
                  '1. Inscreva sua receita festiva de Ano Novo.\n2. Vote na sua criação favorita da comunidade.\n3. Premiação automática ao encerrar a votação.',
              emblemaAsset: 'assets/images/sabor-da-virada-2027.png',
              molduraId: 'moldura-reveillon-2027',
              status: 'INSCRICOES',
            ),
          ];

    return RefreshIndicator(
      color: AppColors.proGold,
      onRefresh: _api.fetchSpecialEvents,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 36),
        children: [
          Text('Eventos Especiais & Competições', style: AppTextStyles.headingLg),
          Text(
            'Inscreva suas receitas e conquiste emblemas colecionáveis, molduras comemorativas e assinatura PRO!',
            style: AppTextStyles.bodyMuted,
          ),
          const SizedBox(height: 16),
          ...events.map((ev) => _buildSpecialEventCard(ev)),
        ],
      ),
    );
  }

  Widget _buildSpecialEventCard(SpecialEvent ev) {
    final badgePath = (ev.emblemaAsset != null && ev.emblemaAsset!.contains('virada'))
        ? 'assets/images/sabor-da-virada-2027.png'
        : 'assets/images/espirito-natalino-2026.png';

    final winnerEntry = ev.vencedorEntradaId != null
        ? ev.inscricoes.where((e) => e.id == ev.vencedorEntradaId).firstOrNull
        : (ev.status == 'ENCERRADO' && ev.inscricoes.isNotEmpty ? ev.inscricoes.first : null);

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.proBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  badgePath,
                  width: 54,
                  height: 54,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.emoji_events_rounded, color: AppColors.proGold, size: 42),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            ev.status,
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () => _openEventRulesModal(ev),
                          icon: const Icon(Icons.info_outline_rounded, size: 15),
                          label: const Text('Regulamento', style: TextStyle(fontSize: 11.5)),
                        ),
                      ],
                    ),
                    Text(ev.titulo, style: AppTextStyles.headingMd),
                    if (ev.subtitulo.isNotEmpty)
                      Text(ev.subtitulo, style: AppTextStyles.bodyMuted.copyWith(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Cronograma de Fases (Inscrições -> Votação -> Resultado)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: AppColors.darkDeep.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _phaseStep('1. Inscrições', ev.status == 'INSCRICOES'),
                const Icon(Icons.chevron_right_rounded, size: 16, color: AppColors.textMuted),
                _phaseStep('2. Votação', ev.status == 'VOTACAO'),
                const Icon(Icons.chevron_right_rounded, size: 16, color: AppColors.textMuted),
                _phaseStep('3. Resultado', ev.status == 'ENCERRADO'),
              ],
            ),
          ),

          const SizedBox(height: 12),
          Text(ev.descricao, style: AppTextStyles.body),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.darkDeep,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.card_giftcard_rounded, color: AppColors.proGold, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Prêmio: ${ev.premio}',
                    style: const TextStyle(color: AppColors.secondary, fontSize: 12.5),
                  ),
                ),
              ],
            ),
          ),

          // Card do Vencedor Oficial quando encerrado
          if (winnerEntry != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: AppColors.proBannerGradient,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.proGold, width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.emoji_events_rounded, color: AppColors.proGold, size: 32),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '🏆 VENCEDOR OFICIAL DO EVENTO',
                          style: TextStyle(
                            color: AppColors.proGold,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(winnerEntry.receitaTitulo, style: AppTextStyles.headingSm),
                        Text(
                          'Chef ${winnerEntry.usuarioNome} • ${winnerEntry.totalVotos} votos',
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),
          if (ev.inscricoes.isNotEmpty) ...[
            Text('Galeria de Pratos Inscritos (${ev.inscricoes.length})', style: AppTextStyles.label),
            const SizedBox(height: 8),
            ...ev.inscricoes.map(
              (entry) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: entry.jaVotei ? AppColors.proGold : AppColors.glassBorder,
                  ),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: entry.receitaCompleta != null
                          ? () => showRecipeDetailModal(context, entry.receitaCompleta!)
                          : null,
                      child: SaboreImage(
                        imageSource: entry.receitaImagem,
                        width: 54,
                        height: 54,
                        borderRadius: BorderRadius.circular(8),
                        fallbackLabel: entry.receitaTitulo,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: InkWell(
                        onTap: entry.receitaCompleta != null
                            ? () => showRecipeDetailModal(context, entry.receitaCompleta!)
                            : null,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              entry.receitaTitulo,
                              style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                            ),
                            Text(
                              'Por ${entry.usuarioNome} • 🗳️ ${entry.totalVotos} votos',
                              style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Denunciar Inscrição',
                      icon: const Icon(Icons.flag_outlined, size: 17, color: AppColors.textMuted),
                      onPressed: () => _openReportEntryModal(ev, entry),
                    ),
                    OutlinedButton.icon(
                      onPressed: ev.status == 'ENCERRADO'
                          ? null
                          : () => _confirmAndVoteInEntry(ev, entry),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: entry.jaVotei
                            ? AppColors.proGold.withValues(alpha: 0.2)
                            : Colors.transparent,
                        foregroundColor: entry.jaVotei ? AppColors.proGold : AppColors.secondary,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      ),
                      icon: Icon(
                        entry.jaVotei ? Icons.check_circle_rounded : Icons.thumb_up_alt_outlined,
                        size: 15,
                      ),
                      label: Text(entry.jaVotei ? 'Votado' : 'Votar'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
          if (ev.status != 'ENCERRADO')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openEnrollEventModal(ev),
                icon: const Icon(Icons.how_to_vote_rounded, size: 18),
                label: Text(
                  ev.minhaInscricao != null
                      ? 'Substituir Minha Receita Inscrita'
                      : 'Inscrever Minha Receita Neste Evento',
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _phaseStep(String label, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: active ? AppColors.accent.withValues(alpha: 0.22) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: active ? FontWeight.w800 : FontWeight.w500,
          color: active ? AppColors.secondary : AppColors.textMuted,
        ),
      ),
    );
  }

  void _openEventRulesModal(SpecialEvent ev) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.menu_book_rounded, color: AppColors.proGold),
              const SizedBox(width: 8),
              Expanded(child: Text('Regulamento — ${ev.titulo}', style: AppTextStyles.headingSm)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (ev.tema.isNotEmpty) ...[
                  Text('Tema Oficial:', style: AppTextStyles.label),
                  Text(ev.tema, style: AppTextStyles.body),
                  const SizedBox(height: 12),
                ],
                Text('Regras da Competição:', style: AppTextStyles.label),
                const SizedBox(height: 4),
                Text(
                  ev.regras.isNotEmpty
                      ? ev.regras
                      : '1. Inscreva uma receita pública autoral alinhada ao tema do evento.\n'
                          '2. Cada usuário autenticado possui 1 voto oficial durante a fase de votação.\n'
                          '3. Não é permitido votar na própria receita.\n'
                          '4. O grande vencedor recebe Emblema Exclusivo, Moldura Comemorativa e 30 dias de Saboré PRO.',
                  style: AppTextStyles.body.copyWith(height: 1.45),
                ),
              ],
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Entendi'),
            ),
          ],
        );
      },
    );
  }

  void _confirmAndVoteInEntry(SpecialEvent ev, EventEntry entry) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Confirmar Voto Oficial', style: AppTextStyles.headingSm),
          content: Text(
            'Deseja registrar seu voto oficial na receita "${entry.receitaTitulo}" do Chef ${entry.usuarioNome} no evento ${ev.titulo}?',
            style: AppTextStyles.body,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton.icon(
              onPressed: () async {
                Navigator.of(ctx).pop();
                final res = await _api.voteInEventEntry(
                  eventId: ev.id,
                  entradaId: entry.id,
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res.message)),
                  );
                }
              },
              icon: const Icon(Icons.how_to_vote_rounded, size: 17),
              label: const Text('Confirmar Voto'),
            ),
          ],
        );
      },
    );
  }

  void _openReportEntryModal(SpecialEvent ev, EventEntry entry) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Denunciar Inscrição', style: AppTextStyles.headingSm),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Prato: "${entry.receitaTitulo}" (${entry.usuarioNome})',
                style: AppTextStyles.bodyMuted,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Motivo da denúncia',
                  hintText: 'Ex: Receita fora do tema do evento ou imagem inadequada...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (reasonCtrl.text.trim().isEmpty) return;
                final res = await _api.reportEventEntry(
                  eventId: ev.id,
                  entradaId: entry.id,
                  motivo: reasonCtrl.text,
                );
                if (ctx.mounted) {
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res.message)),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
              child: const Text('Enviar Denúncia'),
            ),
          ],
        );
      },
    );
  }

  void _openEnrollEventModal(SpecialEvent ev) {
    if (_api.myRecipes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Crie uma receita em "Meus Livros" primeiro para inscrevê-la no evento!'),
        ),
      );
      return;
    }
    int selectedRecipeId = _api.myRecipes.first.id;
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: Text('Inscrever em ${ev.titulo}', style: AppTextStyles.headingSm),
              content: DropdownButtonFormField<int>(
                initialValue: selectedRecipeId,
                dropdownColor: AppColors.darkCard,
                decoration: const InputDecoration(labelText: 'Selecione sua receita'),
                items: _api.myRecipes
                    .map(
                      (r) => DropdownMenuItem<int>(
                        value: r.id,
                        child: Text(r.titulo, overflow: TextOverflow.ellipsis),
                      ),
                    )
                    .toList(),
                onChanged: (v) => setDialogState(() => selectedRecipeId = v ?? selectedRecipeId),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final res = await _api.enrollRecipeInEvent(
                      eventId: ev.id,
                      receitaId: selectedRecipeId,
                    );
                    if (ctx.mounted) {
                      Navigator.of(ctx).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(res.message)),
                      );
                    }
                  },
                  child: const Text('Confirmar Inscrição'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
