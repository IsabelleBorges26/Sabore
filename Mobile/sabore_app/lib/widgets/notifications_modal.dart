import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'chef_profile_modal.dart';
import 'recipe_detail_modal.dart';

/// Central de Notificações Social & Sistema (`/social/notificacoes`)
Future<void> showNotificationsModal(BuildContext context) async {
  final api = ApiService.instance;
  await api.fetchNotifications();
  if (!context.mounted) return;

  final selectedIds = <String>{};

  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.dark,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          final items = api.notifications;
          final allSelected = items.isNotEmpty && selectedIds.length == items.length;

          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.72,
            minChildSize: 0.45,
            maxChildSize: 0.92,
            builder: (_, scrollCtrl) {
              return Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.glassBorderHover,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 16, 8),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_active_rounded, color: AppColors.accent),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text('Central de Notificações', style: AppTextStyles.headingMd),
                        ),
                        if (items.isNotEmpty)
                          TextButton(
                            onPressed: () async {
                              await api.markAllNotificationsAsRead();
                              setState(() {});
                            },
                            child: const Text('Marcar lidas', style: TextStyle(fontSize: 12.5)),
                          ),
                      ],
                    ),
                  ),
                  if (items.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: Row(
                        children: [
                          Checkbox(
                            value: allSelected,
                            onChanged: (v) {
                              setState(() {
                                if (v == true) {
                                  selectedIds.addAll(items.map((e) => e.id));
                                } else {
                                  selectedIds.clear();
                                }
                              });
                            },
                          ),
                          const Text('Selecionar todas', style: TextStyle(fontSize: 13)),
                          const Spacer(),
                          if (selectedIds.isNotEmpty)
                            TextButton.icon(
                              onPressed: () async {
                                await api.deleteNotificationsByIds(selectedIds);
                                setState(() => selectedIds.clear());
                              },
                              icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 18),
                              label: Text(
                                'Excluir (${selectedIds.length})',
                                style: const TextStyle(color: AppColors.danger, fontSize: 12.5),
                              ),
                            ),
                        ],
                      ),
                    ),
                  const Divider(height: 1, color: AppColors.glassBorder),
                  Expanded(
                    child: items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.notifications_none_rounded,
                                  size: 48,
                                  color: AppColors.textMuted,
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Nenhuma notificação no momento.',
                                  style: AppTextStyles.bodyMuted,
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: scrollCtrl,
                            padding: const EdgeInsets.all(14),
                            itemCount: items.length,
                            itemBuilder: (_, idx) {
                              final n = items[idx];
                              final isSel = selectedIds.contains(n.id);
                              IconData icon = Icons.favorite_rounded;
                              Color iconColor = AppColors.accent;
                              if (n.tipo.contains('SEGUIDOR')) {
                                icon = Icons.person_add_alt_1_rounded;
                                iconColor = AppColors.info;
                              } else if (n.tipo.contains('COMENT')) {
                                icon = Icons.chat_bubble_rounded;
                                iconColor = AppColors.secondary;
                              } else if (n.tipo.contains('AVAL')) {
                                icon = Icons.star_rounded;
                                iconColor = AppColors.warning;
                              } else if (n.tipo.contains('PRO')) {
                                icon = Icons.workspace_premium_rounded;
                                iconColor = AppColors.proGold;
                              }

                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: n.lida
                                      ? AppColors.darkCard
                                      : AppColors.accent.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: n.lida ? AppColors.glassBorder : AppColors.accentBorder,
                                  ),
                                ),
                                child: ListTile(
                                  leading: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Checkbox(
                                        value: isSel,
                                        onChanged: (v) {
                                          setState(() {
                                            if (v == true) {
                                              selectedIds.add(n.id);
                                            } else {
                                              selectedIds.remove(n.id);
                                            }
                                          });
                                        },
                                      ),
                                      CircleAvatar(
                                        radius: 18,
                                        backgroundColor: iconColor.withValues(alpha: 0.16),
                                        child: Icon(icon, color: iconColor, size: 18),
                                      ),
                                    ],
                                  ),
                                  title: Text(
                                    n.mensagem,
                                    style: AppTextStyles.body.copyWith(
                                      fontWeight: n.lida ? FontWeight.w400 : FontWeight.w700,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  subtitle: n.criadaEm.isNotEmpty
                                      ? Text(
                                          n.criadaEm.split('T').first,
                                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 11),
                                        )
                                      : null,
                                  onTap: () {
                                    n.lida = true;
                                    Navigator.of(ctx).pop();
                                    if (n.receitaId != null) {
                                      final rec = api.publicRecipes
                                              .where((r) => r.id == n.receitaId)
                                              .firstOrNull ??
                                          api.myRecipes
                                              .where((r) => r.id == n.receitaId)
                                              .firstOrNull;
                                      if (rec != null) {
                                        showRecipeDetailModal(context, rec);
                                        return;
                                      }
                                    }
                                    if (n.remetenteId != null) {
                                      showChefProfileModal(
                                        context,
                                        userId: n.remetenteId!,
                                        fallbackName: n.remetenteNome,
                                      );
                                    }
                                  },
                                ),
                              );
                            },
                          ),
                  ),
                ],
              );
            },
          );
        },
      );
    },
  );
}

