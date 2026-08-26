import 'package:flutter/material.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/app_text_field.dart';
import '../widgets/recipe_card.dart';
import 'recipe_detail_screen.dart';
import 'search_not_found_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  List<Recipe> _results = [];
  String _query = '';

  void _runSearch(String value) {
    setState(() {
      _query = value;
      _results = RecipeService.instance.search(value);
    });
  }

  void _openDetail(Recipe recipe) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => RecipeDetailScreen(recipe: recipe)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool showEmptyState = _query.isNotEmpty && _results.isEmpty;

    if (showEmptyState) {
      return SearchNotFoundScreen(
        query: _query,
        onRetry: () => setState(() {
          _query = '';
          _controller.clear();
        }),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.rose,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).maybePop(),
                    child: const Icon(Icons.arrow_back_rounded,
                        color: AppColors.textLight),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text('Saboré', style: AppTextStyles.logo),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              AppTextField(
                hint: 'Pesquisar receita',
                controller: _controller,
                prefixIcon: Icons.search_rounded,
                suffixIcon: IconButton(
                  icon: const Icon(Icons.tune_rounded,
                      color: AppColors.textMuted),
                  onPressed: () {},
                ),
                keyboardType: TextInputType.text,
              ),
              const SizedBox(height: AppSpacing.md),
              Wrap(
                children: [
                  TextButton(
                    onPressed: () => _runSearch(_controller.text),
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      foregroundColor: AppColors.textLight,
                    ),
                    child: const Text('Buscar'),
                  ),
                ],
              ),
              if (_results.isNotEmpty) ...[
                Text('Resultados para:',
                    style: AppTextStyles.bodySmall
                        .copyWith(color: AppColors.textLightMuted)),
                Text('"$_query"',
                    style: AppTextStyles.h2
                        .copyWith(color: AppColors.textLight)),
                const SizedBox(height: AppSpacing.md),
                Expanded(
                  child: ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (_, i) {
                      final recipe = _results[i];
                      return RecipeListTile(
                        recipe: recipe,
                        onTap: () => _openDetail(recipe),
                      );
                    },
                  ),
                ),
              ] else
                Expanded(
                  child: Center(
                    child: Text(
                      'Digite algo para buscar receitas',
                      style: AppTextStyles.body
                          .copyWith(color: AppColors.textLightMuted),
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
