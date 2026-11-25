import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Home do Dashboard Saboré (Saudação, 4 Cards de Métricas, Ações Rápidas,
/// Geladeira/Despensa Inteligente `/ingredientes-disponiveis`, Recomendadas e Recentes)
class HomeScreen extends StatefulWidget {
  final ValueChanged<int> onNavigateTab;

  const HomeScreen({super.key, required this.onNavigateTab});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService.instance;
  final TextEditingController _fridgeCtrl = TextEditingController();
  bool _addingIngredient = false;

  static const List<String> _quickIngredients = [
    'Frango',
    'Ovos',
    'Tomate',
    'Alho',
    'Queijo Parmesão',
    'Arroz Arbóreo',
    'Creme de Leite',
    'Batata',
    'Limão',
  ];

  @override
  void dispose() {
    _fridgeCtrl.dispose();
    super.dispose();
  }

  Future<void> _addIngredient(String raw) async {
    final text = raw.trim();
    if (text.isEmpty) return;
    setState(() => _addingIngredient = true);
    final saved = await _api.addFridgeIngredient(text);
    if (!mounted) return;
    setState(() => _addingIngredient = false);
    if (saved) {
      _fridgeCtrl.clear();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Não foi possível sincronizar o ingrediente.')),
      );
    }
  }

  Future<void> _clearIngredients() async {
    final cleared = await _api.clearFridgeIngredients();
    if (!mounted || cleared) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
          content: Text('Alguns ingredientes não puderam ser removidos.')),
    );
  }

  Future<void> _removeIngredient(int id) async {
    final removed = await _api.removeFridgeIngredient(id);
    if (!mounted || removed) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Não foi possível remover o ingrediente.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _api.currentUser;
    final firstName = (user?.nome ?? 'Chef').split(' ').first;
    final savedCount = {
      ..._api.favoriteRecipes.map((recipe) => recipe.id),
      ..._api.myRecipes.map((recipe) => recipe.id),
    }.length;
    final createdCount = _api.myRecipes.length;
    final booksCount = _api.books.length;
    final monthlyPoints = user?.pontosMensais ?? 0;

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: _api.refreshAllDashboardData,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 36),
        children: [
          // 1. Banner de Boas-vindas
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Olá, Chef $firstName! 👨‍🍳',
                            style: AppTextStyles.headingLg,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'O que vamos preparar na sua cozinha inteligente hoje?',
                            style: AppTextStyles.bodyMuted,
                          ),
                        ],
                      ),
                    ),
                    SaborePlanBadge(isPro: user?.isPro ?? false),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => widget.onNavigateTab(3), // Chef IA
                      icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                      label: const Text('Criar com Chef IA'),
                    ),
                    OutlinedButton.icon(
                      onPressed: () =>
                          widget.onNavigateTab(2), // Comunidade / Desafios
                      icon: const Icon(Icons.explore_outlined, size: 18),
                      label: const Text('Explorar Comunidade'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 2. Ações Rápidas (Atalhos Inteligentes)
          Text('Ferramentas Inteligentes', style: AppTextStyles.headingSm),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _quickActionChip(
                  icon: Icons.smart_toy_rounded,
                  title: 'Chef IA',
                  subtitle: _api.iaConsumption.isPro
                      ? 'Ilimitado PRO'
                      : '${_api.iaConsumption.chatRestantes}/${_api.iaConsumption.chatLimite} grátis',
                  color: AppColors.accent,
                  onTap: () => widget.onNavigateTab(3),
                ),
                _quickActionChip(
                  icon: Icons.camera_alt_rounded,
                  title: 'IA por Foto',
                  subtitle: _api.iaConsumption.isPro
                      ? 'Ilimitado PRO'
                      : '${_api.iaConsumption.fotoRestantes}/${_api.iaConsumption.fotoLimite} grátis',
                  color: AppColors.warning,
                  onTap: () => widget.onNavigateTab(4),
                ),
                _quickActionChip(
                  icon: Icons.ondemand_video_rounded,
                  title: 'Importar Vídeo',
                  subtitle: _api.iaConsumption.isPro
                      ? 'Ilimitado PRO'
                      : '${_api.iaConsumption.videoRestantes}/${_api.iaConsumption.videoLimite} grátis',
                  color: AppColors.info,
                  onTap: () => widget.onNavigateTab(5),
                ),
                _quickActionChip(
                  icon: Icons.workspace_premium_rounded,
                  title: 'Ranking PRO',
                  subtitle: 'Top 5 ganham PRO',
                  color: AppColors.proGold,
                  onTap: () => widget.onNavigateTab(8),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          _buildBooksSection(),
          const SizedBox(height: 18),
          _buildRecentFavorites(),
          const SizedBox(height: 18),

          // 3. Quatro Cards de Estatísticas Reais
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.75,
            children: [
              _statCard(
                icon: Icons.bookmark_added_rounded,
                color: AppColors.accent,
                value: '$savedCount',
                label: 'Receitas no Acervo',
                onTap: () => widget.onNavigateTab(1),
              ),
              _statCard(
                icon: Icons.restaurant_menu_rounded,
                color: AppColors.success,
                value: '$createdCount',
                label: 'Minhas Criações',
                onTap: () => widget.onNavigateTab(7),
              ),
              _statCard(
                icon: Icons.menu_book_rounded,
                color: AppColors.info,
                value: '$booksCount',
                label: 'Meus Livros',
                onTap: () => widget.onNavigateTab(1),
              ),
              _statCard(
                icon: Icons.emoji_events_rounded,
                color: AppColors.proGold,
                value: '$monthlyPoints pts',
                label: user?.posicaoRanking != null
                    ? 'Ranking #${user!.posicaoRanking}'
                    : 'Ranking PRO Mensal',
                onTap: () => widget.onNavigateTab(8),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // 4. Widget Geladeira / Despensa Inteligente (/ingredientes-disponiveis)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.kitchen_rounded,
                        color: AppColors.accent, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Minha Geladeira & Despensa (${_api.fridgeIngredients.length})',
                        style: AppTextStyles.headingSm,
                      ),
                    ),
                    if (_api.fridgeIngredients.isNotEmpty)
                      TextButton(
                        onPressed: _clearIngredients,
                        child: const Text(
                          'Limpar',
                          style:
                              TextStyle(color: AppColors.danger, fontSize: 12),
                        ),
                      ),
                  ],
                ),
                Text(
                  'Adicione os ingredientes que você tem em casa para o Chef IA criar receitas sob medida.',
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 12.5),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _fridgeCtrl,
                        onSubmitted: _addIngredient,
                        decoration: const InputDecoration(
                          hintText:
                              'Ex: Peito de frango, creme de leite, alho...',
                          prefixIcon:
                              Icon(Icons.add_shopping_cart_rounded, size: 18),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _addingIngredient
                          ? null
                          : () => _addIngredient(_fridgeCtrl.text),
                      child: _addingIngredient
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Adicionar'),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Sugestões rápidas
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _quickIngredients.map((item) {
                    final alreadyAdded = _api.fridgeIngredients
                        .any((i) => i.nome.toLowerCase() == item.toLowerCase());
                    if (alreadyAdded) return const SizedBox.shrink();
                    return ActionChip(
                      label: Text('+ $item',
                          style: const TextStyle(fontSize: 11.5)),
                      backgroundColor: AppColors.darkDeep,
                      side: const BorderSide(color: AppColors.glassBorder),
                      onPressed: () => _addIngredient(item),
                    );
                  }).toList(),
                ),
                if (_api.fridgeIngredients.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Divider(color: AppColors.glassBorder),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _api.fridgeIngredients
                        .map(
                          (ing) => Chip(
                            label: Text(
                              ing.nome,
                              style: const TextStyle(
                                  fontSize: 12.5, fontWeight: FontWeight.w600),
                            ),
                            backgroundColor:
                                AppColors.accent.withValues(alpha: 0.16),
                            side:
                                const BorderSide(color: AppColors.accentBorder),
                            deleteIcon:
                                const Icon(Icons.close_rounded, size: 16),
                            onDeleted: () => _removeIngredient(ing.id),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => widget.onNavigateTab(3),
                      icon: const Icon(Icons.auto_awesome_rounded, size: 18),
                      label: const Text(
                          'Gerar Receita com Minha Geladeira no Chef IA'),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // 5. Card de Destaque do Desafio da Semana
          if (_api.activeWeeklyChallenge != null) ...[
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.proBannerGradient,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.proBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.local_fire_department_rounded,
                          color: AppColors.proGold),
                      const SizedBox(width: 8),
                      Text(
                        'DESAFIO GASTRONÔMICO DA SEMANA',
                        style: AppTextStyles.label
                            .copyWith(color: AppColors.proGold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(_api.activeWeeklyChallenge!.titulo,
                      style: AppTextStyles.headingMd),
                  const SizedBox(height: 4),
                  Text(
                    _api.activeWeeklyChallenge!.descricao,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.bodyMuted,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.proGold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '🏆 +${_api.activeWeeklyChallenge!.pontosParticipacao} pts no Ranking PRO',
                          style: const TextStyle(
                            color: AppColors.proGold,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => widget.onNavigateTab(2),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.proGold,
                          foregroundColor: AppColors.darkDeep,
                        ),
                        child: const Text('Participar'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // 6. Receitas em Destaque da Comunidade
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Destaques da Comunidade', style: AppTextStyles.headingSm),
              TextButton(
                onPressed: () => widget.onNavigateTab(2),
                child: const Text('Ver todas'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_api.publicRecipes.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                'Nenhuma receita pública carregada ainda. Puxe para atualizar ou publique a primeira!',
                style: AppTextStyles.bodyMuted,
              ),
            )
          else
            ..._api.publicRecipes
                .take(4)
                .map((r) => _buildRecipeHorizontalTile(context, r)),

          if (_api.myRecipes.isNotEmpty) ...[
            const SizedBox(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Minhas Receitas Recentes',
                    style: AppTextStyles.headingSm),
                TextButton(
                  onPressed: () => widget.onNavigateTab(1),
                  child: const Text('Meus Livros'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ..._api.myRecipes
                .take(3)
                .map((r) => _buildRecipeHorizontalTile(context, r)),
          ],
        ],
      ),
    );
  }

  Widget _buildBooksSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
                child: Text('Meus Livros de Receitas',
                    style: AppTextStyles.headingSm)),
            TextButton(
              onPressed: () => widget.onNavigateTab(1),
              child: const Text('Ver todos'),
            ),
          ],
        ),
        if (_api.books.isEmpty)
          _homeEmptyCard(
            icon: Icons.menu_book_outlined,
            message: 'Seus livros e coleções aparecerão aqui.',
          )
        else
          SizedBox(
            height: 126,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _api.books.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final book = _api.books[index];
                return InkWell(
                  onTap: () => widget.onNavigateTab(1),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 158,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(book.icone, style: const TextStyle(fontSize: 25)),
                        const Spacer(),
                        Text(
                          book.nome,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.body
                              .copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 3),
                        Text('${book.totalReceitas} receitas',
                            style: AppTextStyles.bodyMuted),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildRecentFavorites() {
    final favorites = _api.favoriteRecipes.take(3).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
                child:
                    Text('Favoritas Recentes', style: AppTextStyles.headingSm)),
            TextButton(
              onPressed: () => widget.onNavigateTab(6),
              child: const Text('Ver todas'),
            ),
          ],
        ),
        if (favorites.isEmpty)
          _homeEmptyCard(
            icon: Icons.favorite_border_rounded,
            message:
                'Salve suas receitas favoritas para encontrá-las rapidamente.',
          )
        else
          ...favorites.map(
            (recipe) => SaboreMobileRecipeCard(
              recipe: recipe,
              isFavorite: true,
              compact: true,
              onTap: () => showRecipeDetailModal(context, recipe),
              onSaveToBook: () => showSaveRecipeToBookDialog(context, recipe),
              onToggleFavorite: () => _api.toggleFavorite(recipe),
            ),
          ),
      ],
    );
  }

  Widget _homeEmptyCard({required IconData icon, required String message}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.glassBorder),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.accent),
          const SizedBox(width: 10),
          Expanded(child: Text(message, style: AppTextStyles.bodyMuted)),
        ],
      ),
    );
  }

  Widget _statCard({
    required IconData icon,
    required Color color,
    required String value,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const Icon(Icons.arrow_outward_rounded,
                    size: 15, color: AppColors.textMuted),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: AppTextStyles.monoLg.copyWith(fontSize: 19)),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickActionChip({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 155,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 10),
              Text(title,
                  style:
                      AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Text(subtitle,
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecipeHorizontalTile(BuildContext context, Recipe r) {
    final isFav = _api.isFavorite(r.id);
    return SaboreMobileRecipeCard(
      recipe: r,
      isFavorite: isFav,
      onTap: () => showRecipeDetailModal(context, r),
      onToggleFavorite: () => _api.toggleFavorite(r),
      onSaveToBook: () => showSaveRecipeToBookDialog(context, r),
    );
  }
}
