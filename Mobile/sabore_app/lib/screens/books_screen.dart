import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Meus Livros (`/livros` + `/receitas`) com busca, ordenação, filtros,
/// criação/exclusão de livro, visualização de receitas do livro e cadastro manual de receita com foto.
class BooksScreen extends StatefulWidget {
  const BooksScreen({super.key});

  @override
  State<BooksScreen> createState() => _BooksScreenState();
}

class _BooksScreenState extends State<BooksScreen> {
  final ApiService _api = ApiService.instance;
  final TextEditingController _searchCtrl = TextEditingController();
  String _filterType = 'Todos'; // 'Todos', 'Com Receitas', 'Vazios'
  String _sortBy = 'Recentes'; // 'Recentes', 'A-Z', 'Mais Receitas'
  RecipeBook? _selectedBook;

  static const List<String> _bookIcons = [
    '📖',
    '🍝',
    '🍰',
    '🥗',
    '🥩',
    '🍣',
    '🍲',
    '🍕',
    '🥐',
    '🥂',
    '🌶️',
    '🥑',
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<Recipe> _recipesForBook(RecipeBook book) {
    final byId = _api.myRecipes.where((r) => r.livroId == book.id).toList();
    if (byId.isNotEmpty) return byId;
    if (book.receitas.isNotEmpty) return book.receitas;
    if (book.padrao) {
      return _api.myRecipes.where((r) => r.livroId == null || r.livroId == book.id).toList();
    }
    return [];
  }

  void _openCreateBookDialog() {
    final nameCtrl = TextEditingController();
    String chosenIcon = '📖';
    bool saving = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              title: Text('Criar Novo Livro de Receitas', style: AppTextStyles.headingSm),
              content: SizedBox(
                width: 400,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nome do Livro',
                        hintText: 'Ex: Massas de Domingo, Doces Fit...',
                        prefixIcon: Icon(Icons.menu_book_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Escolha um ícone para a capa:', style: AppTextStyles.label),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _bookIcons.map((ic) {
                        final selected = ic == chosenIcon;
                        return GestureDetector(
                          onTap: () => setDialogState(() => chosenIcon = ic),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.accent.withValues(alpha: 0.25)
                                  : AppColors.darkDeep,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected ? AppColors.accent : AppColors.glassBorder,
                                width: selected ? 1.8 : 1,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(ic, style: const TextStyle(fontSize: 22)),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (nameCtrl.text.trim().isEmpty) return;
                          setDialogState(() => saving = true);
                          final res = await _api.createBook(
                            nome: nameCtrl.text,
                            icone: chosenIcon,
                          );
                          if (ctx.mounted) {
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(res.message)),
                            );
                          }
                        },
                  child: Text(saving ? 'Criando...' : 'Criar Livro'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _openAddRecipeModal({int? preselectedBookId}) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final stepsCtrl = TextEditingController();
    final timeCtrl = TextEditingController(text: '35');
    final servingsCtrl = TextEditingController(text: '4');
    String difficulty = 'Médio';
    bool isPublic = true;
    int? chosenBookId = preselectedBookId ?? (_api.books.isNotEmpty ? _api.books.first.id : null);
    PickedImageData? pickedPhoto;
    bool saving = false;

    final List<Map<String, TextEditingController>> ingControllers = [
      {
        'nome': TextEditingController(),
        'qtd': TextEditingController(text: '1'),
        'un': TextEditingController(text: 'xícara'),
      },
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 18,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: DraggableScrollableSheet(
                expand: false,
                initialChildSize: 0.88,
                minChildSize: 0.5,
                maxChildSize: 0.95,
                builder: (_, scrollCtrl) {
                  return ListView(
                    controller: scrollCtrl,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.post_add_rounded, color: AppColors.accent),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text('Adicionar Nova Receita', style: AppTextStyles.headingMd),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            icon: const Icon(Icons.close_rounded),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Upload de Foto da Receita
                      Text('Foto do Prato', style: AppTextStyles.label),
                      const SizedBox(height: 8),
                      if (pickedPhoto != null)
                        Stack(
                          children: [
                            SaboreImage(
                              imageSource: pickedPhoto!.dataUri,
                              height: 160,
                              width: double.infinity,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: ElevatedButton.icon(
                                onPressed: () => setModalState(() => pickedPhoto = null),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.danger,
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                ),
                                icon: const Icon(Icons.delete_outline, size: 16),
                                label: const Text('Remover', style: TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        )
                      else
                        OutlinedButton.icon(
                          onPressed: () async {
                            final img = await showSaboreImagePicker(
                              ctx,
                              title: 'Escolher Foto da Receita',
                            );
                            if (img != null) {
                              setModalState(() => pickedPhoto = img);
                            }
                          },
                          icon: const Icon(Icons.upload_file_rounded),
                          label: const Text('Escolher arquivo de imagem'),
                        ),

                      const SizedBox(height: 14),
                      TextField(
                        controller: titleCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Título da Receita *',
                          hintText: 'Ex: Risoto Cremoso de Funghi',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: descCtrl,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Descrição / Dica do Chef (#hashtags)',
                          hintText: 'Conte o segredo desta receita...',
                        ),
                      ),
                      const SizedBox(height: 12),

                      if (_api.books.isNotEmpty) ...[
                        DropdownButtonFormField<int>(
                          initialValue: chosenBookId,
                          dropdownColor: AppColors.darkCard,
                          decoration: const InputDecoration(labelText: 'Livro de Destino'),
                          items: _api.books
                              .map(
                                (b) => DropdownMenuItem<int>(
                                  value: b.id,
                                  child: Text('${b.icone} ${b.nome}'),
                                ),
                              )
                              .toList(),
                          onChanged: (v) => setModalState(() => chosenBookId = v),
                        ),
                        const SizedBox(height: 12),
                      ],

                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: timeCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Tempo (min)'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: servingsCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Porções'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: difficulty,
                              dropdownColor: AppColors.darkCard,
                              decoration: const InputDecoration(labelText: 'Dificuldade'),
                              items: const [
                                DropdownMenuItem(value: 'Fácil', child: Text('Fácil')),
                                DropdownMenuItem(value: 'Médio', child: Text('Médio')),
                                DropdownMenuItem(value: 'Difícil', child: Text('Difícil')),
                              ],
                              onChanged: (v) => setModalState(() => difficulty = v ?? 'Médio'),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Ingredientes', style: AppTextStyles.headingSm),
                          TextButton.icon(
                            onPressed: () {
                              setModalState(() {
                                ingControllers.add({
                                  'nome': TextEditingController(),
                                  'qtd': TextEditingController(text: '1'),
                                  'un': TextEditingController(text: 'unidade'),
                                });
                              });
                            },
                            icon: const Icon(Icons.add_circle_outline, size: 18),
                            label: const Text('Adicionar Ingrediente'),
                          ),
                        ],
                      ),
                      ...List.generate(ingControllers.length, (i) {
                        final row = ingControllers[i];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: TextField(
                                  controller: row['nome'],
                                  decoration: const InputDecoration(hintText: 'Ingrediente'),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                flex: 1,
                                child: TextField(
                                  controller: row['qtd'],
                                  decoration: const InputDecoration(hintText: 'Qtd'),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: row['un'],
                                  decoration: const InputDecoration(hintText: 'Unid.'),
                                ),
                              ),
                              if (ingControllers.length > 1)
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, color: AppColors.danger),
                                  onPressed: () => setModalState(() => ingControllers.removeAt(i)),
                                ),
                            ],
                          ),
                        );
                      }),

                      const SizedBox(height: 14),
                      TextField(
                        controller: stepsCtrl,
                        maxLines: 5,
                        decoration: const InputDecoration(
                          labelText: 'Modo de Preparo (1 passo por linha) *',
                          hintText: '1. Refogue o alho no azeite...\n2. Adicione o arroz arbóreo...',
                          alignLabelWithHint: true,
                        ),
                      ),
                      const SizedBox(height: 12),

                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Text('Publicar na Comunidade Saboré (+10 pts PRO)'),
                        subtitle: Text(
                          'Se ativado, outros chefs poderão ver, avaliar e favoritar sua receita.',
                          style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                        ),
                        value: isPublic,
                        onChanged: (v) => setModalState(() => isPublic = v),
                      ),

                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: saving
                            ? null
                            : () async {
                                if (titleCtrl.text.trim().isEmpty || stepsCtrl.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Preencha o título e o modo de preparo da receita.'),
                                    ),
                                  );
                                  return;
                                }
                                setModalState(() => saving = true);
                                final ings = ingControllers
                                    .where((m) => m['nome']!.text.trim().isNotEmpty)
                                    .map((m) => {
                                          'nome': m['nome']!.text.trim(),
                                          'quantidade': m['qtd']!.text.trim().isEmpty
                                              ? '1'
                                              : m['qtd']!.text.trim(),
                                          'unidadeMedida': m['un']!.text.trim().isEmpty
                                              ? 'unidade'
                                              : m['un']!.text.trim(),
                                        })
                                    .toList();

