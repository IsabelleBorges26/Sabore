import 'package:flutter/material.dart';
import '../services/recipe_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  Widget build(BuildContext context) {
    final favorites = RecipeService.instance.favorites;

    return Scaffold(
      backgroundColor: AppColors.rose,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Favoritos',
                  style: AppTextStyles.h1.copyWith(color: AppColors.textLight)),
              const SizedBox(height: AppSpacing.md),
              Expanded(
                child: favorites.isEmpty
                    ? Center(
                        child: Text(
                          'Você ainda não favoritou nenhuma receita.',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.body
                              .copyWith(color: AppColors.textLightMuted),
                        ),
                      )
                    : GridView.builder(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: AppSpacing.sm,
                          crossAxisSpacing: AppSpacing.sm,
                          childAspectRatio: 0.78,
                        ),
                        itemCount: favorites.length,
                        itemBuilder: (_, i) {
                          final recipe = favorites[i];
                          return RecipeCard(
                            recipe: recipe,
                            width: double.infinity,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) =>
                                      RecipeDetailScreen(recipe: recipe)),
                            ),
                            onFavoriteTap: () => setState(() =>
                                RecipeService.instance.toggleFavorite(recipe)),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
