import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/app_text_field.dart';
import 'main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _userController = TextEditingController();
  final TextEditingController _passController = TextEditingController();

  void _handleLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
    );
  }

  @override
  void dispose() {
    _userController.dispose();
    _passController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkGreen,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 90,
                      height: 90,
                      decoration: const BoxDecoration(
                        color: AppColors.darkGreenSurface,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.restaurant_menu_rounded,
                          color: AppColors.gold, size: 40),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Saboré', style: AppTextStyles.logo.copyWith(fontSize: 30)),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Bem-Vindo ao Saboré!',
                textAlign: TextAlign.center,
                style: AppTextStyles.h1.copyWith(color: AppColors.textLight),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text('Nome do usuário',
                  style: AppTextStyles.bodySmall
                      .copyWith(color: AppColors.textLightMuted)),
              const SizedBox(height: 6),
              AppTextField(
                hint: 'Digite seu nome',
                controller: _userController,
                fillColor: AppColors.darkGreenField,
                labelColor: AppColors.textLight,
              ),
              const SizedBox(height: AppSpacing.md),
              Text('Senha',
                  style: AppTextStyles.bodySmall
                      .copyWith(color: AppColors.textLightMuted)),
              const SizedBox(height: 6),
              AppTextField(
                hint: 'Digite sua senha',
                obscureText: true,
                controller: _passController,
                fillColor: AppColors.darkGreenField,
                labelColor: AppColors.textLight,
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _handleLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.gold,
                    foregroundColor: AppColors.textDark,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
                  child: Text('Entrar', style: AppTextStyles.button),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Center(
                child: Text('Esqueceu a senha?',
                    style: AppTextStyles.link
                        .copyWith(color: AppColors.textLightMuted)),
              ),
              const SizedBox(height: AppSpacing.sm),
              Center(
                child: RichText(
                  text: TextSpan(
                    style: AppTextStyles.bodySmall
                        .copyWith(color: AppColors.textLightMuted),
                    children: [
                      const TextSpan(text: 'Não possui uma conta? '),
                      TextSpan(
                        text: 'Cadastre-se aqui',
                        style: AppTextStyles.link
                            .copyWith(color: AppColors.gold),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _socialIcon(Icons.g_mobiledata_rounded),
                  const SizedBox(width: AppSpacing.md),
                  _socialIcon(Icons.facebook_rounded),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _socialIcon(IconData icon) {
    return Container(
      width: 46,
      height: 46,
      decoration: const BoxDecoration(
        color: AppColors.darkGreenField,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: AppColors.textLight),
    );
  }
}