                                final res = await _api.createRecipe(
                                  titulo: titleCtrl.text,
                                  descricao: descCtrl.text,
                                  modoPreparo: stepsCtrl.text,
                                  tempoPreparo: int.tryParse(timeCtrl.text) ?? 30,
                                  porcoes: int.tryParse(servingsCtrl.text) ?? 2,
                                  dificuldade: difficulty,
                                  ingredientes: ings.isEmpty
                                      ? [
                                          {
                                            'nome': 'Ingredientes a gosto',
                                            'quantidade': '1',
                                            'unidadeMedida': 'porção'
                                          }
                                        ]
                                      : ings,
                                  livroId: chosenBookId,
                                  publica: isPublic,
                                  imagemBase64: pickedPhoto?.dataUri,
                                );
                                if (ctx.mounted) {
                                  Navigator.of(ctx).pop();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text(res.message)),
                                  );
                                }
                              },
                        icon: saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.check_circle_outline_rounded),
                        label: Text(saving ? 'Salvando Receita...' : 'Salvar Receita'),
                      ),
                    ],
                  );
                },
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedBook != null) {
      return _buildSelectedBookDetailView(_selectedBook!);
    }

    final query = _searchCtrl.text.trim().toLowerCase();
    var filteredBooks = _api.books.where((b) {
      if (query.isNotEmpty && !b.nome.toLowerCase().contains(query)) return false;
      final recCount = _recipesForBook(b).length;
      if (_filterType == 'Com Receitas' && recCount == 0) return false;
      if (_filterType == 'Vazios' && recCount > 0) return false;
      return true;
    }).toList();

    if (_sortBy == 'A-Z') {
      filteredBooks.sort((a, b) => a.nome.compareTo(b.nome));
    } else if (_sortBy == 'Mais Receitas') {
      filteredBooks.sort((a, b) => _recipesForBook(b).length.compareTo(_recipesForBook(a).length));
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: () async {
        await _api.fetchBooks();
        await _api.fetchMyRecipes();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 36),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Meus Livros de Receitas', style: AppTextStyles.headingLg),
                    Text(
                      'Organize suas coleções culinárias e receitas autorais',
                      style: AppTextStyles.bodyMuted,
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _openCreateBookDialog,
                icon: const Icon(Icons.create_new_folder_outlined, size: 18),
                label: const Text('Novo Livro'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Barra de busca e botão de nova receita
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    hintText: 'Buscar livro pelo nome...',
                    prefixIcon: Icon(Icons.search_rounded),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: () => _openAddRecipeModal(),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Nova Receita'),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Filtros e Ordenação
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ...['Todos', 'Com Receitas', 'Vazios'].map((f) {
                  final active = _filterType == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: active,
                      selectedColor: AppColors.accent,
                      onSelected: (_) => setState(() => _filterType = f),
                    ),
                  );
                }),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _sortBy,
                  dropdownColor: AppColors.darkCard,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(value: 'Recentes', child: Text('Ordenar: Recentes')),
                    DropdownMenuItem(value: 'A-Z', child: Text('Ordenar: A-Z')),
                    DropdownMenuItem(value: 'Mais Receitas', child: Text('Ordenar: Mais Receitas')),
                  ],
                  onChanged: (v) => setState(() => _sortBy = v ?? 'Recentes'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (filteredBooks.isEmpty)
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Column(
                children: [
                  const Icon(Icons.menu_book_rounded, size: 48, color: AppColors.accent),
                  const SizedBox(height: 12),
                  Text('Nenhum livro encontrado', style: AppTextStyles.headingSm),
                  const SizedBox(height: 6),
                  Text(
                    'Crie seu primeiro livro de receitas ou adicione uma receita manual agora mesmo.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMuted,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _openCreateBookDialog,
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Criar Primeiro Livro'),
                  ),
                ],
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredBooks.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: 0.92,
              ),
              itemBuilder: (ctx, idx) {
                final b = filteredBooks[idx];
                final recs = _recipesForBook(b);
                final count = recs.isNotEmpty ? recs.length : b.totalReceitas;

                return InkWell(
                  onTap: () => setState(() => _selectedBook = b),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.glassBorderHover),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.accent.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              alignment: Alignment.center,
                              child: Text(b.icone, style: const TextStyle(fontSize: 26)),
                            ),
                            if (!b.padrao)
                              IconButton(
                                tooltip: 'Excluir Livro',
                                icon: const Icon(
                                  Icons.delete_outline_rounded,
                                  color: AppColors.textMuted,
                                  size: 20,
                                ),
                                onPressed: () async {
                                  final res = await _api.deleteBook(b.id);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(res.message)),
                                    );
                                  }
                                },
                              ),
                          ],
                        ),
                        const Spacer(),
                        Text(
                          b.nome,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.headingSm,
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.darkDeep,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '$count ${count == 1 ? 'receita' : 'receitas'}',
                                style: AppTextStyles.mono.copyWith(fontSize: 11.5),
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.secondary),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSelectedBookDetailView(RecipeBook book) {
    final recipes = _recipesForBook(book);

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 36),
      children: [
        Row(
          children: [
            IconButton(
              onPressed: () => setState(() => _selectedBook = null),
              icon: const Icon(Icons.arrow_back_rounded, color: AppColors.secondary),
            ),
            Text(book.icone, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(book.nome, style: AppTextStyles.headingLg),
            ),
            ElevatedButton.icon(
              onPressed: () => _openAddRecipeModal(preselectedBookId: book.id),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Adicionar Receita'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (recipes.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: Column(
              children: [
                const Icon(Icons.restaurant_rounded, size: 44, color: AppColors.accent),
                const SizedBox(height: 10),
                Text('Este livro ainda está vazio', style: AppTextStyles.headingSm),
                const SizedBox(height: 6),
                Text(
                  'Adicione uma receita manualmente ou salve receitas da Comunidade e do Chef IA aqui!',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyMuted,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => _openAddRecipeModal(preselectedBookId: book.id),
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Criar Receita Neste Livro'),
                ),
              ],
            ),
          )
        else
          ...recipes.map(
            (r) => SaboreMobileRecipeCard(
              recipe: r,
              isFavorite: _api.isFavorite(r.id),
              onTap: () => showRecipeDetailModal(context, r),
              onToggleFavorite: () => _api.toggleFavorite(r),
              trailingAction: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: (r.publica ? AppColors.success : AppColors.textMuted)
                      .withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  r.publica ? Icons.public_rounded : Icons.lock_outline_rounded,
                  size: 14,
                  color: r.publica ? AppColors.success : AppColors.textMuted,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

