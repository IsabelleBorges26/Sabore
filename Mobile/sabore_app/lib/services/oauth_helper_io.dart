import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'oauth_helper_stub.dart';

export 'oauth_helper_stub.dart' show PickedImageFile;

String getCurrentBrowserOrigin() => 'http://localhost:3000';
String getBrowserUrlFragment() => '';
void clearBrowserUrlFragment() {}

String? webLocalStorageGet(String key) => null;
void webLocalStorageSet(String key, String value) {}
void webLocalStorageRemove(String key) {}

Future<void> openExternalUrl(String url) async {
  try {
    if (Platform.isWindows) {
      await Process.run('cmd', ['/c', 'start', '', url]);
    } else if (Platform.isMacOS) {
      await Process.run('open', [url]);
    } else if (Platform.isLinux) {
      await Process.run('xdg-open', [url]);
    }
  } catch (_) {}
}

/// Abre o seletor nativo de arquivos de imagem no Windows/macOS/Linux
/// e retorna o Data URL Base64 validado (máx 10MB, JPG/PNG/WEBP/GIF).
Future<PickedImageFile?> pickImageFromDevice({
  int maxWidth = 900,
  double quality = 0.82,
  bool fromCamera = false,
}) async {
  try {
    String? filePath;
    if (Platform.isAndroid || Platform.isIOS) {
      final picked = await ImagePicker().pickImage(
        source: fromCamera ? ImageSource.camera : ImageSource.gallery,
        maxWidth: maxWidth.toDouble(),
        imageQuality: (quality * 100).round(),
      );
      filePath = picked?.path;
    } else if (Platform.isWindows) {
      final res = await Process.run('powershell', [
        '-NoProfile',
        '-STA',
        '-Command',
        "Add-Type -AssemblyName System.Windows.Forms; "
            "\$f = New-Object System.Windows.Forms.OpenFileDialog; "
            "\$f.Title = 'Selecionar foto do prato - Saboré'; "
            "\$f.Filter = 'Imagens (*.jpg;*.jpeg;*.png;*.webp;*.gif)|*.jpg;*.jpeg;*.png;*.webp;*.gif'; "
            "if (\$f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output \$f.FileName }"
      ]);
      final out = res.stdout.toString().trim();
      if (out.isNotEmpty) filePath = out.split(RegExp(r'\r?\n')).last.trim();
    } else if (Platform.isMacOS) {
      final res = await Process.run('osascript', [
        '-e',
        'POSIX path of (choose file of type {"public.image"} with prompt "Selecionar foto do prato")'
      ]);
      final out = res.stdout.toString().trim();
      if (out.isNotEmpty) filePath = out;
    } else if (Platform.isLinux) {
      final res = await Process.run('zenity', [
        '--file-selection',
        '--title=Selecionar foto do prato',
        '--file-filter=Imagens | *.jpg *.jpeg *.png *.webp *.gif'
      ]);
      final out = res.stdout.toString().trim();
      if (out.isNotEmpty) filePath = out;
    }

    if (filePath == null || filePath.isEmpty) return null;
    final file = File(filePath);
    if (!await file.exists()) return null;

    final bytes = await file.readAsBytes();
    if (bytes.length > 10 * 1024 * 1024) {
      return const PickedImageFile(
        dataUrl: '',
        fileName: '',
        fileSizeBytes: 0,
        error: 'A imagem selecionada excede o limite máximo de 10MB.',
      );
    }

    final fileName = filePath.split(RegExp(r'[\\/]')).last;
    final lower = fileName.toLowerCase();
    String mime = 'image/jpeg';
    if (lower.endsWith('.png')) {
      mime = 'image/png';
    } else if (lower.endsWith('.webp')) {
      mime = 'image/webp';
    } else if (lower.endsWith('.gif')) {
      mime = 'image/gif';
    }

    final b64 = base64Encode(bytes);
    return PickedImageFile(
      dataUrl: 'data:$mime;base64,$b64',
      fileName: fileName,
      fileSizeBytes: bytes.length,
    );
  } on PlatformException catch (error) {
    return PickedImageFile(
      dataUrl: '',
      fileName: '',
      fileSizeBytes: 0,
      error: error.message ?? 'Não foi possível acessar as imagens do dispositivo.',
    );
  } catch (error) {
    return PickedImageFile(
      dataUrl: '',
      fileName: '',
      fileSizeBytes: 0,
      error: 'Não foi possível abrir a imagem: $error',
    );
  }
}

/// Inicia fluxo OAuth (Google / Facebook) em plataformas Desktop/Mobile abrindo o navegador
/// do sistema e escutando o redirecionamento em um servidor HTTP local temporário.
Future<String?> launchOAuthFlow(String supabaseUrl, String provider) async {
  HttpServer? server;
  try {
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final port = server.port;
    final callbackUrl = 'http://localhost:$port/callback';
    final authUrl =
        '$supabaseUrl/auth/v1/authorize?provider=$provider&redirect_to=${Uri.encodeComponent(callbackUrl)}';

    await openExternalUrl(authUrl);

    final completer = Completer<String?>();
    final timer = Timer(const Duration(minutes: 3), () {
      if (!completer.isCompleted) completer.complete(null);
    });

    await for (final HttpRequest request in server) {
      final path = request.uri.path;
      if (path == '/callback') {
        request.response.headers.contentType = ContentType.html;
        request.response.write('''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Autenticando no Saboré...</title>
  <style>
    body { background: #121F1C; color: #F2F4F3; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #213530; padding: 32px; border-radius: 20px; border: 1px solid rgba(240,213,182,0.2); max-width: 420px; }
    h2 { color: #F0D5B6; margin-top: 0; }
    p { color: #ccc; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Conectando ao Saboré...</h2>
    <p id="msg">Finalizando seu login social. Aguarde um instante...</p>
  </div>
  <script>
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const search = window.location.search ? window.location.search.substring(1) : '';
    const params = hash || search;
    if (params.includes('access_token=')) {
      fetch('/token?' + params).then(() => {
        document.getElementById('msg').innerText = 'Login concluído com sucesso! Você já pode fechar esta aba e voltar ao aplicativo Saboré.';
      });
    } else {
      document.getElementById('msg').innerText = 'Não foi possível localizar o token de sessão. Tente novamente.';
    }
  </script>
</body>
</html>
''');
        await request.response.close();
      } else if (path == '/token') {
        final token = request.uri.queryParameters['access_token'];
        request.response.headers.contentType = ContentType.text;
        request.response.write('OK');
        await request.response.close();
        if (!completer.isCompleted) {
          completer.complete(token);
        }
        break;
      } else {
        request.response.statusCode = 404;
        await request.response.close();
      }
    }

    timer.cancel();
    await server.close(force: true);
    return await completer.future;
  } catch (_) {
    try {
      await server?.close(force: true);
    } catch (_) {}
    return null;
  }
}
