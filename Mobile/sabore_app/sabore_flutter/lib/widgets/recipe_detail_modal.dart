import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../services/oauth_helper.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'chef_profile_modal.dart';
import 'sabore_widgets.dart';

/// Modal completo de Detalhes da Receita + Ingredientes com Checkbox + Modo Passo a Passo
/// + Avaliação por Estrelas (1-5) + Remover Avaliação + Comentários + Excluir Comentário
/// + Compartilhar (WhatsApp / Copiar Link com registro `/compartilhamento/registrar/:id`)
/// + Favoritar + Salvar em Livro + Publicar/Excluir
Future<void> showRecipeDetailModal(BuildContext context, Recipe recipe) async {
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.dark,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => _RecipeDetailSheet(initialRecipe: recipe),
  );
}

class _RecipeDetailSheet extends StatefulWidget {
  final Recipe initialRecipe;
  const _RecipeDetailSheet({required this.initialRecipe});

  @override
  State<_RecipeDetailSheet> createState() => _RecipeDetailSheetState();
}

class _RecipeDetailSheetState extends State<_RecipeDetailSheet> {
  final ApiService _api = ApiService.instance;
  late Recipe _recipe;
  late List<bool> _checkedIngredients;
  bool _cookingStepByStepMode = false;
  int _currentStepIndex = 0;

  int _selectedStars = 0;
  bool _submittingRating = false;
  List<RecipeComment> _comments = [];
  bool _loadingComments = false;
  final TextEditingController _commentCtrl = TextEditingController();
  bool _sendingComment = false;

