import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/notifications_modal.dart';
import '../widgets/sabore_widgets.dart';
import 'admin_screen.dart';
import 'books_screen.dart';
import 'chef_ia_screen.dart';
import 'community_screen.dart';
import 'favorites_screen.dart';
import 'home_screen.dart';
import 'ia_fotos_screen.dart';
import 'import_video_screen.dart';
import 'profile_screen.dart';
import 'ranking_pro_screen.dart';
import 'settings_screen.dart';

/// Estrutura Principal do Dashboard Mobile (Sidebar idêntica ao Saboré Web + Topbar com
/// Sino de Notificações, Avatar com Moldura, Selo FREE/PRO + Bottom Navigation Bar)
class DashboardShell extends StatefulWidget {
  final VoidCallback onLogout;

  const DashboardShell({super.key, required this.onLogout});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  final ApiService _api = ApiService.instance;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  static const List<({int index, IconData icon, String title, bool isProHighlight})> _navItems = [
    (index: 0, icon: Icons.home_rounded, title: 'Início', isProHighlight: false),
    (index: 1, icon: Icons.menu_book_rounded, title: 'Meus Livros', isProHighlight: false),
    (index: 2, icon: Icons.groups_rounded, title: 'Comunidade', isProHighlight: false),
    (index: 3, icon: Icons.smart_toy_rounded, title: 'IA de Receitas', isProHighlight: false),
    (index: 4, icon: Icons.camera_alt_rounded, title: 'IA por Foto', isProHighlight: false),
    (index: 5, icon: Icons.ondemand_video_rounded, title: 'Importar Vídeo', isProHighlight: false),
    (index: 6, icon: Icons.favorite_rounded, title: 'Favoritas', isProHighlight: false),
    (index: 7, icon: Icons.person_rounded, title: 'Perfil', isProHighlight: false),
    (index: 8, icon: Icons.workspace_premium_rounded, title: 'Ranking PRO', isProHighlight: true),
    (index: 9, icon: Icons.settings_rounded, title: 'Configurações', isProHighlight: false),
  ];

  void _selectTab(int idx) {
    _api.setActiveTab(idx);
    if (_scaffoldKey.currentState?.isDrawerOpen == true) {
      Navigator.of(context).pop();
    }
  }

  String _currentTitle(int idx) {
    if (idx == 10) return 'Painel Admin';
    for (final item in _navItems) {
      if (item.index == idx) return item.title;
    }
    return 'Saboré';
  }

  Widget _buildActiveScreen(int idx) {
    switch (idx) {
      case 0:
        return HomeScreen(onNavigateTab: _selectTab);
      case 1:
        return const BooksScreen();
      case 2:
        return const CommunityScreen();
      case 3:
        return ChefIaScreen(onOpenRankingPro: () => _selectTab(8));
      case 4:
        return IaFotosScreen(onOpenRankingPro: () => _selectTab(8));
      case 5:
        return ImportVideoScreen(onOpenRankingPro: () => _selectTab(8));
      case 6:
        return FavoritesScreen(onExploreCommunity: () => _selectTab(2));
      case 7:
        return ProfileScreen(
          onOpenRankingPro: () => _selectTab(8),
          onOpenSettings: () => _selectTab(9),
        );
      case 8:
        return const RankingProScreen();
      case 9:
        return SettingsScreen(onLogout: widget.onLogout);
      case 10:
        return const AdminScreen();
      default:
        return HomeScreen(onNavigateTab: _selectTab);
    }
  }

