import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/sabore_models.dart';
import '../services/api_service.dart';
import '../services/oauth_helper.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

/// Avatar oficial do Saboré com suporte a Base64, URL, iniciais e Molduras Comemorativas
class SaboreAvatar extends StatelessWidget {
  final String name;
  final String? imageSource;
  final String? frameId;
  final bool isPro;
  final double radius;
  final VoidCallback? onTap;

  const SaboreAvatar({
    super.key,
    required this.name,
    this.imageSource,
    this.frameId,
    this.isPro = false,
    this.radius = 22,
    this.onTap,
  });

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'S';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  LinearGradient? get _frameGradient {
    final f = (frameId ?? '').toLowerCase();
    if (f.contains('natal')) return AppColors.frameNatalGradient;
    if (f.contains('reveillon') || f.contains('virada')) {
      return AppColors.frameReveillonGradient;
    }
    if (f.contains('mestre') || f.contains('semanal')) {
      return AppColors.proGoldGradient;
    }
    if (isPro) return AppColors.proGoldGradient;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final grad = _frameGradient;
    final avatarContent = CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.surface,
      child: ClipOval(
        child: SizedBox(
          width: radius * 2,
          height: radius * 2,
          child: _buildImageOrInitials(),
        ),
      ),
    );

    final wrapped = grad != null
        ? Container(
            padding: const EdgeInsets.all(2.6),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: grad,
              boxShadow: [
                BoxShadow(
                  color: AppColors.proGold.withValues(alpha: 0.28),
                  blurRadius: 8,
                  spreadRadius: 0.5,
                ),
              ],
            ),
            child: avatarContent,
          )
        : Container(
            padding: const EdgeInsets.all(1.5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.accentBorder, width: 1.5),
            ),
            child: avatarContent,
          );

    if (onTap == null) return wrapped;
    return GestureDetector(onTap: onTap, child: wrapped);
  }

  Widget _buildImageOrInitials() {
    final src = imageSource?.trim() ?? '';
    if (src.isNotEmpty && src != 'null') {
      if (src.startsWith('data:image')) {
        try {
          final comma = src.indexOf(',');
          if (comma != -1) {
            final bytes = base64Decode(src.substring(comma + 1));
            return Image.memory(bytes, fit: BoxFit.cover);
          }
        } catch (_) {}
      } else if (src.startsWith('http')) {
        return Image.network(
          src,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _initialsWidget(),
        );
      }
    }
    return _initialsWidget();
  }

  Widget _initialsWidget() {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.accentGradient),
      alignment: Alignment.center,
      child: Text(
        _initials,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: radius * 0.78,
        ),
      ),
    );
  }
}

/// Badge FREE / PRO idêntica ao Saboré Web
class SaborePlanBadge extends StatelessWidget {
  final bool isPro;
  final bool compact;

