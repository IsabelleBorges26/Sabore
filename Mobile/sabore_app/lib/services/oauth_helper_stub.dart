class PickedImageFile {
  final String dataUrl;
  final String fileName;
  final int fileSizeBytes;
  final String? error;

  const PickedImageFile({
    required this.dataUrl,
    required this.fileName,
    required this.fileSizeBytes,
    this.error,
  });

  String get formattedSize {
    if (fileSizeBytes < 1024) return '$fileSizeBytes B';
    final kb = fileSizeBytes / 1024;
    if (kb < 1024) return '${kb.toStringAsFixed(1)} KB';
    final mb = kb / 1024;
    return '${mb.toStringAsFixed(2)} MB';
  }
}

Future<String?> launchOAuthFlow(String supabaseUrl, String provider) async {
  return null;
}

String getCurrentBrowserOrigin() => 'http://localhost:3000';
String getBrowserUrlFragment() => '';
void clearBrowserUrlFragment() {}

String? webLocalStorageGet(String key) => null;
void webLocalStorageSet(String key, String value) {}
void webLocalStorageRemove(String key) {}

Future<void> openExternalUrl(String url) async {}

Future<PickedImageFile?> pickImageFromDevice({
  int maxWidth = 900,
  double quality = 0.82,
  bool fromCamera = false,
}) async {
  return null;
}
