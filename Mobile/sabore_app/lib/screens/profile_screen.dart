import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/chef_profile_modal.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Perfil do Usuário (`/usuarios/perfil`, `/usuarios/conquistas`, `/usuarios/molduras`,
/// `/usuarios/equipar-moldura`, `/social/meus-seguidores`, `/social/meus-seguindo`,
/// `/social/remover-seguidor/:id`, `#creations-grid`)
class ProfileScreen extends StatefulWidget {
  final VoidCallback onOpenRankingPro;
  final VoidCallback onOpenSettings;

  const ProfileScreen({
    super.key,
    required this.onOpenRankingPro,
    required this.onOpenSettings,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _api = ApiService.instance;
  late TextEditingController _bioCtrl;
  bool _savingBio = false;

  static const List<String> _allCulinaryTags = [
    'Culinária Italiana',
    'Massas Artesanais',
    'Confeitaria & Doces',
    'Churrasco & Grelhados',
    'Fit & Saudável',
    'Vegana & Plant-Based',
    'Frutos do Mar',
    'Pratos Rápidos',
    'Culinária Brasileira',
    'Panificação',
  ];

  static const List<({String? id, String label})> _frameOptions = [
    (id: null, label: 'Padrão Saboré'),
    (id: 'moldura-mestre-semanal', label: '🏆 Mestre da Semana'),
    (id: 'moldura-natal-2026', label: '🎄 Espírito Natalino 2026'),
    (id: 'moldura-reveillon-2027', label: '✨ Sabor da Virada 2027'),
  ];

  @override
  void initState() {
    super.initState();
    _bioCtrl = TextEditingController(text: _api.currentUser?.bio ?? '');
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    super.dispose();
  }

  Future<void> _showFollowersModal(bool showFollowers) async {
    var list = showFollowers
        ? await _api.fetchMyFollowers()
        : await _api.fetchMyFollowing();
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    showFollowers
                        ? 'Meus Seguidores (${list.length})'
                        : 'Chefs que Estou Seguindo (${list.length})',
                    style: AppTextStyles.headingMd,
                  ),
                  const SizedBox(height: 12),
                  if (list.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          showFollowers
                              ? 'Você ainda não possui seguidores.'
                              : 'Você ainda não está seguindo outros chefs.',
                          style: AppTextStyles.bodyMuted,
                        ),
                      ),
                    )
                  else
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: list.length,
                        itemBuilder: (_, idx) {
                          final c = list[idx];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: SaboreAvatar(
                              name: c.nome,
                              imageSource: c.fotoPerfil,
                              frameId: c.molduraAtiva,
                              isPro: c.isPro,
                              radius: 18,
                            ),
                            title: Text(c.nome, style: AppTextStyles.body),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (showFollowers)
                                  TextButton(
                                    onPressed: () async {
                                      final res = await _api.removeFollower(c.id);
                                      list = await _api.fetchMyFollowers();
                                      if (ctx.mounted) {
                                        setModalState(() {});
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(res.message)),
                                        );
                                      }
                                    },
                                    style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                    child: const Text('Remover', style: TextStyle(fontSize: 12)),
                                  )
                                else
                                  TextButton(
                                    onPressed: () async {
                                      final res = await _api.toggleFollowChef(
                                        c.id,
                                        currentlyFollowing: true,
                                      );
                                      list = await _api.fetchMyFollowing();
                                      if (ctx.mounted) {
                                        setModalState(() {});
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text(res.message)),
                                        );
                                      }
                                    },
                                    style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                                    child: const Text('Deixar de seguir', style: TextStyle(fontSize: 12)),
                                  ),
                                const Icon(Icons.chevron_right_rounded),
                              ],
                            ),
                            onTap: () {
                              Navigator.of(ctx).pop();
                              showChefProfileModal(context, userId: c.id, fallbackName: c.nome);
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _api.currentUser;
    if (user == null) return const SizedBox.shrink();

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () async {
        await Future.wait([
          _api.fetchUserProfile(),
          _api.fetchMyRecipes(),
          _api.fetchAchievementsAndFrames(),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 40),
        children: [
          // 1. Card Principal do Perfil
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Column(
              children: [
                SaboreAvatar(
                  name: user.nome,
                  imageSource: user.fotoPerfil,
                  frameId: user.molduraAtiva,
                  isPro: user.isPro,
                  radius: 44,
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton.icon(
                      onPressed: () async {
                        final picked = await showSaboreImagePicker(
                          context,
                          title: 'Escolher Nova Foto de Perfil',
                        );
                        if (picked != null) {
                          final res = await _api.updateProfile(fotoPerfilBase64: picked.dataUri);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.photo_camera_outlined, size: 16),
                      label: const Text('Alterar Foto', style: TextStyle(fontSize: 12.5)),
                    ),
                    if (user.fotoPerfil != null && user.fotoPerfil!.isNotEmpty)
                      TextButton.icon(
                        onPressed: () async {
                          final res = await _api.updateProfile(removerFoto: true);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                        style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                        icon: const Icon(Icons.delete_outline, size: 16),
                        label: const Text('Remover', style: TextStyle(fontSize: 12.5)),
                      ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        user.nome,
                        style: AppTextStyles.headingLg,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SaborePlanBadge(isPro: user.isPro),
                  ],
                ),
                const SizedBox(height: 4),
                Text(user.email, style: AppTextStyles.bodyMuted),
                const SizedBox(height: 16),

                // Contadores Sociais
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                  decoration: BoxDecoration(
                    color: AppColors.darkDeep.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      InkWell(
                        onTap: () => _showFollowersModal(true),
                        child: _counterColumn('${user.seguidoresCount}', 'Seguidores'),
                      ),
                      Container(width: 1, height: 26, color: AppColors.glassBorder),
                      InkWell(
                        onTap: () => _showFollowersModal(false),
                        child: _counterColumn('${user.seguindoCount}', 'Seguindo'),
                      ),
                      Container(width: 1, height: 26, color: AppColors.glassBorder),
                      _counterColumn('${_api.myRecipes.length}', 'Minhas Criações'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. Mini-Card do Ranking PRO Mensal
          InkWell(
            onTap: widget.onOpenRankingPro,
            borderRadius: BorderRadius.circular(18),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppColors.proBannerGradient,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.proBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.emoji_events_rounded, color: AppColors.proGold, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Desempenho no Ranking PRO Mensal',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.proGold,
                          ),
                        ),
                        Text(
                          'Posição atual: ${user.posicaoRanking != null ? '#${user.posicaoRanking}' : 'Em apuração'} • ${user.pontosMensais} pontos no mês',
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 12.5),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, color: AppColors.proGold),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // 3. Molduras Comemorativas & Emblemas (/usuarios/equipar-moldura)
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
                Text('Moldura do Avatar & Emblemas', style: AppTextStyles.headingSm),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _frameOptions.map((f) {
                    final selected = (user.molduraAtiva == null || user.molduraAtiva == 'none')
                        ? f.id == null
                        : user.molduraAtiva == f.id;
                    return ChoiceChip(
                      label: Text(f.label, style: const TextStyle(fontSize: 12)),
                      selected: selected,
                      selectedColor: AppColors.accent,
                      onSelected: (_) async {
                        final res = await _api.equipProfileFrame(f.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(res.message)),
                          );
                        }
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    _badgePreview('assets/images/espirito-natalino-2026.png', 'Espírito Natalino'),
                    const SizedBox(width: 12),
                    _badgePreview('assets/images/sabor-da-virada-2027.png', 'Sabor da Virada'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // 4. Bio Culinária & Preferências Gastronômicas
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
                Text('Minha Bio Culinária', style: AppTextStyles.headingSm),
                const SizedBox(height: 8),
                TextField(
                  controller: _bioCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    hintText:
                        'Conte sobre sua paixão pela gastronomia e seus pratos favoritos...',
                  ),
                ),
                const SizedBox(height: 14),
                Text('Preferências & Especialidades', style: AppTextStyles.headingSm),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _allCulinaryTags.map((tag) {
                    final active = user.preferencias.contains(tag);
                    return FilterChip(
                      label: Text(tag, style: const TextStyle(fontSize: 12)),
                      selected: active,
                      selectedColor: AppColors.accent.withValues(alpha: 0.28),
                      checkmarkColor: Colors.white,
                      onSelected: (v) async {
                        final updated = List<String>.from(user.preferencias);
                        if (v) {
                          updated.add(tag);
                        } else {
                          updated.remove(tag);
                        }
                        await _api.updateProfile(
                          bio: _bioCtrl.text,
                          preferencias: updated,
                        );
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton.icon(
                    onPressed: _savingBio
                        ? null
                        : () async {
                            setState(() => _savingBio = true);
                            final res = await _api.updateProfile(
                              bio: _bioCtrl.text,
                              preferencias: user.preferencias,
                            );
                            if (context.mounted) {
                              setState(() => _savingBio = false);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(res.message)),
                              );
                            }
                          },
                    icon: const Icon(Icons.save_outlined, size: 17),
                    label: Text(_savingBio ? 'Salvando...' : 'Salvar Bio'),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),

          // 5. Grid Minhas Criações (#creations-grid)
          Text('Minhas Criações (${_api.myRecipes.length})', style: AppTextStyles.headingSm),
          const SizedBox(height: 10),
          if (_api.myRecipes.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'Você ainda não cadastrou receitas. Crie receitas na aba Meus Livros ou com o Chef IA!',
                style: AppTextStyles.bodyMuted,
              ),
            )
          else
            ..._api.myRecipes.map(
              (r) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(10),
                  leading: SaboreImage(
                    imageSource: r.imagem,
                    width: 64,
                    height: 64,
                    borderRadius: BorderRadius.circular(10),
                    fallbackLabel: r.titulo,
                  ),
                  title: Text(
                    r.titulo,
                    style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    r.publica ? '🌐 Pública na Comunidade' : '🔒 Privada no Livro',
                    style: TextStyle(
                      fontSize: 12,
                      color: r.publica ? AppColors.success : AppColors.textMuted,
                    ),
                  ),
                  trailing: PopupMenuButton<String>(
                    color: AppColors.darkCard,
                    onSelected: (action) async {
                      if (action == 'toggle') {
                        final res = await _api.toggleRecipePublic(r);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(res.message)),
                          );
                        }
                      } else if (action == 'delete') {
                        final res = await _api.deleteRecipe(r.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(res.message)),
                          );
                        }
                      }
                    },
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        value: 'toggle',
                        child: Text(
                          r.publica ? 'Ocultar da Comunidade' : 'Publicar na Comunidade',
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text(
                          'Excluir Receita',
                          style: TextStyle(color: AppColors.danger),
                        ),
                      ),
                    ],
                  ),
                  onTap: () => showRecipeDetailModal(context, r),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _counterColumn(String val, String label) {
    return Column(
      children: [
        Text(val, style: AppTextStyles.monoLg.copyWith(fontSize: 18, color: AppColors.secondary)),
        Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
      ],
    );
  }

  Widget _badgePreview(String assetPath, String title) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.darkDeep,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                assetPath,
                width: 36,
                height: 36,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.emoji_events_rounded, color: AppColors.proGold),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: AppTextStyles.body.copyWith(fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