  @override
  void initState() {
    super.initState();
    _recipe = widget.initialRecipe;
    _checkedIngredients = List<bool>.filled(_recipe.ingredientes.length, false);
    if (_recipe.id > 0) {
      _loadCommentsAndRatings();
    }
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCommentsAndRatings() async {
    setState(() => _loadingComments = true);
    final results = await Future.wait([
      _api.fetchRecipeComments(_recipe.id),
      _api.fetchRecipeRatings(_recipe.id),
    ]);
    final comments = results[0] as List<RecipeComment>;
    final ratings = results[1] as ({double media, int total, int? minhaNota});
    if (mounted) {
      setState(() {
        _comments = comments;
        _selectedStars = ratings.minhaNota ?? 0;
        if (ratings.total > 0 || ratings.media > 0) {
          _recipe = _recipe.copyWith(
            mediaAvaliacoes: ratings.media,
            totalAvaliacoes: ratings.total,
            totalComentarios: comments.length,
          );
        }
        _loadingComments = false;
      });
    }
  }

  void _openShareSheet() {
    final shareLink = '${_api.baseUrl}/receita/${_recipe.id}';
    final shareText =
        '🍽️ Confira a receita "${_recipe.titulo}" por ${_recipe.autorNome} no Saboré!\n$shareLink';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Compartilhar Receita', style: AppTextStyles.headingSm),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: AppColors.accent,
                  child: Icon(Icons.copy_rounded, color: Colors.white, size: 18),
                ),
                title: const Text('Copiar Link da Receita'),
                subtitle: Text(shareLink, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5)),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: shareText));
                  if (_recipe.id > 0) _api.registerRecipeShare(_recipe.id);
                  Navigator.of(ctx).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Link da receita copiado para a área de transferência!'),
                    ),
                  );
                },
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFF25D366),
                  child: Icon(Icons.send_rounded, color: Colors.white, size: 18),
                ),
                title: const Text('Compartilhar via WhatsApp'),
                subtitle: Text(
                  'Enviar "${_recipe.titulo}" no WhatsApp',
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
                ),
                onTap: () {
                  if (_recipe.id > 0) _api.registerRecipeShare(_recipe.id);
                  Navigator.of(ctx).pop();
                  final waUrl = 'https://wa.me/?text=${Uri.encodeComponent(shareText)}';
                  openExternalUrl(waUrl);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isFav = _api.isFavorite(_recipe.id);
    final isMine = _api.currentUser != null && _recipe.autorId == _api.currentUser!.id;
    final steps = _recipe.steps;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.88,
      minChildSize: 0.55,
      maxChildSize: 0.96,
      builder: (context, scrollController) {
        if (_cookingStepByStepMode) {
          return _buildStepByStepView(steps);
        }

        return ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.glassBorderHover,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 14),
            // Imagem de capa com badges sobrepostos
            Stack(
              children: [
                SaboreImage(
                  imageSource: _recipe.imagem,
                  height: 215,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(18),
                  fallbackLabel: _recipe.titulo,
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.darkDeep.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: AppColors.glassBorderHover),
                    ),
                    child: Text(
                      _recipe.categoria,
                      style: const TextStyle(
                        color: AppColors.secondary,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Row(
                    children: [
                      if (_recipe.id > 0)
                        CircleAvatar(
                          backgroundColor: AppColors.darkDeep.withValues(alpha: 0.85),
                          child: IconButton(
                            icon: Icon(
                              isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                              color: isFav ? AppColors.danger : Colors.white,
                              size: 20,
                            ),
                            onPressed: () async {
                              final res = await _api.toggleFavorite(_recipe);
                              if (mounted) {
                                setState(() {});
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(res.message)),
                                );
                              }
                            },
                          ),
                        ),
                      const SizedBox(width: 8),
                      CircleAvatar(
                        backgroundColor: AppColors.darkDeep.withValues(alpha: 0.85),
                        child: IconButton(
                          icon: const Icon(Icons.share_rounded, color: Colors.white, size: 19),
                          onPressed: _openShareSheet,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Título e Autor
            Text(_recipe.titulo, style: AppTextStyles.headingLg),
            const SizedBox(height: 8),
            InkWell(
              onTap: _recipe.autorId != null
                  ? () => showChefProfileModal(
                        context,
                        userId: _recipe.autorId!,
                        fallbackName: _recipe.autorNome,
                      )
                  : null,
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    SaboreAvatar(
                      name: _recipe.autorNome,
                      imageSource: _recipe.autorFoto,
                      frameId: _recipe.autorMoldura,
                      isPro: _recipe.autorIsPro,
                      radius: 15,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Por ${_recipe.autorNome}',
                      style: AppTextStyles.subtitle.copyWith(fontSize: 13.5),
                    ),
                    if (_recipe.autorIsPro) ...[
                      const SizedBox(width: 6),
                      const SaborePlanBadge(isPro: true, compact: true),
                    ],
                    const Spacer(),
                    const Icon(Icons.star_rounded, color: AppColors.warning, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      '${_recipe.mediaAvaliacoes.toStringAsFixed(1)} (${_recipe.totalAvaliacoes})',
                      style: AppTextStyles.mono,
                    ),
                  ],
                ),
              ),
            ),

            if (_recipe.descricao.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(_recipe.descricao, style: AppTextStyles.bodyMuted),
            ],

            if (_recipe.hashtags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _recipe.hashtags
                    .map(
                      (tag) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          tag,
                          style: const TextStyle(color: AppColors.secondary, fontSize: 11.5),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],

            const SizedBox(height: 16),
            // Metadados (Tempo, Porções, Dificuldade)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.glassBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _metaPill(Icons.timer_outlined, '${_recipe.tempoPreparo} min', 'Preparo'),
                  _metaPill(Icons.people_outline_rounded, '${_recipe.porcoes} porções', 'Rendimento'),
                  _metaPill(Icons.leaderboard_outlined, _recipe.dificuldade, 'Dificuldade'),
                ],
              ),
            ),

            const SizedBox(height: 16),
            // Botões principais: Modo Passo a Passo + Salvar em Livro + Compartilhar
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _currentStepIndex = 0;
                      _cookingStepByStepMode = true;
                    });
                  },
                  icon: const Icon(Icons.play_circle_fill_rounded, size: 19),
                  label: const Text('Iniciar Modo Passo a Passo'),
                ),
                OutlinedButton.icon(
                  onPressed: () => showSaveRecipeToBookDialog(context, _recipe),
                  icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                  label: const Text('Salvar em Livro'),
                ),
                OutlinedButton.icon(
                  onPressed: _openShareSheet,
                  icon: const Icon(Icons.share_outlined, size: 18),
                  label: const Text('Compartilhar'),
                ),
                if (isMine && _recipe.id > 0) ...[
                  OutlinedButton.icon(
                    onPressed: () async {
                      final res = await _api.toggleRecipePublic(_recipe);
                      if (mounted) {
                        setState(() => _recipe = _recipe.copyWith(publica: !_recipe.publica));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res.message)),
                        );
                      }
                    },
                    icon: Icon(
                      _recipe.publica ? Icons.public_off_rounded : Icons.public_rounded,
                      size: 18,
                    ),
                    label: Text(_recipe.publica ? 'Tornar Privada' : 'Publicar na Comunidade'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final res = await _api.deleteRecipe(_recipe.id);
                      if (context.mounted) {
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res.message)),
                        );
                      }
                    },
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger),
                    icon: const Icon(Icons.delete_outline_rounded, size: 18),
                    label: const Text('Excluir'),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 24),
            // Seção de Ingredientes com Checkboxes interativos
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Ingredientes (${_recipe.ingredientes.length})',
                  style: AppTextStyles.headingSm,
                ),
                Text(
                  'Toque para marcar',
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_recipe.ingredientes.isEmpty)
              Text('Ingredientes livres conforme descrição.', style: AppTextStyles.bodyMuted)
            else
              ...List.generate(_recipe.ingredientes.length, (i) {
                final ing = _recipe.ingredientes[i];
                final checked = _checkedIngredients[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: checked
                          ? AppColors.success.withValues(alpha: 0.45)
                          : AppColors.glassBorder,
                    ),
                  ),
                  child: CheckboxListTile(
                    dense: true,
                    value: checked,
                    onChanged: (v) => setState(() => _checkedIngredients[i] = v ?? false),
                    title: Text(
                      ing.displayText,
                      style: AppTextStyles.body.copyWith(
                        decoration: checked ? TextDecoration.lineThrough : null,
                        color: checked ? AppColors.textMuted : AppColors.textPrimary,
                      ),
                    ),
                    controlAffinity: ListTileControlAffinity.leading,
                  ),
                );
              }),

            const SizedBox(height: 24),
            // Modo de Preparo Numerado
            Text('Modo de Preparo (${steps.length} etapas)', style: AppTextStyles.headingSm),
            const SizedBox(height: 10),
            ...List.generate(steps.length, (idx) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.glassBorder),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: const BoxDecoration(
                        gradient: AppColors.accentGradient,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${idx + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(steps[idx], style: AppTextStyles.bodyLg),
                    ),
                  ],
                ),
              );
            }),

            // Avaliação por Estrelas + Comentários (para receitas salvas no banco)
            if (_recipe.id > 0) ...[
              const SizedBox(height: 24),
              const Divider(color: AppColors.glassBorder),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Avaliar esta Receita (+2 pts)', style: AppTextStyles.headingSm),
                  if (_selectedStars > 0)
                    TextButton.icon(
                      onPressed: _submittingRating
                          ? null
                          : () async {
                              setState(() => _submittingRating = true);
                              final res = await _api.deleteRecipeRating(_recipe.id);
                              await _loadCommentsAndRatings();
                              if (mounted) {
                                setState(() {
                                  _selectedStars = 0;
                                  _submittingRating = false;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(res.message)),
                                );
                              }
                            },
                      style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                      icon: const Icon(Icons.close_rounded, size: 15),
                      label: const Text('Remover nota', style: TextStyle(fontSize: 12)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  ...List.generate(5, (starIdx) {
                    final starValue = starIdx + 1;
                    return IconButton(
                      onPressed: _submittingRating
                          ? null
                          : () async {
                              setState(() {
                                _selectedStars = starValue;
                                _submittingRating = true;
                              });
                              final res = await _api.rateRecipe(_recipe.id, starValue);
                              if (mounted) {
                                setState(() {
                                  _submittingRating = false;
                                  if (res.novaMedia != null || res.novoTotal != null) {
                                    _recipe = _recipe.copyWith(
                                      mediaAvaliacoes: res.novaMedia ?? _recipe.mediaAvaliacoes,
                                      totalAvaliacoes: res.novoTotal ?? _recipe.totalAvaliacoes,
                                    );
                                  }
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(res.message)),
                                );
                              }
                            },
                      icon: Icon(
                        starValue <= _selectedStars
                            ? Icons.star_rounded
                            : Icons.star_border_rounded,
                        color: AppColors.warning,
                        size: 30,
                      ),
                    );
                  }),
                  if (_submittingRating)
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                    ),
                ],
              ),

              const SizedBox(height: 18),
              Text('Comentários (${_comments.length}) • +3 pts', style: AppTextStyles.headingSm),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Deixe um elogio ou dica sobre esta receita...',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _sendingComment
                        ? null
                        : () async {
                            final txt = _commentCtrl.text.trim();
                            if (txt.isEmpty) return;
                            setState(() => _sendingComment = true);
                            final res = await _api.addComment(_recipe.id, txt);
                            _commentCtrl.clear();
                            await _loadCommentsAndRatings();
                            if (mounted) {
                              setState(() => _sendingComment = false);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(res.message)),
                              );
                            }
                          },
                    child: _sendingComment
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send_rounded, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_loadingComments)
                const Center(child: CircularProgressIndicator(color: AppColors.accent))
              else if (_comments.isEmpty)
                Text(
                  'Seja o primeiro a comentar nesta receita!',
                  style: AppTextStyles.bodyMuted,
                )
              else
                ..._comments.map((c) {
                  final canDeleteComment =
                      _api.currentUser != null && _api.currentUser!.id == c.usuarioId;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SaboreAvatar(
                          name: c.usuarioNome,
                          imageSource: c.usuarioFoto,
                          frameId: c.usuarioMoldura,
                          radius: 16,
                          onTap: c.usuarioId > 0
                              ? () => showChefProfileModal(
                                    context,
                                    userId: c.usuarioId,
                                    fallbackName: c.usuarioNome,
                                  )
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c.usuarioNome,
                                style: AppTextStyles.body.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.secondary,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(c.texto, style: AppTextStyles.body),
                            ],
                          ),
                        ),
                        if (canDeleteComment)
                          IconButton(
                            tooltip: 'Excluir Comentário',
                            icon: const Icon(
                              Icons.delete_outline_rounded,
                              color: AppColors.danger,
                              size: 18,
                            ),
                            onPressed: () async {
                              final res = await _api.deleteComment(c.id);
                              await _loadCommentsAndRatings();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(res.message)),
                                );
                              }
                            },
                          ),
                      ],
                    ),
                  );
                }),
            ],
          ],
        );
      },
    );
  }

  Widget _buildStepByStepView(List<String> steps) {
    final total = steps.length;
    final current = _currentStepIndex.clamp(0, total - 1);
    final progress = (current + 1) / total;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => setState(() => _cookingStepByStepMode = false),
                icon: const Icon(Icons.arrow_back_rounded, color: AppColors.secondary),
              ),
              Expanded(
                child: Text(
                  'Modo Passo a Passo',
                  style: AppTextStyles.headingMd,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'Etapa ${current + 1} de $total',
                  style: AppTextStyles.mono.copyWith(color: AppColors.accent),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: AppColors.darkCard,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: AppColors.cardGradient,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.accentBorder, width: 1.5),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      gradient: AppColors.accentGradient,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${current + 1}',
                      style: AppTextStyles.headingLg.copyWith(color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 22),
                  SingleChildScrollView(
                    child: Text(
                      steps[current],
                      textAlign: TextAlign.center,
                      style: AppTextStyles.headingMd.copyWith(height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: current > 0 ? () => setState(() => _currentStepIndex--) : null,
                  icon: const Icon(Icons.chevron_left_rounded),
                  label: const Text('Anterior'),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    if (current < total - 1) {
                      setState(() => _currentStepIndex++);
                    } else {
                      setState(() => _cookingStepByStepMode = false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🎉 Parabéns! Você concluiu o preparo desta receita!'),
                        ),
                      );
                    }
                  },
                  icon: Icon(
                    current < total - 1
                        ? Icons.chevron_right_rounded
                        : Icons.check_circle_rounded,
                  ),
                  label: Text(current < total - 1 ? 'Próximo Passo' : 'Concluir Preparo'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metaPill(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: AppColors.accent, size: 20),
        const SizedBox(height: 4),
        Text(value, style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
        Text(label, style: AppTextStyles.bodyMuted.copyWith(fontSize: 11)),
      ],
    );
  }
}