  int _bottomBarIndex(int activeTab) {
    switch (activeTab) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
        return 2;
      case 3:
      case 4:
      case 5:
        return 3;
      case 8:
        return 4;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _api,
      builder: (context, _) {
        final user = _api.currentUser;
        final activeTab = _api.activeTabIndex;
        final unreadCount = _api.unreadNotificationsCount;

        return Scaffold(
          key: _scaffoldKey,
          backgroundColor: AppColors.darkDeep,
          drawer: _buildSidebarDrawer(user, activeTab),
          appBar: AppBar(
            leading: IconButton(
              tooltip: 'Menu Principal',
              icon: const Icon(Icons.menu_rounded, color: AppColors.secondary),
              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
            ),
            title: Row(
              children: [
                Flexible(
                  child: Text(
                    _currentTitle(activeTab),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            actions: [
              // Sino de Notificações com indicador de não lidas
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    tooltip: 'Notificações',
                    icon: const Icon(Icons.notifications_none_rounded, color: AppColors.secondary),
                    onPressed: () => showNotificationsModal(context),
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: 10,
                      top: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: AppColors.danger,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              IconButton(
                tooltip: 'Configurações',
                icon: const Icon(Icons.settings_outlined, color: AppColors.textMuted, size: 21),
                onPressed: () => _selectTab(9),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12, left: 4),
                child: GestureDetector(
                  onTap: () => _selectTab(7),
                  child: Row(
                    children: [
                      SaborePlanBadge(isPro: user?.isPro ?? false, compact: true),
                      const SizedBox(width: 8),
                      SaboreAvatar(
                        name: user?.nome ?? 'Chef',
                        imageSource: user?.fotoPerfil,
                        frameId: user?.molduraAtiva,
                        isPro: user?.isPro ?? false,
                        radius: 17,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(gradient: AppColors.darkBackgroundGradient),
            child: _buildActiveScreen(activeTab),
          ),
          bottomNavigationBar: Container(
            decoration: const BoxDecoration(
              color: AppColors.dark,
              border: Border(top: BorderSide(color: AppColors.glassBorder)),
            ),
            child: BottomNavigationBar(
              currentIndex: _bottomBarIndex(activeTab),
              type: BottomNavigationBarType.fixed,
              backgroundColor: AppColors.dark,
              selectedItemColor: AppColors.accent,
              unselectedItemColor: AppColors.textMuted,
              selectedFontSize: 11.5,
              unselectedFontSize: 11,
              onTap: (barIdx) {
                switch (barIdx) {
                  case 0:
                    _selectTab(0);
                    break;
                  case 1:
                    _selectTab(1);
                    break;
                  case 2:
                    _selectTab(2);
                    break;
                  case 3:
                    _selectTab(3);
                    break;
                  case 4:
                    _selectTab(8);
                    break;
                }
              },
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home_rounded),
                  label: 'Início',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.menu_book_outlined),
                  activeIcon: Icon(Icons.menu_book_rounded),
                  label: 'Meus Livros',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.explore_outlined),
                  activeIcon: Icon(Icons.explore_rounded),
                  label: 'Comunidade',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.smart_toy_outlined),
                  activeIcon: Icon(Icons.smart_toy_rounded),
                  label: 'Chef IA',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.workspace_premium_outlined),
                  activeIcon: Icon(Icons.workspace_premium_rounded),
                  label: 'Ranking PRO',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSidebarDrawer(dynamic user, int activeTab) {
    return Drawer(
      backgroundColor: AppColors.dark,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Topo do Menu Lateral com Logo e Slogan Saboré
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 14),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.asset(
                      'assets/images/logo_sabore.png',
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          gradient: AppColors.accentGradient,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.restaurant_menu_rounded, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Saboré', style: AppTextStyles.headingMd),
                        Text(
                          'Saboreie novas possibilidades',
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.glassBorder),

            // Lista Completa de Seções
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                children: [
                  ..._navItems.map((item) {
                    final selected = activeTab == item.index;
                    final isProTab = item.isProHighlight;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 4),
                      decoration: BoxDecoration(
                        gradient: selected
                            ? (isProTab ? AppColors.proGoldGradient : AppColors.accentGradient)
                            : null,
                        color: !selected && isProTab
                            ? AppColors.proGold.withValues(alpha: 0.08)
                            : null,
                        borderRadius: BorderRadius.circular(12),
                        border: !selected && isProTab
                            ? Border.all(color: AppColors.proBorder)
                            : null,
                      ),
                      child: ListTile(
                        dense: true,
                        leading: Icon(
                          item.icon,
                          color: selected
                              ? (isProTab ? AppColors.darkDeep : Colors.white)
                              : (isProTab ? AppColors.proGold : AppColors.secondary),
                          size: 20,
                        ),
                        title: Text(
                          item.title,
                          style: TextStyle(
                            fontWeight: selected || isProTab ? FontWeight.w800 : FontWeight.w500,
                            color: selected
                                ? (isProTab ? AppColors.darkDeep : Colors.white)
                                : (isProTab ? AppColors.proGold : AppColors.textPrimary),
                            fontSize: 13.5,
                          ),
                        ),
                        trailing: isProTab
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: selected
                                      ? AppColors.darkDeep.withValues(alpha: 0.2)
                                      : AppColors.proGold.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  'TOP 5',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w900,
                                    color: selected ? AppColors.darkDeep : AppColors.proGold,
                                  ),
                                ),
                              )
                            : null,
                        onTap: () => _selectTab(item.index),
                      ),
                    );
                  }),

                  // Aba condicional de Painel Admin
                  if (user?.isAdmin == true) ...[
                    const Divider(height: 20, color: AppColors.glassBorder),
                    ListTile(
                      dense: true,
                      leading: const Icon(Icons.admin_panel_settings_rounded, color: AppColors.proGold),
                      title: const Text(
                        'Painel Admin',
                        style: TextStyle(color: AppColors.proGold, fontWeight: FontWeight.w700),
                      ),
                      selected: activeTab == 10,
                      onTap: () => _selectTab(10),
                    ),
                  ],
                ],
              ),
            ),

            // Rodapé do Usuário Logado + Botão Sair
            Container(
              padding: const EdgeInsets.all(14),
              decoration: const BoxDecoration(
                color: AppColors.darkDeep,
                border: Border(top: BorderSide(color: AppColors.glassBorder)),
              ),
              child: Row(
                children: [
                  SaboreAvatar(
                    name: user?.nome ?? 'Chef Saboré',
                    imageSource: user?.fotoPerfil,
                    frameId: user?.molduraAtiva,
                    isPro: user?.isPro ?? false,
                    radius: 19,
                    onTap: () => _selectTab(7),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.nome ?? 'Chef Saboré',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        Text(
                          user?.email ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: 'Sair',
                    onPressed: widget.onLogout,
                    icon: const Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
