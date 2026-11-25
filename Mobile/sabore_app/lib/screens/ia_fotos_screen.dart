import 'package:flutter/material.dart';
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import '../widgets/recipe_detail_modal.dart';
import '../widgets/sabore_widgets.dart';

/// Aba Scanner IA por Foto (`/ia/analisar-foto` + `/ia/gerar-receita-foto` + `/ia/consumo`)
class IaFotosScreen extends StatefulWidget {
  final VoidCallback onOpenRankingPro;

  const IaFotosScreen({super.key, required this.onOpenRankingPro});

  @override
  State<IaFotosScreen> createState() => _IaFotosScreenState();
}

class _IaFotosScreenState extends State<IaFotosScreen> {
  final ApiService _api = ApiService.instance;
  PickedImageData? _selectedPhoto;
  bool _scanning = false;
  bool _generatingRecipe = false;
  PhotoAnalysisResult? _analysis;
  Recipe? _generatedRecipe;
  String? _errorMsg;

  static const List<({String title, String url})> _sampleDishes = [
    (
      title: 'Pizza Napolitana Artesanal',
      url:
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    ),
    (
      title: 'Hambúrguer Gourmet com Cheddar',
      url:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    ),
    (
      title: 'Salada Mediterrânea Fresca',
      url:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    ),
    (
      title: 'Combinado de Sushi & Salmão',
      url:
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    ),
  ];