  const SaborePlanBadge({
    super.key,
    required this.isPro,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isPro) {
      return Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 8 : 10,
          vertical: compact ? 3 : 4,
        ),
        decoration: BoxDecoration(
          gradient: AppColors.proGoldGradient,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [
            BoxShadow(
              color: AppColors.proGold.withValues(alpha: 0.35),
              blurRadius: 8,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.workspace_premium,
                size: compact ? 12 : 14, color: AppColors.darkDeep),
            const SizedBox(width: 3),
            Text(
              'PRO',
              style: TextStyle(
                color: AppColors.darkDeep,
                fontWeight: FontWeight.w900,
                fontSize: compact ? 10 : 11,
                letterSpacing: 0.6,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 4,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.glassBorderHover),
      ),
      child: Text(
        'FREE',
        style: TextStyle(
          color: AppColors.secondary,
          fontWeight: FontWeight.w700,
          fontSize: compact ? 10 : 11,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// Renderizador universal de imagens (Base64 Data URI, URL HTTP ou Fallback Gastronômico)
class SaboreImage extends StatelessWidget {
  final String? imageSource;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final String fallbackLabel;

  const SaboreImage({
    super.key,
    required this.imageSource,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.fallbackLabel = 'Saboré',
  });

  @override
  Widget build(BuildContext context) {
    final content = _buildContent();
    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: content);
    }
    return content;
  }

  Widget _buildContent() {
    final src = imageSource?.trim() ?? '';
    if (src.isNotEmpty && src != 'null') {
      if (src.startsWith('data:image')) {
        try {
          final comma = src.indexOf(',');
          if (comma != -1) {
            final bytes = base64Decode(src.substring(comma + 1));
            return Image.memory(
              bytes,
              width: width,
              height: height,
              fit: fit,
              errorBuilder: (_, __, ___) => _placeholder(),
            );
          }
        } catch (_) {}
      } else if (src.startsWith('http')) {
        return Image.network(
          src,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, __, ___) => _placeholder(),
        );
      } else if (src.startsWith('assets/')) {
        return Image.asset(
          src,
          width: width,
          height: height,
          fit: fit,
          errorBuilder: (_, __, ___) => _placeholder(),
        );
      }
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      width: width,
      height: height,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF28423B), Color(0xFF192B26)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.restaurant_menu_rounded,
              color: AppColors.accent, size: 32),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              fallbackLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodyMuted.copyWith(fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}

/// Banner de Créditos Mensais (Chef IA, IA Fotos, Importar Vídeo)
class SaboreCreditBanner extends StatelessWidget {
  final String featureTitle;
  final bool isPro;
  final int remaining;
  final int limit;
  final VoidCallback onOpenRankingPro;

  const SaboreCreditBanner({
    super.key,
    required this.featureTitle,
    required this.isPro,
    required this.remaining,
    required this.limit,
    required this.onOpenRankingPro,
  });

  @override
  Widget build(BuildContext context) {
    if (isPro) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: AppColors.proBannerGradient,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.proBorder),
        ),
        child: Row(
          children: [
            const Icon(Icons.workspace_premium,
                color: AppColors.proGold, size: 22),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '$featureTitle Ilimitado ativo no seu plano Saboré PRO!',
                style: AppTextStyles.body.copyWith(
                  color: AppColors.secondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SaborePlanBadge(isPro: true, compact: true),
          ],
        ),
      );
    }

    final exhausted = remaining <= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: exhausted
            ? AppColors.danger.withValues(alpha: 0.14)
            : AppColors.darkCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: exhausted
              ? AppColors.danger.withValues(alpha: 0.5)
              : AppColors.accentBorder,
        ),
      ),
      child: Row(
        children: [
          Icon(
            exhausted ? Icons.lock_clock_outlined : Icons.bolt_rounded,
            color: exhausted ? AppColors.danger : AppColors.accent,
            size: 22,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  exhausted
                      ? 'Seus $limit créditos gratuitos deste mês acabaram'
                      : 'Plano FREE: $remaining de $limit créditos gratuitos restantes neste mês',
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: exhausted ? AppColors.danger : AppColors.textPrimary,
                  ),
                ),
                Text(
                  'Fique no Top 5 do Ranking PRO mensal para liberar uso ilimitado!',
                  style: AppTextStyles.bodyMuted.copyWith(fontSize: 11.5),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onOpenRankingPro,
            style: TextButton.styleFrom(
              backgroundColor: AppColors.proGold.withValues(alpha: 0.16),
              foregroundColor: AppColors.proGold,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text(
              'Ver Ranking',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

/// Resultado de seleção de imagem do dispositivo/galeria
class PickedImageData {
  final String dataUri;
  final String fileName;
  final double sizeKb;

  const PickedImageData({
    required this.dataUri,
    required this.fileName,
    required this.sizeKb,
  });
}

/// Converte uma URL HTTP de imagem em Data URI Base64 (`data:image/jpeg;base64,...`)
/// para endpoints que exigem Base64 (como `/ia/analisar-foto`).
Future<String> ensureBase64DataUri(String source) async {
  if (source.startsWith('data:image')) return source;
  if (source.startsWith('http')) {
    final res =
        await http.get(Uri.parse(source)).timeout(const Duration(seconds: 20));
    if (res.statusCode < 200 ||
        res.statusCode >= 300 ||
        res.bodyBytes.isEmpty) {
      throw Exception('Não foi possível baixar a imagem para análise.');
    }
    if (res.bodyBytes.length > 10 * 1024 * 1024) {
      throw Exception('A imagem excede o limite de 10 MB.');
    }
    final mimeType =
        res.headers['content-type']?.split(';').first ?? 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      throw Exception('O endereço informado não retornou uma imagem válida.');
    }
    return 'data:$mimeType;base64,${base64Encode(res.bodyBytes)}';
  }
  throw Exception(
      'Formato da imagem inválido. Escolha uma imagem JPG, PNG ou WEBP.');
}

/// Modal Seletor de Arquivos/Imagens Multiplataforma:
/// 1) Abre o seletor nativo de arquivos do dispositivo (`pickImageFromDevice()`)
/// 2) Permite informar caminho manual no Desktop ou escolher da galeria gastronômica
Future<PickedImageData?> showSaboreImagePicker(
  BuildContext context, {
  String title = 'Escolher Arquivo de Imagem',
}) async {
  final pathCtrl = TextEditingController();
  String? errorText;
  bool pickingDeviceFile = false;

  final galleryPresets = [
    (
      name: 'risoto_camarao_trufado.jpg',
      label: 'Risoto Cremoso de Camarão & Limão Siciliano',
      url:
          'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
    ),
    (
      name: 'nhoque_artesanal_sugo.jpg',
      label: 'Nhoque Artesanal ao Molho Rústico de Tomates',
      url:
          'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    ),
    (
      name: 'salmao_grelhado_ervas.jpg',
      label: 'Salmão Grelhado com Crosta de Ervas Finas',
      url:
          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    ),
    (
      name: 'torta_chocolate_belga.jpg',
      label: 'Torta Ganache de Chocolate Belga 70% & Frutas',
      url:
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    ),
    (
      name: 'bowl_mediterraneo_fit.jpg',
      label: 'Bowl Mediterrâneo de Quinoa, Abacate & Grão-de-Bico',
      url:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    ),
  ];

  return showDialog<PickedImageData>(
    context: context,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          Future<void> selectDeviceImage({bool fromCamera = false}) async {
            setState(() {
              pickingDeviceFile = true;
              errorText = null;
            });
            final picked = await pickImageFromDevice(fromCamera: fromCamera);
            if (!ctx.mounted) return;
            setState(() => pickingDeviceFile = false);
            if (picked == null) return;
            if (picked.error != null) {
              setState(() => errorText = picked.error);
              return;
            }
            Navigator.of(ctx).pop(
              PickedImageData(
                dataUri: picked.dataUrl,
                fileName: picked.fileName,
                sizeKb: picked.fileSizeBytes / 1024.0,
              ),
            );
          }

          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.add_photo_alternate_rounded,
                    color: AppColors.accent),
                const SizedBox(width: 10),
                Expanded(child: Text(title, style: AppTextStyles.headingSm)),
              ],
            ),
            content: SizedBox(
              width: 460,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 1. Seletor Nativo do Dispositivo (Web & Desktop)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.darkCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.accentBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            '1. Selecionar imagem da galeria ou arquivos do dispositivo:',
                            style: AppTextStyles.label,
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton.icon(
                            onPressed:
                                pickingDeviceFile ? null : selectDeviceImage,
                            icon: pickingDeviceFile
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.folder_open_rounded,
                                    size: 18),
                            label: Text(
                              pickingDeviceFile
                                  ? 'Abrindo seletor de arquivos...'
                                  : 'Escolher arquivo do dispositivo (JPG, PNG, WEBP)',
                            ),
                          ),
                          if (!kIsWeb &&
                              (defaultTargetPlatform ==
                                      TargetPlatform.android ||
                                  defaultTargetPlatform ==
                                      TargetPlatform.iOS)) ...[
                            const SizedBox(height: 8),
                            OutlinedButton.icon(
                              onPressed: pickingDeviceFile
                                  ? null
                                  : () => selectDeviceImage(fromCamera: true),
                              icon: const Icon(Icons.photo_camera_outlined,
                                  size: 18),
                              label: const Text('Fotografar com a câmera'),
                            ),
                          ],
                          const SizedBox(height: 6),
                          Text(
                            'Tamanho máximo permitido: 10 MB',
                            textAlign: TextAlign.center,
                            style:
                                AppTextStyles.bodyMuted.copyWith(fontSize: 11),
                          ),
                        ],
                      ),
                    ),

