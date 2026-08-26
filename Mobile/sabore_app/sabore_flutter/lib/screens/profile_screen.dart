import 'package:flutter/material.dart';
import '../data/mock_data.dart';
import '../models/recipe.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _openDetail(BuildContext context, Recipe recipe) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => RecipeDetailScreen(recipe: recipe)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = MockData.currentUser;
    return Scaffold(
      backgroundColor: AppColors.darkGreen,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: NetworkImage(user.avatarUrl),
                  backgroundColor: AppColors.darkGreenField,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.name,
                          style: AppTextStyles.h1
                              .copyWith(color: AppColors.textLight)),
                      Text(user.bio,
                          style: AppTextStyles.bodySmall
                              .copyWith(color: AppColors.textLightMuted)),
                    ],
                  ),
                ),
                const Icon(Icons.settings_outlined,
                    color: AppColors.textLight),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Meu Livro de Receitas',
                    style:
                        AppTextStyles.h2.copyWith(color: AppColors.textLight)),
                Text('Ver todas',
                    style: AppTextStyles.bodySmall
                        .copyWith(color: AppColors.gold)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            SizedBox(
              height: 175,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: MockData.myBook.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
                itemBuilder: (_, i) {
                  final recipe = MockData.myBook[i];
                  return RecipeCard(
                    recipe: recipe,
                    onTap: () => _openDetail(context, recipe),
                  );
                },
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Receitas já publicadas',
                    style:
                        AppTextStyles.h2.copyWith(color: AppColors.textLight)),
                Text('Ver todas',
                    style: AppTextStyles.bodySmall
                        .copyWith(color: AppColors.gold)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: AppSpacing.sm,
                crossAxisSpacing: AppSpacing.sm,
                childAspectRatio: 0.78,
              ),
              itemCount: MockData.published.length,
              itemBuilder: (_, i) {
                final recipe = MockData.published[i];
                return RecipeCard(
                  recipe: recipe,
                  width: double.infinity,
                  onTap: () => _openDetail(context, recipe),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