  Future<void> _analyzePhoto({required PickedImageData photo}) async {
    setState(() {
      _selectedPhoto = photo;
      _scanning = true;
      _errorMsg = null;
      _analysis = null;
      _generatedRecipe = null;
    });

    try {
      final base64DataUri = await ensureBase64DataUri(photo.dataUri);
      final res = await _api.analyzeDishPhoto(imagemBase64: base64DataUri);
      if (!mounted) return;
      setState(() {
        _scanning = false;
        if (res.ok && res.result != null) {
          _analysis = res.result;
          _generatedRecipe = null;
        } else {
          _errorMsg = res.message;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _scanning = false;
        _errorMsg = e.toString();
      });
    }
  }

  Future<void> _generateRecipeFromDetected() async {
    if (_analysis == null) return;
    setState(() => _generatingRecipe = true);
    final res = await _api.generateRecipeFromPhotoAnalysis(
      _analysis!,
      imagemOriginal: _selectedPhoto?.dataUri,
    );
    if (!mounted) return;
    setState(() {
      _generatingRecipe = false;
      if (res.ok && res.recipe != null) {
        _generatedRecipe = res.recipe;
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.message)),
        );
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
          featureTitle: 'Scanner IA por Foto',
          isPro: cons.isPro,
          remaining: cons.fotoRestantes,
          limit: cons.fotoLimite,
          onOpenRankingPro: widget.onOpenRankingPro,
        ),
        const SizedBox(height: 16),

        Text('Reconhecimento Gastronômico por Foto',
            style: AppTextStyles.headingLg),
        Text(
          'Envie a foto de um prato ou de ingredientes na bancada para identificar cada item e gerar a receita completa.',
          style: AppTextStyles.bodyMuted,
        ),
        const SizedBox(height: 16),

        // Área de Upload / Captura
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.accentBorder),
          ),
          child: Column(
            children: [
              if (_selectedPhoto != null) ...[
                SaboreImage(
                  imageSource: _selectedPhoto!.dataUri,
                  height: 200,
                  width: double.infinity,
                  borderRadius: BorderRadius.circular(14),
                ),
                const SizedBox(height: 12),
              ] else ...[
                const Icon(Icons.camera_enhance_rounded,
                    size: 48, color: AppColors.accent),
                const SizedBox(height: 10),
                Text(
                  'Selecione uma imagem da galeria ou câmera',
                  style: AppTextStyles.headingSm,
                ),
                const SizedBox(height: 4),
                Text(
                  'Suporta JPG, PNG e WEBP em alta resolução',
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 12),
                ),
                const SizedBox(height: 14),
              ],
              Wrap(
                spacing: 10,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: _scanning
                        ? null
                        : () async {
                            final picked = await showSaboreImagePicker(
                              context,
                              title: 'Escolher Foto do Prato para Análise IA',
                            );
                            if (picked != null) {
                              await _analyzePhoto(photo: picked);
                            }
                          },
                    icon: const Icon(Icons.add_a_photo_rounded, size: 18),
                    label: Text(_selectedPhoto == null
                        ? 'Escolher Foto'
                        : 'Trocar Foto'),
                  ),
                  if (_selectedPhoto != null)
                    OutlinedButton.icon(
                      onPressed: _scanning
                          ? null
                          : () => _analyzePhoto(photo: _selectedPhoto!),
                      icon:
                          const Icon(Icons.document_scanner_outlined, size: 18),
                      label: const Text('Analisar Novamente'),
                    ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),
        Text('Ou teste agora com um prato de demonstração:',
            style: AppTextStyles.label),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _sampleDishes.map((sample) {
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: ActionChip(
                  avatar: const Icon(Icons.restaurant_rounded,
                      size: 15, color: AppColors.accent),
                  label: Text(sample.title),
                  backgroundColor: AppColors.darkCard,
                  onPressed: _scanning
                      ? null
                      : () => _analyzePhoto(
                            photo: PickedImageData(
                              dataUri: sample.url,
                              fileName: '${sample.title}.jpg',
                              sizeKb: 220,
                            ),
                          ),
                ),
              );
            }).toList(),
          ),
        ),

        if (_scanning) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              children: [
                const CircularProgressIndicator(color: AppColors.accent),
                const SizedBox(height: 14),
                Text('Escaneando texturas, cores e ingredientes...',
                    style: AppTextStyles.subtitle),
                const SizedBox(height: 6),
                Text(
                  'A Visão Computacional do Saboré está calculando o grau de confiança de cada ingrediente.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodyMuted,
                ),
              ],
            ),
          ),
        ],

        if (_errorMsg != null) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.danger.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.danger),
            ),
            child: Text(_errorMsg!,
                style: const TextStyle(color: AppColors.danger)),
          ),
        ],

        if (_analysis != null) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.glassBorderHover),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.verified_rounded,
                        color: AppColors.success),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _analysis!.pratoIdentificado,
                        style: AppTextStyles.headingMd,
                      ),
                    ),
                  ],
                ),
                if (_analysis!.descricao.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(_analysis!.descricao, style: AppTextStyles.bodyMuted),
                ],
                const SizedBox(height: 16),
                Text(
                  'Ingredientes Detectados (${_analysis!.ingredientes.length})',
                  style: AppTextStyles.headingSm,
                ),
                const SizedBox(height: 10),
                ..._analysis!.ingredientes.map((ing) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              ing.nome,
                              style: AppTextStyles.body
                                  .copyWith(fontWeight: FontWeight.w600),
                            ),
                            Text(
                              '${ing.confianca}% confiança',
                              style: AppTextStyles.mono.copyWith(fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(999),
                          child: LinearProgressIndicator(
                            value: ing.confianca / 100.0,
                            minHeight: 6,
                            backgroundColor: AppColors.darkDeep,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                AppColors.accent),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed:
                        _generatingRecipe ? null : _generateRecipeFromDetected,
                    icon: _generatingRecipe
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.auto_awesome_rounded),
                    label: Text(
                      _generatingRecipe
                          ? 'Gerando Receita...'
                          : 'Gerar Receita com estes Ingredientes',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        if (_generatedRecipe != null) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_generatedRecipe!.titulo, style: AppTextStyles.headingMd),
                const SizedBox(height: 6),
                Text(
                  '⏱ ${_generatedRecipe!.tempoPreparo} min • 🍽 ${_generatedRecipe!.porcoes} porções • ${_generatedRecipe!.dificuldade}',
                  style: AppTextStyles.mono,
                ),
                if (_generatedRecipe!.ingredientes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text('Ingredientes da Receita:', style: AppTextStyles.label),
                  const SizedBox(height: 6),
                  ..._generatedRecipe!.ingredientes.map(
                    (i) => Padding(
                      padding: const EdgeInsets.only(bottom: 3),
                      child:
                          Text('• ${i.displayText}', style: AppTextStyles.body),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => showSaveRecipeToBookDialog(
                            context, _generatedRecipe!),
                        icon: const Icon(Icons.bookmark_add_rounded, size: 18),
                        label: const Text('Salvar no Meu Livro'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            showRecipeDetailModal(context, _generatedRecipe!),
                        icon: const Icon(Icons.menu_book_rounded, size: 18),
                        label: const Text('Ver Passo a Passo'),
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
}
