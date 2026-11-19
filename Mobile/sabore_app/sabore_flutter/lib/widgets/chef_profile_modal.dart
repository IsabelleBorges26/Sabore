import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'recipe_detail_modal.dart';
import 'sabore_widgets.dart';

/// Modal global de Perfil de Chef da Comunidade (`openUserProfile` do Saboré Web)
Future<void> showChefProfileModal(
  BuildContext context, {
  required int userId,
  String? fallbackName,
}) async {
  final api = ApiService.instance;

  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.dark,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return _ChefProfileSheetContent(userId: userId, fallbackName: fallbackName, api: api);
    },
  );
}

class _ChefProfileSheetContent extends StatefulWidget {
  final int userId;
  final String? fallbackName;
  final ApiService api;

  const _ChefProfileSheetContent({
    required this.userId,
    this.fallbackName,
    required this.api,
  });

  @override
  State<_ChefProfileSheetContent> createState() => _ChefProfileSheetContentState();
}

class _ChefProfileSheetContentState extends State<_ChefProfileSheetContent> {
  ChefProfile? _profile;
  bool _loading = true;
  bool _togglingFollow = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final res = await widget.api.fetchChefProfileDetails(widget.userId);
    if (mounted) {
      setState(() {
        _profile = res ??
            widget.api.featuredChefs.where((c) => c.id == widget.userId).firstOrNull ??
            ChefProfile(id: widget.userId, nome: widget.fallbackName ?? 'Chef Saboré');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMe = widget.api.currentUser?.id == widget.userId;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.78,
      minChildSize: 0.5,
      maxChildSize: 0.94,
      builder: (context, scrollController) {
        if (_loading) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.accent),
          );
        }
        final p = _profile!;
        final publicRecs = p.receitasPublicas.isNotEmpty
            ? p.receitasPublicas
            : widget.api.publicRecipes.where((r) => r.autorId == p.id).toList();

        return ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 32),
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.glassBorderHover,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                SaboreAvatar(
                  name: p.nome,
                  imageSource: p.fotoPerfil,
                  frameId: p.molduraAtiva,
                  isPro: p.isPro,
                  radius: 36,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              p.nome,
                              style: AppTextStyles.headingMd,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          SaborePlanBadge(isPro: p.isPro, compact: true),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Chef da Comunidade Saboré',
                        style: AppTextStyles.bodyMuted,
                      ),
                    ],
                  ),
                ),
                if (!isMe)
                  ElevatedButton.icon(
                    onPressed: _togglingFollow
                        ? null
                        : () async {
                            setState(() => _togglingFollow = true);
                            final res = await widget.api.toggleFollowChef(p.id);
                            await _load();
                            if (mounted) {
                              setState(() => _togglingFollow = false);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(res.message)),
                              );
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: p.seguindo ? AppColors.surface : AppColors.accent,
                      foregroundColor: Colors.white,
                    ),
                    icon: Icon(
                      p.seguindo ? Icons.check_rounded : Icons.person_add_alt_1_rounded,
                      size: 16,
                    ),
                    label: Text(p.seguindo ? 'Seguindo' : 'Seguir'),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _statItem('${p.seguidoresCount}', 'Seguidores'),
                  Container(width: 1, height: 28, color: AppColors.glassBorder),
                  _statItem('${p.seguindoCount}', 'Seguindo'),
                  Container(width: 1, height: 28, color: AppColors.glassBorder),
                  _statItem('${publicRecs.length}', 'Receitas Públicas'),
                ],
              ),
            ),
            if (p.conquistas.isNotEmpty) ...[
              const SizedBox(height: 18),
              Text('Emblemas & Conquistas', style: AppTextStyles.subtitle),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: p.conquistas.map((c) {
                  final nome = (c['titulo'] ?? c['nome'] ?? 'Conquista').toString();
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.proGold.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.proBorder),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.emoji_events_rounded, color: AppColors.proGold, size: 15),
                        const SizedBox(width: 6),
                        Text(nome, style: const TextStyle(color: AppColors.secondary, fontSize: 12)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
            const SizedBox(height: 22),
            Text(
              'Receitas Publicadas (${publicRecs.length})',
              style: AppTextStyles.headingSm,
            ),
            const SizedBox(height: 12),
            if (publicRecs.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Text(
                  'Este chef ainda não publicou receitas abertas na comunidade.',
                  style: AppTextStyles.bodyMuted,
                ),
              )
            else
              ...publicRecs.map(
                (r) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.glassBorder),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(10),
                    leading: SaboreImage(
                      imageSource: r.imagem,
                      width: 60,
                      height: 60,
                      borderRadius: BorderRadius.circular(10),
                      fallbackLabel: r.titulo,
                    ),
                    title: Text(
                      r.titulo,
                      style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(
                      '⏱ ${r.tempoPreparo} min • ⭐ ${r.mediaAvaliacoes.toStringAsFixed(1)} (${r.totalAvaliacoes})',
                      style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.secondary),
                    onTap: () {
                      Navigator.of(context).pop();
                      showRecipeDetailModal(context, r);
                    },
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _statItem(String val, String label) {
    return Column(
      children: [
        Text(val, style: AppTextStyles.monoLg.copyWith(fontSize: 18, color: AppColors.secondary)),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
      ],
    );
  }
}

