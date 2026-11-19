import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Favoritas (`/favoritos/listar`, `/favoritos/excluir/:id`)
class FavoritesScreen extends StatefulWidget {
  final VoidCallback onExploreCommunity;

  const FavoritesScreen({super.key, required this.onExploreCommunity});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final ApiService _api = ApiService.instance;
  String _selectedCat = 'Todas';
  final TextEditingController _searchCtrl = TextEditingController();

  static const List<String> _cats = [
    'Todas',
    'Massas',
    'Carnes',
    'Sobremesas',
    'Vegano',
    'Rápidas',
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = _searchCtrl.text.trim().toLowerCase();
    final favs = _api.favoriteRecipes.where((r) {
      if (_selectedCat != 'Todas') {
        final match = r.categoria.toLowerCase().contains(_selectedCat.toLowerCase()) ||
            r.titulo.toLowerCase().contains(_selectedCat.toLowerCase());
        if (!match) return false;
      }
      if (q.isNotEmpty) {
        return r.titulo.toLowerCase().contains(q) || r.autorNome.toLowerCase().contains(q);
      }
      return true;
    }).toList();

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _api.fetchFavorites,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 36),
        children: [
          Text('Minhas Receitas Favoritas ❤️', style: AppTextStyles.headingLg),
          Text(
            'Suas receitas preferidas salvas para consultar a qualquer momento',
            style: AppTextStyles.bodyMuted,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'Buscar nas favoritas...',
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _cats.map((c) {
                final active = _selectedCat == c;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c),
                    selected: active,
                    selectedColor: AppColors.accent,
                    onSelected: (_) => setState(() => _selectedCat = c),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          if (favs.isEmpty)
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Column(
                children: [
                  const Icon(Icons.favorite_border_rounded, size: 48, color: AppColors.accent),
                  const SizedBox(height: 12),
                  Text('Nenhuma receita favorita ainda', style: AppTextStyles.headingSm),
                  const SizedBox(height: 6),
                  Text(
                    'Explore a Comunidade Saboré e toque no coração ❤️ das receitas que você mais gostar!',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMuted,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: widget.onExploreCommunity,
                    icon: const Icon(Icons.explore_outlined),
                    label: const Text('Explorar Receitas da Comunidade'),
                  ),
                ],
              ),
            )
          else
            ...favs.map(
              (r) => SaboreMobileRecipeCard(
                recipe: r,
                isFavorite: true,
                onTap: () => showRecipeDetailModal(context, r),
                onSaveToBook: () => showSaveRecipeToBookDialog(context, r),
                onToggleFavorite: () async {
                  final res = await _api.toggleFavorite(r);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(res.message)),
                    );
                  }
                },
              ),
            ),
        ],
      ),
    );
  }
}
