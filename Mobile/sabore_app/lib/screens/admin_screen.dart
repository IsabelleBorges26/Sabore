import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Painel Administrativo Completo Saboré (3 Abas idênticas a `Front-End/Dashboard/admin/`):
/// 1) Ranking & Fechamento Mensal (`/planos/admin/dashboard`, `/planos/admin/fechamento`)
/// 2) Desafios Semanais (`/desafios/semanal/programados`, `/desafios/semanal/admin/salvar`, `/encerrar`, `/participacoes`)
/// 3) Eventos Especiais & Moderação (`/desafios/eventos`, `/entradas/:id/moderar`, `/encerrar-votacao`, `/confirmar-resultado`, `/auditoria`)
class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final ApiService _api = ApiService.instance;
  int _adminTab = 0; // 0: Ranking & Fechamento, 1: Desafios Semanais, 2: Eventos Especiais

  Map<String, dynamic> _adminData = {};
  List<Map<String, dynamic>> _scheduledChallenges = [];
  List<Map<String, dynamic>> _weeklyParticipations = [];
  List<Map<String, dynamic>> _auditLogs = [];
  bool _loading = true;
  bool _executingClosing = false;

  final _chTitleCtrl = TextEditingController();
  final _chDescCtrl = TextEditingController();
  final _chFocusCtrl = TextEditingController();
  final _chTipCtrl = TextEditingController();
  final _chHashtagCtrl = TextEditingController(text: '#DesafioSabore');

  @override
  void initState() {
    super.initState();
    _loadAdminAll();
  }

  @override
  void dispose() {
    _chTitleCtrl.dispose();
    _chDescCtrl.dispose();
    _chFocusCtrl.dispose();
    _chTipCtrl.dispose();
    _chHashtagCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAdminAll() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      _api.fetchAdminDashboard(),
      _api.fetchAdminScheduledWeeklyChallenges(),
      _api.fetchAdminWeeklyParticipations(),
      _api.fetchAdminEventAuditLogs(),
      _api.fetchSpecialEvents(),
    ]);
    if (mounted) {
      setState(() {
        _adminData = results[0] as Map<String, dynamic>;
        _scheduledChallenges = results[1] as List<Map<String, dynamic>>;
        _weeklyParticipations = results[2] as List<Map<String, dynamic>>;
        _auditLogs = results[3] as List<Map<String, dynamic>>;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
              _tabPill(0, Icons.emoji_events_rounded, 'Ranking PRO'),
              _tabPill(1, Icons.local_fire_department_rounded, 'Desafios'),
              _tabPill(2, Icons.celebration_rounded, 'Eventos & Mod.'),
            ],
          ),
        ),
        if (_loading)
          const LinearProgressIndicator(
            minHeight: 2,
            color: AppColors.proGold,
            backgroundColor: Colors.transparent,
          ),
        Expanded(
          child: RefreshIndicator(
            color: AppColors.proGold,
            onRefresh: _loadAdminAll,
            child: _adminTab == 0
                ? _buildRankingClosingTab()
                : (_adminTab == 1 ? _buildWeeklyChallengesAdminTab() : _buildSpecialEventsAdminTab()),
          ),
        ),
      ],
    );
  }

  Widget _tabPill(int index, IconData icon, String label) {
    final active = _adminTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _adminTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: active ? AppColors.proGoldGradient : null,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 15,
                color: active ? AppColors.darkDeep : AppColors.textMuted,
              ),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: active ? AppColors.darkDeep : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ABA 1: RANKING & FECHAMENTO MENSAL
  Widget _buildRankingClosingTab() {
    final stats = _adminData['estatisticas'] is Map<String, dynamic>
        ? _adminData['estatisticas'] as Map<String, dynamic>
        : <String, dynamic>{};
    final fechamentos = _adminData['fechamentos'] is List
        ? (_adminData['fechamentos'] as List).whereType<Map<String, dynamic>>().toList()
        : <Map<String, dynamic>>[];
    final concessoes = _adminData['concessoes'] is List
        ? (_adminData['concessoes'] as List).whereType<Map<String, dynamic>>().toList()
        : <Map<String, dynamic>>[];

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 40),
      children: [
        // 4 Cards de Métricas do Ciclo
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 2.1,
          children: [
            _metricTile(
              'Mês Atual',
              (stats['mesReferencia'] ?? _api.rankingPeriodo['mesReferencia'] ?? '2026-11')
                  .toString(),
            ),
            _metricTile(
              'Participantes',
              '${stats['totalParticipantesMes'] ?? _api.rankingList.length}',
            ),
            _metricTile(
              'PROs Ativos',
              '${stats['totalProsAtivos'] ?? concessoes.length}',
            ),
            _metricTile(
              'Fechamentos',
              '${fechamentos.length}',
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Card de Execução do Fechamento Mensal
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: AppColors.proBannerGradient,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.proBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Fechamento do Ciclo Mensal PRO', style: AppTextStyles.headingSm),
              const SizedBox(height: 6),
              Text(
                'Ao executar o fechamento mensal, os 5 primeiros colocados do Ranking recebem automaticamente 30 dias de assinatura Saboré PRO gratuita.',
                style: AppTextStyles.bodyMuted,
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _executingClosing
                      ? null
                      : () async {
                          setState(() => _executingClosing = true);
                          final res = await _api.executeAdminMonthlyClosing();
                          await _loadAdminAll();
                          if (mounted) {
                            setState(() => _executingClosing = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.proGold,
                    foregroundColor: AppColors.darkDeep,
                  ),
                  icon: const Icon(Icons.workspace_premium_rounded),
                  label: Text(
                    _executingClosing
                        ? 'Processando Fechamento...'
                        : 'Executar Fechamento Mensal Agora',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        Text('Top Chefs no Ranking Atual (${_api.rankingList.length})', style: AppTextStyles.headingSm),
        const SizedBox(height: 8),
        ..._api.rankingList.take(10).map(
              (r) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: r.posicao <= 5 ? AppColors.proBorder : AppColors.glassBorder,
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      '#${r.posicao}',
                      style: AppTextStyles.mono.copyWith(
                        color: r.posicao <= 5 ? AppColors.proGold : AppColors.textMuted,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(r.nome, style: AppTextStyles.body),
                    ),
                    Text('${r.pontos} pts', style: AppTextStyles.mono),
                  ],
                ),
              ),
            ),

        if (concessoes.isNotEmpty) ...[
          const SizedBox(height: 18),
          Text('Concessões PRO Recentes (${concessoes.length})', style: AppTextStyles.headingSm),
          const SizedBox(height: 8),
          ...concessoes.take(5).map(
                (c) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Usuário #${c['usuarioId']} • Posição #${c['posicao'] ?? '-'} • ${c['pontos'] ?? 0} pts',
                    style: AppTextStyles.bodyMuted,
                  ),
                ),
              ),
        ],
      ],
    );
  }

  // ABA 2: DESAFIOS SEMANAIS
  Widget _buildWeeklyChallengesAdminTab() {
    final active = _api.activeWeeklyChallenge;

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 40),
      children: [
        if (active != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.proBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.local_fire_department_rounded, color: AppColors.proGold),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('Desafio Ativo: ${active.titulo}', style: AppTextStyles.headingSm),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Ingrediente: ${active.ingredienteFoco} • Participações: ${active.participacoes.length}',
                  style: AppTextStyles.bodyMuted,
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final res = await _api.endAdminWeeklyChallenge(active.id);
                      await _loadAdminAll();
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res.message)),
                        );
                      }
                    },
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                    icon: const Icon(Icons.stop_circle_outlined, size: 17),
                    label: const Text('Encerrar Desafio Atual'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Formulário Criar / Salvar Desafio Semanal
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Criar / Programar Novo Desafio da Semana (+30 pts)', style: AppTextStyles.headingSm),
              const SizedBox(height: 12),
              TextField(
                controller: _chTitleCtrl,
                decoration: const InputDecoration(labelText: 'Título do Desafio *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _chFocusCtrl,
                decoration: const InputDecoration(labelText: 'Ingrediente ou Técnica Foco *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _chDescCtrl,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Descrição do Desafio *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _chTipCtrl,
                decoration: const InputDecoration(labelText: 'Dica do Chef'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _chHashtagCtrl,
                decoration: const InputDecoration(labelText: 'Hashtag Oficial'),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    if (_chTitleCtrl.text.trim().isEmpty) return;
                    final res = await _api.createAdminWeeklyChallenge(
                      titulo: _chTitleCtrl.text,
                      descricao: _chDescCtrl.text,
                      ingredienteFoco: _chFocusCtrl.text,
                      dicaChef: _chTipCtrl.text,
                      hashtag: _chHashtagCtrl.text,
                    );
                    _chTitleCtrl.clear();
                    _chDescCtrl.clear();
                    _chFocusCtrl.clear();
                    _chTipCtrl.clear();
                    await _loadAdminAll();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(res.message)),
                      );
                    }
                  },
                  icon: const Icon(Icons.add_task_rounded),
                  label: const Text('Publicar Novo Desafio Semanal'),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        Text(
          'Desafios Programados / Histórico (${_scheduledChallenges.length})',
          style: AppTextStyles.headingSm,
        ),
        const SizedBox(height: 8),
        ..._scheduledChallenges.take(8).map(
              (c) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (c['titulo'] ?? 'Desafio').toString(),
                            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            'Status: ${c['status'] ?? 'ATIVO'} • Foco: ${c['ingrediente'] ?? '-'}',
                            style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

        if (_weeklyParticipations.isNotEmpty) ...[
          const SizedBox(height: 18),
          Text(
            'Participações Recentes (${_weeklyParticipations.length})',
            style: AppTextStyles.headingSm,
          ),
          const SizedBox(height: 8),
          ..._weeklyParticipations.take(8).map(
                (p) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${p['nomeReceita'] ?? 'Prato'} • Chef ${p['usuario']?['nome'] ?? p['nomeUsuario'] ?? ''}',
                    style: AppTextStyles.body,
                  ),
                ),
              ),
        ],
      ],
    );
  }

  // ABA 3: EVENTOS ESPECIAIS & MODERAÇÃO
  Widget _buildSpecialEventsAdminTab() {
    final events = _api.specialEvents;

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 40),
      children: [
        Text('Gestão de Eventos Especiais & Moderação', style: AppTextStyles.headingSm),
        const SizedBox(height: 10),
        if (events.isEmpty)
          Text('Nenhum evento especial cadastrado.', style: AppTextStyles.bodyMuted)
        else
          ...events.map((ev) {
            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.proBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(ev.titulo, style: AppTextStyles.headingSm),
                      ),
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
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Inscritos: ${ev.inscricoes.length} • Votos: ${ev.totalVotos}',
                    style: AppTextStyles.bodyMuted,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () async {
                          final res = await _api.endAdminEventVoting(ev.id);
                          await _loadAdminAll();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                        icon: const Icon(Icons.timer_off_outlined, size: 16),
                        label: const Text('Encerrar Votação'),
                      ),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final res = await _api.confirmAdminEventResult(ev.id);
                          await _loadAdminAll();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.proGold,
                          foregroundColor: AppColors.darkDeep,
                        ),
                        icon: const Icon(Icons.emoji_events_rounded, size: 16),
                        label: const Text('Confirmar Resultado & Premiar'),
                      ),
                    ],
                  ),
                  if (ev.inscricoes.isNotEmpty) ...[
                    const Divider(height: 22, color: AppColors.glassBorder),
                    Text('Moderar Pratos Inscritos:', style: AppTextStyles.label),
                    const SizedBox(height: 8),
                    ...ev.inscricoes.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${entry.receitaTitulo} (${entry.usuarioNome}) • ${entry.statusModeracao}',
                                style: AppTextStyles.body.copyWith(fontSize: 12.5),
                              ),
                            ),
                            TextButton(
                              onPressed: () async {
                                final res = await _api.moderateAdminEventEntry(
                                  eventId: ev.id,
                                  entradaId: entry.id,
                                  acao: 'APROVAR',
                                );
                                await _loadAdminAll();
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(res.message)),
                                  );
                                }
                              },
                              child: const Text(
                                'Aprovar',
                                style: TextStyle(color: AppColors.success, fontSize: 12),
                              ),
                            ),
                            TextButton(
                              onPressed: () async {
                                final res = await _api.moderateAdminEventEntry(
                                  eventId: ev.id,
                                  entradaId: entry.id,
                                  acao: 'REJEITAR',
                                  motivoRejeicao: 'Fora do regulamento do evento',
                                );
                                await _loadAdminAll();
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(res.message)),
                                  );
                                }
                              },
                              child: const Text(
                                'Rejeitar',
                                style: TextStyle(color: AppColors.danger, fontSize: 12),
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
          }),

        if (_auditLogs.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Auditoria de Eventos (${_auditLogs.length})', style: AppTextStyles.headingSm),
          const SizedBox(height: 8),
          ..._auditLogs.take(10).map(
                (log) => Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${log['acao'] ?? 'AÇÃO'} • ${log['detalhes'] ?? ''}',
                    style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                  ),
                ),
              ),
        ],
      ],
    );
  }

  Widget _metricTile(String label, String val) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(val, style: AppTextStyles.monoLg.copyWith(fontSize: 17, color: AppColors.proGold)),
          Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
        ],
      ),
    );
  }
}
