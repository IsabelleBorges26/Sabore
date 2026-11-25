import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/chef_profile_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Ranking PRO & Planos (`/planos/ranking`, `/planos/historico-atividades`)
/// Reúne o conteúdo completo do Menu PRO + Comparativo FREE vs PRO + Pódio Top 5 + Ranking Geral.
class RankingProScreen extends StatefulWidget {
  const RankingProScreen({super.key});

  @override
  State<RankingProScreen> createState() => _RankingProScreenState();
}

class _RankingProScreenState extends State<RankingProScreen> {
  final ApiService _api = ApiService.instance;

  String _daysUntilEndOfMonth() {
    final now = DateTime.now();
    final nextMonth = DateTime(now.year, now.month + 1, 1);
    final diff = nextMonth.difference(now);
    return '${diff.inDays}d ${diff.inHours % 24}h restantes';
  }

  void _openScoringRulesModal() {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.emoji_events_rounded, color: AppColors.proGold),
              const SizedBox(width: 8),
              Expanded(
                  child: Text('Como Conquistar Pontos PRO',
                      style: AppTextStyles.headingSm)),
            ],
          ),
          content: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.65,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _ruleRow('Publicar uma receita válida', '+10 pts'),
                  _ruleRow('Receber avaliação ou comentário', '+3 pts'),
                  _ruleRow('Receber favorito em uma receita', '+2 pts'),
                  _ruleRow('Acessar em dias diferentes', '+2 pts/dia'),
                  _ruleRow('Completar o perfil', '+5 pts'),
                  _ruleRow('Seguir outro cozinheiro', '+1 pt'),
                  _ruleRow('Participar do Desafio da Semana', '+30 pts'),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.proGold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.proBorder),
                    ),
                    child: const Text(
                      'Os 5 chefs com mais pontos no fechamento mensal ganham 30 dias de Saboré PRO para o mês seguinte.',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Entendi!'),
            ),
          ],
        );
      },
    );
  }

  void _openMyHistoryModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final acts = _api.myActivities;
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.history_rounded, color: AppColors.proGold),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('Meu Histórico de Pontos no Mês',
                        style: AppTextStyles.headingMd),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: acts.isEmpty
                    ? Center(
                        child: Text(
                          'Nenhuma atividade pontuada neste mês ainda. Publique receitas ou participe do Desafio Semanal!',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodyMuted,
                        ),
                      )
                    : ListView.builder(
                        itemCount: acts.length,
                        itemBuilder: (_, idx) {
                          final a = acts[idx];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor:
                                  AppColors.proGold.withValues(alpha: 0.16),
                              child: Text(
                                '+${a.pontos}',
                                style: const TextStyle(
                                  color: AppColors.proGold,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            title: Text(a.descricao, style: AppTextStyles.body),
                            subtitle: Text(
                              a.criadoEm.split('T').first,
                              style: AppTextStyles.bodyMuted
                                  .copyWith(fontSize: 11.5),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _api.currentUser;
    final ranking = _api.rankingList;
    final myPos = user?.posicaoRanking ??
        ranking.where((r) => r.usuarioId == user?.id).firstOrNull?.posicao;
    final myPoints = user?.pontosMensais ??
        ranking.where((r) => r.usuarioId == user?.id).firstOrNull?.pontos ??
        0;
    final inProZone = myPos != null && myPos <= 5;

    return RefreshIndicator(
      color: AppColors.proGold,
      onRefresh: _api.fetchRankingPro,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 40),
        children: [
          // 1. Hero Menu PRO & Ranking Mensal
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
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: AppColors.proGoldGradient,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'MENU PRO & RANKING DE MÉRITO',
                        style: TextStyle(
                          color: AppColors.darkDeep,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '⏳ ${_daysUntilEndOfMonth()}',
                      style: AppTextStyles.mono
                          .copyWith(color: AppColors.proGold, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Libere a cozinha! Conquiste o Saboré PRO por mérito',
                  style: AppTextStyles.headingLg,
                ),
                const SizedBox(height: 6),
                Text(
                  'Todo mês, os 5 chefs mais engajados da comunidade ganham 30 dias de assinatura Saboré PRO 100% gratuita!',
                  style: AppTextStyles.bodyMuted,
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 8,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _openScoringRulesModal,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.proGold,
                        side: const BorderSide(color: AppColors.proBorder),
                      ),
                      icon: const Icon(Icons.help_outline_rounded, size: 17),
                      label: const Text('Regras de Pontuação'),
                    ),
                    OutlinedButton.icon(
                      onPressed: _openMyHistoryModal,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.secondary,
                      ),
                      icon: const Icon(Icons.history_rounded, size: 17),
                      label: const Text('Meu Extrato de Pontos'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Faixa de Desempenho do Usuário Logado
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: inProZone ? AppColors.proGold : AppColors.glassBorder,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _userRankStat('Sua Posição', myPos != null ? '#$myPos' : '—'),
                Container(width: 1, height: 30, color: AppColors.glassBorder),
                _userRankStat('Seus Pontos', '$myPoints pts'),
                Container(width: 1, height: 30, color: AppColors.glassBorder),
                _userRankStat(
                  'Status Mensal',
                  inProZone ? '🔥 Zona PRO (G-5)' : 'Fora do G-5',
                  highlight: inProZone,
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),

          // 3. Comparativo Completo de Planos (FREE vs Saboré PRO)
          Text('Comparativo de Planos Saboré', style: AppTextStyles.headingSm),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Card FREE
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SaborePlanBadge(isPro: false, compact: true),
                      const SizedBox(height: 8),
                      Text('Plano FREE', style: AppTextStyles.headingSm),
                      Text('Gratuito para sempre',
                          style:
                              AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
                      const Divider(height: 20, color: AppColors.glassBorder),
                      _planBullet('Chef IA: 5 msgs/mês'),
                      _planBullet('IA por Foto: 2/mês'),
                      _planBullet('Importar Vídeo: 2/mês'),
                      _planBullet('Livros e Favoritas'),
                      _planBullet('Desafios Semanais'),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Card PRO
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: AppColors.proBannerGradient,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.proGold, width: 1.4),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SaborePlanBadge(isPro: true, compact: true),
                      const SizedBox(height: 8),
                      Text('Saboré PRO',
                          style: AppTextStyles.headingSm
                              .copyWith(color: AppColors.proGold)),
                      Text('Top 5 do Ranking Mensal',
                          style:
                              AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
                      const Divider(height: 20, color: AppColors.proBorder),
                      _planBullet('Chef IA Ilimitado', isPro: true),
                      _planBullet('IA por Foto Ilimitado', isPro: true),
                      _planBullet('Importar Vídeo Ilimitado', isPro: true),
                      _planBullet('Selo & Moldura PRO', isPro: true),
                      _planBullet('Destaque na Comunidade', isPro: true),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // 4. Top 5 Pódio (Zona de Premiação PRO)
          Row(
            children: [
              const Icon(Icons.workspace_premium_rounded,
                  color: AppColors.proGold),
              const SizedBox(width: 8),
              Text('Top 5 — Zona de Premiação PRO (G-5)',
                  style: AppTextStyles.headingSm),
            ],
          ),
          const SizedBox(height: 10),
          if (ranking.isEmpty)
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'O ranking deste mês está começando! Publique uma receita ou participe do Desafio da Semana para assumir o 1º lugar!',
                style: AppTextStyles.bodyMuted,
              ),
            )
          else ...[
            ...ranking.take(5).map((r) => _buildRankingRow(r, isTop5: true)),
            if (ranking.length > 5) ...[
              const SizedBox(height: 18),
              Text('Classificação Geral da Comunidade',
                  style: AppTextStyles.headingSm),
              const SizedBox(height: 10),
              ...ranking.skip(5).map((r) => _buildRankingRow(r, isTop5: false)),
            ],
          ],
        ],
      ),
    );
  }

  Widget _userRankStat(String label, String val, {bool highlight = false}) {
    return Column(
      children: [
        Text(
          val,
          style: AppTextStyles.mono.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: highlight ? AppColors.proGold : AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11)),
      ],
    );
  }

  Widget _planBullet(String text, {bool isPro = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.check_circle_rounded,
            size: 15,
            color: isPro ? AppColors.proGold : AppColors.accent,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.body.copyWith(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankingRow(RankingEntry entry, {required bool isTop5}) {
    final medalColors = {
      1: const Color(0xFFFFD700),
      2: const Color(0xFFC0C0C0),
      3: const Color(0xFFCD7F32),
    };
    final posColor = medalColors[entry.posicao] ??
        (isTop5 ? AppColors.proGold : AppColors.textMuted);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isTop5 ? AppColors.darkCard : AppColors.darkCardAlt,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isTop5 ? AppColors.proBorder : AppColors.glassBorder,
        ),
      ),
      child: ListTile(
        onTap: entry.usuarioId > 0
            ? () => showChefProfileModal(context,
                userId: entry.usuarioId, fallbackName: entry.nome)
            : null,
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 30,
              child: Text(
                '#${entry.posicao}',
                style: AppTextStyles.mono.copyWith(
                  color: posColor,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ),
            SaboreAvatar(
              name: entry.nome,
              imageSource: entry.fotoPerfil,
              frameId: entry.molduraAtiva,
              isPro: entry.plano == 'PRO' || isTop5,
              radius: 19,
            ),
          ],
        ),
        title: Row(
          children: [
            Flexible(
              child: Text(
                entry.nome,
                style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isTop5) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.proGold.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'G-5 PRO',
                  style: TextStyle(
                    color: AppColors.proGold,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ],
        ),
        subtitle: Text(
          '${entry.totalAtividades} atividades no mês',
          style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
        ),
        trailing: Text(
          '${entry.pontos} pts',
          style: AppTextStyles.mono.copyWith(
            color: isTop5 ? AppColors.proGold : AppColors.secondary,
            fontWeight: FontWeight.w800,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _ruleRow(String label, String pts) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(label, style: AppTextStyles.body)),
          Text(
            pts,
            style: AppTextStyles.mono.copyWith(
              color: AppColors.proGold,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
