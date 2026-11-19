import 'package:flutter/material.dart';
import 'screens/auth_screens.dart';
import 'screens/dashboard_shell.dart';
import 'screens/landing_screen.dart';
import 'services/api_service.dart';
import 'services/oauth_helper.dart';
import 'theme/app_colors.dart';
import 'theme/app_theme.dart';

void main() async {
  ApiService.initialOAuthFragment = getBrowserUrlFragment();
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SaboreMobileApp());
}

class SaboreMobileApp extends StatefulWidget {
  const SaboreMobileApp({super.key});

  @override
  State<SaboreMobileApp> createState() => _SaboreMobileAppState();
}

enum _AppRouteState { loading, landing, login, register, dashboard }

class _SaboreMobileAppState extends State<SaboreMobileApp> {
  final ApiService _api = ApiService.instance;
  _AppRouteState _route = _AppRouteState.loading;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _api.initialize();
    if (!mounted) return;
    setState(() {
      _route = _api.isAuthenticated ? _AppRouteState.dashboard : _AppRouteState.landing;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Saboré — Cozinha Inteligente',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: _buildCurrentScreen(),
    );
  }

  Widget _buildCurrentScreen() {
    switch (_route) {
      case _AppRouteState.loading:
        return Scaffold(
          backgroundColor: AppColors.darkDeep,
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.asset(
                    'assets/images/logo_sabore.png',
                    width: 76,
                    height: 76,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.restaurant_menu_rounded,
                      size: 56,
                      color: AppColors.accent,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const CircularProgressIndicator(color: AppColors.accent),
              ],
            ),
          ),
        );

      case _AppRouteState.landing:
        return LandingScreen(
          onNavigateToLogin: () => setState(() => _route = _AppRouteState.login),
          onNavigateToRegister: () => setState(() => _route = _AppRouteState.register),
        );

      case _AppRouteState.login:
      case _AppRouteState.register:
        return AuthScreen(
          startOnRegister: _route == _AppRouteState.register,
          onBackToLanding: () => setState(() => _route = _AppRouteState.landing),
          onAuthenticated: () => setState(() => _route = _AppRouteState.dashboard),
        );

      case _AppRouteState.dashboard:
        return DashboardShell(
          onLogout: () async {
            await _api.logout();
            if (mounted) {
              setState(() => _route = _AppRouteState.landing);
            }
          },
        );
    }
  }
}
