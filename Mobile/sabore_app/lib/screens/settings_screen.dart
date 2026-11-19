import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/institutional_modals.dart';

/// Aba Configurações (`/usuarios/atualizar/:id` + Preferências do Assistente IA + Notificações
/// + Central Legal/LGPD + Restaurar Preferências + Excluir Conta `/usuarios/excluir/:id` + Logout)
class SettingsScreen extends StatefulWidget {
  final VoidCallback onLogout;

  const SettingsScreen({super.key, required this.onLogout});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiService _api = ApiService.instance;
  late TextEditingController _nameCtrl;
  late TextEditingController _emailCtrl;
  final TextEditingController _passCtrl = TextEditingController();
  late TextEditingController _serverUrlCtrl;

  String _aiDifficulty = 'Qualquer';
  String _aiServings = '2';
  final Map<String, bool> _dietMap = {
    'Vegano': false,
    'Vegetariano': false,
    'Sem Glúten': false,
    'Sem Lactose': false,
    'Low Carb': false,
    'Keto': false,
  };

  bool _notifyFollowers = true;
  bool _notifyComments = true;
  bool _notifyChallenge = true;
  bool _notifyRanking = true;
  bool _savingAccount = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: _api.currentUser?.nome ?? '');
    _emailCtrl = TextEditingController(text: _api.currentUser?.email ?? '');
    _serverUrlCtrl = TextEditingController(text: _api.baseUrl);
    _loadPrefs();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _serverUrlCtrl.dispose();
    super.dispose();
  }

  void _loadPrefs() {
    final s = StorageService.instance;
    _aiDifficulty = s.getString('sabore_ai_difficulty') ?? 'Qualquer';
    _aiServings = s.getString('sabore_ai_servings') ?? '2';
    for (final k in _dietMap.keys.toList()) {
      _dietMap[k] = s.getBool('sabore_diet_$k', defaultValue: false);
    }
    _notifyFollowers = s.getBool('sabore_notif_followers', defaultValue: true);
    _notifyComments = s.getBool('sabore_notif_comments', defaultValue: true);
    _notifyChallenge = s.getBool('sabore_notif_challenge', defaultValue: true);
    _notifyRanking = s.getBool('sabore_notif_ranking', defaultValue: true);
  }

  Future<void> _saveAiPreferences() async {
    final s = StorageService.instance;
    await s.setString('sabore_ai_difficulty', _aiDifficulty);
    await s.setString('sabore_ai_servings', _aiServings);
    for (final entry in _dietMap.entries) {
      await s.setBool('sabore_diet_${entry.key}', entry.value);
    }
    await s.setBool('sabore_notif_followers', _notifyFollowers);
    await s.setBool('sabore_notif_comments', _notifyComments);
    await s.setBool('sabore_notif_challenge', _notifyChallenge);
    await s.setBool('sabore_notif_ranking', _notifyRanking);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Preferências de IA e notificações salvas com sucesso!'),
        ),
      );
    }
  }

  void _confirmDeleteAccount() {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: AppColors.danger),
              const SizedBox(width: 8),
              Expanded(child: Text('Excluir Minha Conta', style: AppTextStyles.headingSm)),
            ],
          ),
          content: Text(
            'Tem certeza de que deseja encerrar e excluir sua conta Saboré permanentemente? Esta ação removerá seus livros e dados conforme a LGPD.',
            style: AppTextStyles.body,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(ctx).pop();
                final res = await _api.deleteMyAccount();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(res.message)),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
              child: const Text('Confirmar Exclusão'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 40),
      children: [
        Text('Configurações da Conta & Cozinha', style: AppTextStyles.headingLg),
        Text(
          'Personalize seus dados, restrições alimentares padrão do Chef IA e alertas',
          style: AppTextStyles.bodyMuted,
        ),
        const SizedBox(height: 18),

        // 1. Dados da Conta (/usuarios/atualizar/:id)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.manage_accounts_rounded, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text('Dados da Conta', style: AppTextStyles.headingSm),
                ],
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nome de Exibição',
                  prefixIcon: Icon(Icons.person_outline_rounded),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'E-mail',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Nova Senha (deixe em branco para manter a atual)',
                  prefixIcon: Icon(Icons.lock_outline_rounded),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _savingAccount
                      ? null
                      : () async {
                          setState(() => _savingAccount = true);
                          final res = await _api.updateProfile(
                            nome: _nameCtrl.text,
                            email: _emailCtrl.text,
                            novaSenha: _passCtrl.text,
                          );
                          _passCtrl.clear();
                          if (context.mounted) {
                            setState(() => _savingAccount = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                  icon: const Icon(Icons.save_rounded, size: 18),
                  label: Text(_savingAccount ? 'Atualizando...' : 'Salvar Dados da Conta'),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 2. Preferências do Assistente Chef IA
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.smart_toy_outlined, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text('Preferências Padrão do Chef IA', style: AppTextStyles.headingSm),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _aiDifficulty,
                      dropdownColor: AppColors.darkCard,
                      decoration: const InputDecoration(labelText: 'Dificuldade Padrão'),
                      items: const [
                        DropdownMenuItem(value: 'Qualquer', child: Text('Qualquer')),
                        DropdownMenuItem(value: 'Fácil', child: Text('Fácil')),
                        DropdownMenuItem(value: 'Médio', child: Text('Médio')),
                        DropdownMenuItem(value: 'Difícil', child: Text('Difícil')),
                      ],
                      onChanged: (v) => setState(() => _aiDifficulty = v ?? 'Qualquer'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _aiServings,
                      dropdownColor: AppColors.darkCard,
                      decoration: const InputDecoration(labelText: 'Porções Padrão'),
                      items: const [
                        DropdownMenuItem(value: '1', child: Text('1 porção')),
                        DropdownMenuItem(value: '2', child: Text('2 porções')),
                        DropdownMenuItem(value: '4', child: Text('4 porções')),
                        DropdownMenuItem(value: '6', child: Text('6 porções')),
                      ],
                      onChanged: (v) => setState(() => _aiServings = v ?? '2'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text('Restrições Alimentares Ativas:', style: AppTextStyles.label),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _dietMap.keys.map((diet) {
                  final checked = _dietMap[diet] ?? false;
                  return FilterChip(
                    label: Text(diet),
                    selected: checked,
                    selectedColor: AppColors.accent.withValues(alpha: 0.28),
                    checkmarkColor: Colors.white,
                    onSelected: (v) => setState(() => _dietMap[diet] = v),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _saveAiPreferences,
                  icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                  label: const Text('Salvar Preferências de IA'),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 3. Notificações
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.notifications_outlined, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text('Alertas & Notificações', style: AppTextStyles.headingSm),
                ],
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Novos seguidores no meu perfil'),
                value: _notifyFollowers,
                onChanged: (v) {
                  setState(() => _notifyFollowers = v);
                  _saveAiPreferences();
                },
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Comentários e avaliações nas minhas receitas'),
                value: _notifyComments,
                onChanged: (v) {
                  setState(() => _notifyComments = v);
                  _saveAiPreferences();
                },
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Lembretes do Desafio Gastronômico Semanal'),
                value: _notifyChallenge,
                onChanged: (v) {
                  setState(() => _notifyChallenge = v);
                  _saveAiPreferences();
                },
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Atualizações do Ranking PRO Mensal'),
                value: _notifyRanking,
                onChanged: (v) {
                  setState(() => _notifyRanking = v);
                  _saveAiPreferences();
                },
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 4. Servidor API, Central Legal & Encerrar Sessão / Conta
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Servidor da API Saboré', style: AppTextStyles.headingSm),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _serverUrlCtrl,
                      decoration: const InputDecoration(
                        hintText: 'http://localhost:3000',
                        prefixIcon: Icon(Icons.cloud_done_outlined),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () async {
                      await _api.setBaseUrl(_serverUrlCtrl.text);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('API conectada em: ${_api.baseUrl}')),
                        );
                      }
                    },
                    child: const Text('Aplicar'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => showAboutSaboreModal(context),
                    icon: const Icon(Icons.info_outline_rounded, size: 17),
                    label: const Text('Sobre o Saboré'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => showLegalDocsModal(context),
                    icon: const Icon(Icons.verified_user_outlined, size: 17),
                    label: const Text('Termos & LGPD'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () async {
                      await StorageService.instance.clearLocalPreferences();
                      setState(() => _loadPrefs());
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Cache local e preferências restaurados para o padrão.'),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.cleaning_services_outlined, size: 17),
                    label: const Text('Limpar Cache Local'),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: widget.onLogout,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.secondary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sair da Minha Conta'),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: _confirmDeleteAccount,
                  style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                  icon: const Icon(Icons.delete_forever_rounded, size: 18),
                  label: const Text('Encerrar / Excluir Minha Conta (LGPD)'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