                    if (!kIsWeb) ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: pathCtrl,
                              decoration: const InputDecoration(
                                hintText:
                                    'Ou cole o caminho (ex: C:\\fotos\\prato.jpg)',
                                prefixIcon: Icon(
                                    Icons.insert_drive_file_outlined,
                                    size: 18),
                                isDense: true,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () async {
                              final p =
                                  pathCtrl.text.trim().replaceAll('"', '');
                              if (p.isEmpty) {
                                setState(() => errorText =
                                    'Informe o caminho do arquivo.');
                                return;
                              }
                              try {
                                final file = File(p);
                                if (!await file.exists()) {
                                  setState(() => errorText =
                                      'Arquivo não encontrado nesse caminho.');
                                  return;
                                }
                                final bytes = await file.readAsBytes();
                                final kb = bytes.length / 1024.0;
                                if (kb > 10240) {
                                  setState(() => errorText =
                                      'A imagem excede o limite de 10 MB.');
                                  return;
                                }
                                final ext = p.split('.').last.toLowerCase();
                                final mime = ext == 'png'
                                    ? 'image/png'
                                    : (ext == 'webp'
                                        ? 'image/webp'
                                        : 'image/jpeg');
                                final b64 =
                                    'data:$mime;base64,${base64Encode(bytes)}';
                                final name = p.split(RegExp(r'[\\/]')).last;
                                if (ctx.mounted) {
                                  Navigator.of(ctx).pop(
                                    PickedImageData(
                                        dataUri: b64,
                                        fileName: name,
                                        sizeKb: kb),
                                  );
                                }
                              } catch (e) {
                                setState(
                                    () => errorText = 'Erro ao ler imagem: $e');
                              }
                            },
                            child: const Text('Carregar'),
                          ),
                        ],
                      ),
                    ],

                    if (errorText != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        errorText!,
                        style: const TextStyle(
                            color: AppColors.danger, fontSize: 12),
                      ),
                    ],

                    const SizedBox(height: 16),
                    Text(
                      '2. Ou selecione uma foto da Galeria Gastronômica Saboré:',
                      style: AppTextStyles.label,
                    ),
                    const SizedBox(height: 10),
                    ...galleryPresets.map(
                      (item) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: AppColors.darkCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.glassBorder),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 4),
                          leading: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: SaboreImage(
                              imageSource: item.url,
                              width: 52,
                              height: 52,
                              fallbackLabel: item.name,
                            ),
                          ),
                          title: Text(
                            item.label,
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                          subtitle: Text(
                            '${item.name} • 245 KB',
                            style: AppTextStyles.bodyMuted
                                .copyWith(fontSize: 11.5),
                          ),
                          trailing: const Icon(Icons.check_circle_outline,
                              color: AppColors.accent),
                          onTap: () {
                            Navigator.of(ctx).pop(
                              PickedImageData(
                                dataUri: item.url,
                                fileName: item.name,
                                sizeKb: 245.8,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Cancelar'),
              ),
            ],
          );
        },
      );
    },
  );
}

