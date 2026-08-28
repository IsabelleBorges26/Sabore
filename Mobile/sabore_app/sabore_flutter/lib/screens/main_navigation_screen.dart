import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav_bar.dart';
import 'favorites_screen.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'publish_recipe_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _index = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    ProfileScreen(),
    PublishRecipeScreen(),
    FavoritesScreen(),
    ProfileScreen(),
  ];

  void _onTap(int index) {
    if (index == 2) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const PublishRecipeScreen()),
      );
      return;
    }
    setState(() => _index = index);
  }

  Color get _navBackground {
    switch (_index) {
      case 0:
      case 3:
        return AppColors.roseDark;
      default:
        return AppColors.darkGreenSurface;
    }
  }

  Color get _activeColor {
    switch (_index) {
      case 0:
      case 3:
        return AppColors.darkGreen;
      default:
        return AppColors.gold;
    }
  }

  Color get _inactiveColor {
    switch (_index) {
      case 0:
      case 3:
        return AppColors.textLightMuted;
      default:
        return AppColors.textLightMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: AppBottomNavBar(
        currentIndex: _index,
        onTap: _onTap,
        backgroundColor: _navBackground,
        activeColor: _activeColor,
        inactiveColor: _inactiveColor,
      ),
    );
  }
}
