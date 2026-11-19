import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../services/oauth_helper.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Importar Vídeo (`/importacao/importar` + `/ia/consumo`)
class ImportVideoScreen extends StatefulWidget {
  final VoidCallback onOpenRankingPro;

  const ImportVideoScreen({super.key, required this.onOpenRankingPro});

  @override
  State<ImportVideoScreen> createState() => _ImportVideoScreenState();
}

class _ImportVideoScreenState extends State<ImportVideoScreen> {
  final ApiService _api = ApiService.instance;
  final TextEditingController _urlCtrl = TextEditingController();
  bool _extracting = false;
  int _extractionStep = 0;
  Recipe? _extractedRecipe;
  Map<String, dynamic>? _videoMeta;
  String? _errorMsg;

  static const List<({String label, String url})> _sampleVideos = [
    (
      label: 'Carbonara Tradicional Italiano',
      url: 'https://www.youtube.com/watch?v=3AAdKl1UYZs',
    ),
    (
      label: 'Bolo de Chocolate Fofinho',
      url: 'https://www.youtube.com/watch?v=dsJtgmAhFF4',
    ),
    (
      label: 'Risoto Cremoso de Funghi',
      url: 'https://www.youtube.com/watch?v=2G5529f27wQ',
    ),
  ];

  @override
  void dispose() {
    _urlCtrl.dispose();
    super.dispose();
  }

