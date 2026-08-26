import 'package:flutter/material.dart';
import '../data/mock_data.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/app_text_field.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';
import 'search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  void _openDetail(Recipe recipe) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => RecipeDetailScreen(recipe: recipe)),
    );
  }

  void _toggleFavorite(Recipe recipe) {
    setState(() => RecipeService.instance.toggleFavorite(recipe));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.rose,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Saboré', style: AppTextStyles.logo),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            // ignore: deprecated_member_use
                            color: Colors.white.withOpacity(0.25),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.notifications_none_rounded,
                              color: AppColors.textLight),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const SearchScreen()),
                      ),
                      child: AbsorbPointer(
                        child: AppTextField(
                          hint: 'Pesquisar receita',
                          prefixIcon: Icons.search_rounded,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text('Receitas do dia',
                        style: AppTextStyles.h2
                            .copyWith(color: AppColors.textLight)),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 175,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: MockData.recent.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (_, i) {
                    final recipe = MockData.recent[i];
                    return RecipeCard(
                      recipe: recipe,
                      onTap: () => _openDetail(recipe),
                      onFavoriteTap: () => _toggleFavorite(recipe),
                    );
                  },
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.sm),
                child: Text('Receitas Populares',
                    style:
                        AppTextStyles.h2.copyWith(color: AppColors.textLight)),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpacing.sm,
                  crossAxisSpacing: AppSpacing.sm,
                  childAspectRatio: 0.78,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final recipe = MockData.popular[i];
                    return RecipeCard(
                      recipe: recipe,
                      width: double.infinity,
                      onTap: () => _openDetail(recipe),
                      onFavoriteTap: () => _toggleFavorite(recipe),
                    );
                  },
                  childCount: MockData.popular.length,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.sm),
                child: Text('Sobremesas',
                    style:
                        AppTextStyles.h2.copyWith(color: AppColors.textLight)),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 175,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: MockData.recipes.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (_, i) {
                    final recipe = MockData.recipes[i];
                    return RecipeCard(
                      recipe: recipe,
                      onTap: () => _openDetail(recipe),
                      onFavoriteTap: () => _toggleFavorite(recipe),
                    );
                  },
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.lg)),
          ],
        ),
      ),
    );
  }
}
