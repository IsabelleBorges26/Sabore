import 'dart:convert';
import 'dart:js_interop';
import 'oauth_helper_stub.dart';

export 'oauth_helper_stub.dart' show PickedImageFile;

@JS('window.location.origin')
external String get _jsOrigin;

@JS('window.location.hash')
external String get _jsHash;

@JS('window.location.search')
external String get _jsSearch;

@JS('window.__saboreInitialHash')
external String? get _jsInitialHash;

@JS('window.__saboreInitialSearch')
external String? get _jsInitialSearch;

@JS('window.location.assign')
external void _jsLocationAssign(String url);

@JS('window.history.replaceState')
external void _jsReplaceState(JSAny? data, String title, String url);

@JS('window.saboreLocalStorageGet')
external String? _jsLocalStorageGet(String key);

@JS('window.saboreLocalStorageSet')
external void _jsLocalStorageSet(String key, String value);

@JS('window.saboreLocalStorageRemove')
external void _jsLocalStorageRemove(String key);

@JS('window.saboreOpenExternalUrl')
external void _jsOpenExternalUrl(String url);

@JS('window.saborePickImageBase64')
external JSPromise<JSString?> _jsPickImageBase64(int maxWidth, double quality);

String getCurrentBrowserOrigin() {
  try {
    return _jsOrigin;
  } catch (_) {
    return Uri.base.origin;
  }
}

String getBrowserUrlFragment() {
  try {
    final initH = _jsInitialHash ?? '';
    if (initH.contains('access_token=')) {
      return initH.startsWith('#') ? initH.substring(1) : initH;
    }
    final h = _jsHash;
    if (h.isNotEmpty) return h.startsWith('#') ? h.substring(1) : h;
    final initS = _jsInitialSearch ?? '';
    if (initS.contains('access_token=')) {
      return initS.startsWith('?') ? initS.substring(1) : initS;
    }
    final s = _jsSearch;
    if (s.isNotEmpty) return s.startsWith('?') ? s.substring(1) : s;
  } catch (_) {}
  return Uri.base.fragment;
}

void clearBrowserUrlFragment() {
  try {
    _jsReplaceState(null, '', '/');
  } catch (_) {}
}

String? webLocalStorageGet(String key) {
  try {
    return _jsLocalStorageGet(key);
  } catch (_) {
    return null;
  }
}

void webLocalStorageSet(String key, String value) {
  try {
    _jsLocalStorageSet(key, value);
  } catch (_) {}
}

void webLocalStorageRemove(String key) {
  try {
    _jsLocalStorageRemove(key);
  } catch (_) {}
}

Future<void> openExternalUrl(String url) async {
  try {
    _jsOpenExternalUrl(url);
  } catch (_) {
    _jsLocationAssign(url);
  }
}

Future<PickedImageFile?> pickImageFromDevice({
  int maxWidth = 900,
  double quality = 0.82,
  bool fromCamera = false,
}) async {
  try {
    final jsStr = await _jsPickImageBase64(maxWidth, quality).toDart;
    if (jsStr == null) return null;
    final rawJson = jsStr.toDart;
    if (rawJson.isEmpty) return null;
    final decoded = jsonDecode(rawJson);
    if (decoded is Map<String, dynamic>) {
      if (decoded['error'] != null) {
        return PickedImageFile(
          dataUrl: '',
          fileName: '',
          fileSizeBytes: 0,
          error: decoded['error'].toString(),
        );
      }
      final dataUrl = (decoded['dataUrl'] ?? '').toString();
      if (dataUrl.isEmpty) return null;
      return PickedImageFile(
        dataUrl: dataUrl,
        fileName: (decoded['fileName'] ?? 'imagem.jpg').toString(),
        fileSizeBytes: int.tryParse((decoded['fileSize'] ?? 0).toString()) ?? 0,
      );
    }
  } catch (_) {}
  return null;
}

/// No Flutter Web (Chrome/Edge), redireciona para o fluxo OAuth do Supabase
/// exatamente como `authClient.auth.signInWithOAuth` no Saboré Web (`Front-End/login/script.js`).
Future<String?> launchOAuthFlow(String supabaseUrl, String provider) async {
  final redirectTo = '${getCurrentBrowserOrigin()}/';
  final authUrl =
      '$supabaseUrl/auth/v1/authorize?provider=$provider&redirect_to=${Uri.encodeComponent(redirectTo)}';
  _jsLocationAssign(authUrl);
  return null;
}