  Future<void> _importFromUrl([String? customUrl]) async {
    final target = (customUrl ?? _urlCtrl.text).trim();
    if (target.isEmpty) {
      setState(() => _errorMsg = 'Cole o link de um vídeo culinário do YouTube.');
      return;
    }
    if (!target.contains('youtube.com') && !target.contains('youtu.be')) {
      setState(
        () => _errorMsg = 'Informe um link válido do YouTube (youtube.com ou youtu.be).',
      );
      return;
    }
    if (customUrl != null) _urlCtrl.text = customUrl;

    setState(() {
      _extracting = true;
      _extractionStep = 1;
      _errorMsg = null;
      _extractedRecipe = null;
    });

    await Future.delayed(const Duration(milliseconds: 500));
    if (mounted && _extracting) setState(() => _extractionStep = 2);

    final res = await _api.importVideoRecipe(target);

    if (!mounted) return;
    setState(() {
      _extracting = false;
      _extractionStep = 3;
      if (res.ok && res.recipe != null) {
        _extractedRecipe = res.recipe;
        _videoMeta = res.videoMeta;
      } else {
        _errorMsg = res.message;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cons = _api.iaConsumption;

    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 36),
      children: [
        SaboreCreditBanner(
          featureTitle: 'Importador de Vídeos',
          isPro: cons.isPro,
          remaining: cons.videoRestantes,
          limit: cons.videoLimite,
          onOpenRankingPro: widget.onOpenRankingPro,
        ),
        const SizedBox(height: 16),

        Text('Importar Receita de Vídeo', style: AppTextStyles.headingLg),
        Text(
          'Cole a URL de um vídeo culinário do YouTube para extrair ingredientes, quantidades e modo de preparo automaticamente.',
          style: AppTextStyles.bodyMuted,
        ),
        const SizedBox(height: 16),

        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.glassBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _urlCtrl,
                onSubmitted: (_) => _importFromUrl(),
                decoration: const InputDecoration(
                  labelText: 'Link do Vídeo (YouTube)',
                  hintText: 'https://www.youtube.com/watch?v=...',
                  prefixIcon: Icon(Icons.play_circle_outline_rounded, color: AppColors.accent),
                ),
              ),
              const SizedBox(height: 14),
              ElevatedButton.icon(
                onPressed: _extracting ? null : () => _importFromUrl(),
                icon: const Icon(Icons.auto_fix_high_rounded),
                label: Text(_extracting ? 'Extraindo Receita...' : 'Extrair Receita do Vídeo'),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),
        Text('Ou experimente com um vídeo culinário do YouTube:', style: AppTextStyles.label),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _sampleVideos.map((v) {
            return ActionChip(
              avatar:
                  const Icon(Icons.ondemand_video_rounded, size: 15, color: AppColors.accent),
              label: Text(v.label, style: const TextStyle(fontSize: 12)),
              backgroundColor: AppColors.darkCard,
              onPressed: _extracting ? null : () => _importFromUrl(v.url),
            );
          }).toList(),
        ),

        if (_extracting) ...[
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _stepRow(
                  1,
                  'Conectando ao YouTube e processando transcrição...',
                  _extractionStep >= 1,
                ),
                const SizedBox(height: 10),
                _stepRow(
                  2,
                  'Identificando ingredientes e medidas exatas com IA...',
                  _extractionStep >= 2,
                ),
                const SizedBox(height: 10),
                _stepRow(
                  3,
                  'Organizando etapas do modo de preparo...',
                  _extractionStep >= 3,
                ),
              ],
            ),
          ),
        ],

        if (_errorMsg != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.danger),
            ),
            child: Text(_errorMsg!, style: const TextStyle(color: AppColors.danger)),
          ),
        ],

        if (_extractedRecipe != null) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.success),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('Receita Extraída com Sucesso!', style: AppTextStyles.subtitle),
                    ),
                    if (_videoMeta?['urlOriginal'] != null)
                      TextButton.icon(
                        onPressed: () =>
                            openExternalUrl(_videoMeta!['urlOriginal'].toString()),
                        icon: const Icon(Icons.open_in_new_rounded, size: 15),
                        label: const Text('Assistir no YouTube', style: TextStyle(fontSize: 12)),
                      ),
                  ],
                ),
                if (_extractedRecipe!.imagem != null &&
                    _extractedRecipe!.imagem!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  SaboreImage(
                    imageSource: _extractedRecipe!.imagem,
                    height: 175,
                    width: double.infinity,
                    borderRadius: BorderRadius.circular(14),
                    fallbackLabel: _extractedRecipe!.titulo,
                  ),
                ],
                const SizedBox(height: 12),
                Text(_extractedRecipe!.titulo, style: AppTextStyles.headingLg),
                if (_videoMeta != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Fonte: ${_videoMeta!['canal'] ?? 'YouTube'} • ⏱ ${_extractedRecipe!.tempoPreparo} min • 🍽 ${_extractedRecipe!.porcoes} porções • ${_extractedRecipe!.dificuldade}',
                    style: AppTextStyles.bodyMuted,
                  ),
                ],
                const SizedBox(height: 16),
                Text(
                  'Ingredientes Extraídos (${_extractedRecipe!.ingredientes.length})',
                  style: AppTextStyles.headingSm,
                ),
                const SizedBox(height: 8),
                ..._extractedRecipe!.ingredientes.map(
                  (i) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text('• ${i.displayText}', style: AppTextStyles.body),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Passos do Preparo', style: AppTextStyles.headingSm),
                const SizedBox(height: 8),
                ..._extractedRecipe!.steps.asMap().entries.map(
                      (e) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(
                          '${e.key + 1}. ${e.value}',
                          style: AppTextStyles.body,
                        ),
                      ),
                    ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () =>
                            showSaveRecipeToBookDialog(context, _extractedRecipe!),
                        icon: const Icon(Icons.bookmark_add_rounded, size: 18),
                        label: const Text('Salvar no Meu Livro'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => showRecipeDetailModal(context, _extractedRecipe!),
                        icon: const Icon(Icons.play_circle_outline_rounded, size: 18),
                        label: const Text('Modo Passo a Passo'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _stepRow(int step, String text, bool active) {
    return Row(
      children: [
        Icon(
          active ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          color: active ? AppColors.accent : AppColors.textMuted,
          size: 20,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: AppTextStyles.body.copyWith(
              color: active ? AppColors.textPrimary : AppColors.textMuted,
            ),
          ),
        ),
      ],
    );
  }
}
