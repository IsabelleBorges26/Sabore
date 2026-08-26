import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/app_text_field.dart';

class SearchNotFoundScreen extends StatelessWidget {
  final String query;
  final VoidCallback onRetry;

  const SearchNotFoundScreen({
    super.key,
    required this.query,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkGreen,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: onRetry,
                    child: const Icon(Icons.arrow_back_rounded,
                        color: AppColors.textLight),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text('Saboré', style: AppTextStyles.logo),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              AppTextField(
                hint: query,
                prefixIcon: Icons.search_rounded,
                fillColor: AppColors.darkGreenField,
              ),
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 140,
                        height: 140,
                        decoration: const BoxDecoration(
                          color: AppColors.darkGreenSurface,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.search_off_rounded,
                            size: 64, color: AppColors.gold),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Text('Resultado não encontrado',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.h1
                              .copyWith(color: AppColors.textLight)),
                      const SizedBox(height: AppSpacing.sm),
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg),
                        child: Text(
                          'Opa! Não encontramos um resultado referente a sua pesquisa. Digite novamente ou tente mais tarde.',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.body
                              .copyWith(color: AppColors.textLightMuted),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: onRetry,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.textDark,
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(AppRadius.pill),
                            ),
                          ),
                          child: Text('Voltar para a página inicial',
                              style: AppTextStyles.button),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