/// Modal para salvar qualquer receita (da Comunidade, Chef IA, IA por Foto ou Vídeo) em um Livro do usuário
Future<void> showSaveRecipeToBookDialog(
    BuildContext context, Recipe recipe) async {
  final api = ApiService.instance;
  if (api.books.isEmpty) {
    await api.fetchBooks();
  }
  if (!context.mounted) return;

  int? selectedBookId = api.books.isNotEmpty ? api.books.first.id : null;
  final newBookCtrl = TextEditingController();
  bool creatingNewBook = api.books.isEmpty;
  bool saving = false;

  await showDialog(
    context: context,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.menu_book_rounded, color: AppColors.accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('Salvar Receita em um Livro',
                      style: AppTextStyles.headingSm),
                ),
              ],
            ),
            content: SizedBox(
              width: 400,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Receita: "${recipe.titulo}"',
                    style: AppTextStyles.subtitle,
                  ),
                  const SizedBox(height: 14),
                  if (api.books.isNotEmpty && !creatingNewBook) ...[
                    Text('Escolha a coleção de destino:',
                        style: AppTextStyles.label),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<int>(
                      initialValue: selectedBookId,
                      dropdownColor: AppColors.darkCard,
                      items: api.books
                          .map(
                            (b) => DropdownMenuItem<int>(
                              value: b.id,
                              child: Text(
                                  '${b.icone}  ${b.nome} (${b.totalReceitas})'),
                            ),
                          )
                          .toList(),
                      onChanged: (v) => setState(() => selectedBookId = v),
                    ),
                    const SizedBox(height: 10),
                    TextButton.icon(
                      onPressed: () => setState(() => creatingNewBook = true),
                      icon: const Icon(Icons.add_circle_outline, size: 18),
                      label: const Text('Ou criar novo livro'),
                    ),
                  ] else ...[
                    Text('Nome do novo livro:', style: AppTextStyles.label),
                    const SizedBox(height: 8),
                    TextField(
                      controller: newBookCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Ex: Favoritas da Família',
                        prefixIcon: Icon(Icons.book_outlined),
                      ),
                    ),
                    if (api.books.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () =>
                            setState(() => creatingNewBook = false),
                        child: const Text('Escolher livro já existente'),
                      ),
                    ],
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.of(ctx).pop(),
                child: const Text('Cancelar'),
              ),
              ElevatedButton.icon(
                onPressed: saving
                    ? null
                    : () async {
                        setState(() => saving = true);
                        int? targetBookId = selectedBookId;
                        if (creatingNewBook) {
                          final bName = newBookCtrl.text.trim().isEmpty
                              ? 'Minhas Receitas'
                              : newBookCtrl.text.trim();
                          final bRes =
                              await api.createBook(nome: bName, icone: '📖');
                          targetBookId = bRes.book?.id;
                        }
                        final res = await api.createRecipe(
                          titulo: recipe.titulo,
                          descricao: recipe.descricao,
                          modoPreparo: recipe.modoPreparo,
                          tempoPreparo: recipe.tempoPreparo,
                          porcoes: recipe.porcoes,
                          dificuldade: recipe.dificuldade,
                          ingredientes: recipe.ingredientes
                              .map((i) => i.toJson())
                              .toList(),
                          livroId: targetBookId,
                          publica: false,
                          criadaPorIA: recipe.criadaPorIA,
                          imagemBase64: recipe.imagem,
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
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.bookmark_added_rounded, size: 18),
                label: Text(saving ? 'Salvando...' : 'Salvar no Livro'),
              ),
            ],
          );
        },
      );
    },
  );
}

