import 'package:flutter/material.dart';
import '../data/mock_data.dart';
import '../models/recipe.dart';
import '../services/recipe_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';
import '../widgets/app_text_field.dart';
import '../widgets/tag_chip.dart';

class PublishRecipeScreen extends StatefulWidget {
  const PublishRecipeScreen({super.key});

  @override
  State<PublishRecipeScreen> createState() => _PublishRecipeScreenState();
}

class _PublishRecipeScreenState extends State<PublishRecipeScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _utensilController = TextEditingController();
  final TextEditingController _tagController = TextEditingController();
  final TextEditingController _ingredientController = TextEditingController();

  String _category = 'Café da manhã';
  final List<String> _categories = [
    'Café da manhã',
    'Almoço',
    'Sobremesa',
    'Saudável',
  ];

  final List<String> _tags = [];
  final List<String> _ingredients = [];

  void _addTag() {
    final value = _tagController.text.trim();
    if (value.isEmpty) return;
    setState(() {
      _tags.add(value);
      _tagController.clear();
    });
  }

  void _addIngredient() {
    final value = _ingredientController.text.trim();
    if (value.isEmpty) return;
    setState(() {
      _ingredients.add(value);
      _ingredientController.clear();
    });
  }

  void _publish() {
    if (_nameController.text.trim().isEmpty) return;

    final recipe = Recipe(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: _nameController.text.trim(),
      imageUrl:
          'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
      authorName: MockData.currentUser.name,
      authorAvatarUrl: MockData.currentUser.avatarUrl,
      category: _category,
      timeInMinutes: 30,
      servings: 2,
      rating: 0,
      description: _descriptionController.text.trim(),
      ingredients: _ingredients,
      utensils: _utensilController.text.trim().isEmpty
          ? []
          : [_utensilController.text.trim()],
      tags: _tags,
    );

    RecipeService.instance.publish(recipe);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Receita publicada com sucesso!')),
    );
    Navigator.of(context).maybePop();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _utensilController.dispose();
    _tagController.dispose();
    _ingredientController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.rose,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xl),
          children: [
            Text('Publicar uma nova receita',
                style: AppTextStyles.h1.copyWith(color: AppColors.textLight)),
            const SizedBox(height: AppSpacing.lg),
            AppTextField(
              label: 'Nome da receita',
              hint: 'Ex: Panqueca Americana',
              controller: _nameController,
              labelColor: AppColors.textLight,
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Categoria',
                style: AppTextStyles.bodySmall
                    .copyWith(color: AppColors.textLight)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.offWhite,
                borderRadius: BorderRadius.circular(AppRadius.pill),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _category,
                  isExpanded: true,
                  items: _categories
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (value) =>
                      setState(() => _category = value ?? _category),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Descrição da receita',
                style: AppTextStyles.bodySmall
                    .copyWith(color: AppColors.textLight)),
            const SizedBox(height: 6),
            AppTextField(
              hint: 'Descreva o modo de preparo...',
              controller: _descriptionController,
              maxLines: 5,
            ),
            const SizedBox(height: AppSpacing.md),
            AppTextField(
              label: 'Utensílios',
              hint: 'Ex: Liquidificador, Panela...',
              controller: _utensilController,
              labelColor: AppColors.textLight,
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Tags',
                style: AppTextStyles.bodySmall
                    .copyWith(color: AppColors.textLight)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    hint: 'Adicionar tag',
                    controller: _tagController,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addTag,
                  icon: const Icon(Icons.add_circle,
                      color: AppColors.textLight, size: 30),
                ),
              ],
            ),
            if (_tags.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _tags
                    .map((t) => TagChip(
                          label: t,
                          onDelete: () => setState(() => _tags.remove(t)),
                        ))
                    .toList(),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            Text('Ingredientes',
                style: AppTextStyles.bodySmall
                    .copyWith(color: AppColors.textLight)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    hint: 'Ingrediente para adicionar na receita',
                    controller: _ingredientController,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _addIngredient,
                  icon: const Icon(Icons.add_circle,
                      color: AppColors.textLight, size: 30),
                ),
              ],
            ),
            if (_ingredients.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              Column(
                children: _ingredients
                    .map((i) => Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.md, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.offWhite,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Row(
                            children: [
                              Expanded(child: Text(i, style: AppTextStyles.body)),
                              GestureDetector(
                                onTap: () =>
                                    setState(() => _ingredients.remove(i)),
                                child: const Icon(Icons.close_rounded,
                                    size: 18, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ))
                    .toList(),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _publish,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.darkGreen,
                  foregroundColor: AppColors.textLight,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                ),
                child: Text('Publicar receita', style: AppTextStyles.button),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
