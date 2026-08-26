import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';

class RecipeDetailScreen extends StatefulWidget {
  final Recipe recipe;
  const RecipeDetailScreen({super.key, required this.recipe});

  @override
  State<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen> {
  void _toggleFavorite() {
    setState(() => RecipeService.instance.toggleFavorite(widget.recipe));
  }

  @override
  Widget build(BuildContext context) {
    final recipe = widget.recipe;
    return Scaffold(
      backgroundColor: AppColors.gold,
      body: Column(
        children: [
          Stack(
            children: [
              SizedBox(
                height: 260,
                width: double.infinity,
                child: Image.network(
                  recipe.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      Container(color: AppColors.goldSurface),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _circleIcon(Icons.arrow_back_rounded,
                          () => Navigator.of(context).pop()),
                      GestureDetector(
                        onTap: _toggleFavorite,
                        child: _circleIconStatic(
                          recipe.isFavorite
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: AppColors.favoriteRed,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: AppColors.gold,
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(recipe.name,
                        style: AppTextStyles.h1
                            .copyWith(color: AppColors.textDark)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.access_time,
                            size: 16, color: AppColors.textDark),
                        const SizedBox(width: 4),
                        Text('${recipe.timeInMinutes} - ${recipe.servings}p',
                            style: AppTextStyles.bodySmall
                                .copyWith(color: AppColors.textDark)),
                        const SizedBox(width: 12),
                        const Icon(Icons.star_rounded,
                            size: 17, color: AppColors.textDark),
                        const SizedBox(width: 2),
                        Text(recipe.rating.toStringAsFixed(1),
                            style: AppTextStyles.bodySmall
                                .copyWith(color: AppColors.textDark)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _sectionCard(
                      title: 'Ingredientes',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: recipe.ingredients
                            .map((e) => _bulletItem(e))
                            .toList(),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    _sectionCard(
                      title: 'Utensílios',
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: recipe.utensils
                            .map((u) => Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppColors.chipBackground,
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.pill),
                                  ),
                                  child: Text(u, style: AppTextStyles.bodySmall),
                                ))
                            .toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTextStyles.h2),
          const SizedBox(height: AppSpacing.sm),
          child,
        ],
      ),
    );
  }

  Widget _bulletItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 6),
            child: Icon(Icons.circle, size: 6, color: AppColors.accentGreen),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: AppTextStyles.body)),
        ],
      ),
    );
  }

  Widget _circleIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(onTap: onTap, child: _circleIconStatic(icon));
  }

  Widget _circleIconStatic(IconData icon, {Color color = AppColors.textDark}) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        // ignore: deprecated_member_use
        color: Colors.white.withOpacity(0.9),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 20),
    );
  }
}