/// Card nativo de receita redesenhado especificamente para dispositivos móveis (Android/iOS):
/// Hierarquia visual limpa, badges sobre a imagem, avaliação, tempo, dificuldades, autor com moldura,
/// e botões confortáveis para o toque.
class SaboreMobileRecipeCard extends StatelessWidget {
  final Recipe recipe;
  final bool isFavorite;
  final VoidCallback onTap;
  final VoidCallback onToggleFavorite;
  final VoidCallback? onSaveToBook;
  final Widget? trailingAction;
  final bool compact;

  const SaboreMobileRecipeCard({
    super.key,
    required this.recipe,
    required this.isFavorite,
    required this.onTap,
    required this.onToggleFavorite,
    this.onSaveToBook,
    this.trailingAction,
    this.compact = false,
  });

  Color _difficultyColor(String diff) {
    final lower = diff.toLowerCase();
    if (lower.contains('dif')) return AppColors.danger;
    if (lower.contains('méd') || lower.contains('med')) {
      return AppColors.warning;
    }
    return AppColors.success;
  }

  @override
  Widget build(BuildContext context) {
    final diffColor = _difficultyColor(recipe.dificuldade);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.glassBorderHover),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Thumbnail com badge de tempo sobreposta
                    Stack(
                      children: [
                        SaboreImage(
                          imageSource: recipe.imagem,
                          width: compact ? 84 : 96,
                          height: compact ? 84 : 96,
                          borderRadius: BorderRadius.circular(16),
                          fallbackLabel: recipe.titulo,
                        ),
                        Positioned(
                          bottom: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.darkDeep.withValues(alpha: 0.88),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.glassBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.schedule_rounded,
                                  size: 11,
                                  color: AppColors.secondary,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  '${recipe.tempoPreparo}m',
                                  style: AppTextStyles.mono.copyWith(
                                    fontSize: 10.5,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (recipe.criadaPorIA)
                          Positioned(
                            top: 6,
                            left: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                gradient: AppColors.accentGradient,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.auto_awesome_rounded,
                                      size: 10, color: Colors.white),
                                  SizedBox(width: 2),
                                  Text(
                                    'IA',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 14),

                    // Conteúdo Principal
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Tags superiores (Categoria + Dificuldade)
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.accent.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  recipe.categoria,
                                  style: const TextStyle(
                                    color: AppColors.accent,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: diffColor.withValues(alpha: 0.14),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  recipe.dificuldade,
                                  style: TextStyle(
                                    color: diffColor,
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),

                          // Título
                          Text(
                            recipe.titulo,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTextStyles.headingSm.copyWith(
                              fontSize: 15.5,
                              height: 1.25,
                            ),
                          ),

                          if (recipe.descricao.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              recipe.descricao,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.bodyMuted
                                  .copyWith(fontSize: 12),
                            ),
                          ],
                          const SizedBox(height: 8),

                          // Autor + Avaliação
                          Row(
                            children: [
                              SaboreAvatar(
                                name: recipe.autorNome,
                                imageSource: recipe.autorFoto,
                                frameId: recipe.autorMoldura,
                                isPro: recipe.autorIsPro,
                                radius: 10,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  recipe.autorNome,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTextStyles.bodyMuted.copyWith(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.star_rounded,
                                size: 15,
                                color: AppColors.proGold,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                recipe.mediaAvaliacoes.toStringAsFixed(1),
                                style: AppTextStyles.mono.copyWith(
                                  fontSize: 12,
                                  color: AppColors.proGold,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Botão Favorito ou Ação Customizada
                    const SizedBox(width: 6),
                    Column(
                      children: [
                        Material(
                          color: isFavorite
                              ? AppColors.danger.withValues(alpha: 0.15)
                              : AppColors.darkDeep,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: onToggleFavorite,
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Icon(
                                isFavorite
                                    ? Icons.favorite_rounded
                                    : Icons.favorite_border_rounded,
                                size: 19,
                                color: isFavorite
                                    ? AppColors.danger
                                    : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ),
                        if (onSaveToBook != null) ...[
                          const SizedBox(height: 6),
                          Material(
                            color: AppColors.darkDeep,
                            borderRadius: BorderRadius.circular(12),
                            child: InkWell(
                              onTap: onSaveToBook,
                              borderRadius: BorderRadius.circular(12),
                              child: const Padding(
                                padding: EdgeInsets.all(8),
                                child: Icon(
                                  Icons.bookmark_add_outlined,
                                  size: 18,
                                  color: AppColors.secondary,
                                ),
                              ),
                            ),
                          ),
                        ],
                        if (trailingAction != null) ...[
                          const SizedBox(height: 6),
                          trailingAction!,
                        ],
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
