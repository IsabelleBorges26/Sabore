import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'oauth_helper.dart';

/// Serviço de persistência local multiplataforma compatível com as chaves
/// do Saboré Web (`sabore_token`, `sabore_user`, `sabore_ai_difficulty`, etc.).
/// Persiste em `window.localStorage` no Flutter Web e em arquivo JSON no Desktop/Mobile.
class StorageService {
  StorageService._();
  static final StorageService instance = StorageService._();

  final Map<String, dynamic> _memory = {};
  File? _storageFile;
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    if (kIsWeb) return;
    try {
      final dir = await getApplicationDocumentsDirectory();
      _storageFile = File('${dir.path}/sabore_mobile_storage.json');
      if (await _storageFile!.exists()) {
        final content = await _storageFile!.readAsString();
        if (content.trim().isNotEmpty) {
          final decoded = jsonDecode(content);
          if (decoded is Map<String, dynamic>) {
            _memory.addAll(decoded);
          }
        }
      }
    } catch (_) {
      // Fallback em memória caso o diretório não esteja disponível (ex: flutter test)
    }
  }

  Future<void> _flush() async {
    if (kIsWeb || _storageFile == null) return;
    try {
      await _storageFile!.writeAsString(jsonEncode(_memory));
    } catch (_) {}
  }

  String? getString(String key) {
    if (kIsWeb) {
      final webVal = webLocalStorageGet(key);
      if (webVal != null) {
        _memory[key] = webVal;
        return webVal;
      }
    }
    final v = _memory[key];
    return v?.toString();
  }

  Future<void> setString(String key, String value) async {
    _memory[key] = value;
    if (kIsWeb) {
      webLocalStorageSet(key, value);
      return;
    }
    await _flush();
  }

  bool getBool(String key, {bool defaultValue = false}) {
    if (kIsWeb) {
      final webVal = webLocalStorageGet(key);
      if (webVal != null) {
        return webVal.toLowerCase() == 'true';
      }
    }
    final v = _memory[key];
    if (v is bool) return v;
    if (v is String) return v.toLowerCase() == 'true';
    return defaultValue;
  }

  Future<void> setBool(String key, bool value) async {
    _memory[key] = value;
    if (kIsWeb) {
      webLocalStorageSet(key, value.toString());
      return;
    }
    await _flush();
  }

  List<String> getStringList(String key) {
    if (kIsWeb) {
      final webVal = webLocalStorageGet(key);
      if (webVal != null && webVal.isNotEmpty) {
        try {
          final d = jsonDecode(webVal);
          if (d is List) return d.map((e) => e.toString()).toList();
        } catch (_) {}
      }
    }
    final v = _memory[key];
    if (v is List) return v.map((e) => e.toString()).toList();
    return [];
  }

  Future<void> setStringList(String key, List<String> value) async {
    _memory[key] = value;
    if (kIsWeb) {
      webLocalStorageSet(key, jsonEncode(value));
      return;
    }
    await _flush();
  }

  Map<String, dynamic>? getJsonMap(String key) {
    if (kIsWeb) {
      final webVal = webLocalStorageGet(key);
      if (webVal != null && webVal.isNotEmpty) {
        try {
          final d = jsonDecode(webVal);
          if (d is Map<String, dynamic>) return d;
        } catch (_) {}
      }
    }
    final v = _memory[key];
    if (v is Map<String, dynamic>) return v;
    if (v is String && v.isNotEmpty) {
      try {
        final d = jsonDecode(v);
        if (d is Map<String, dynamic>) return d;
      } catch (_) {}
    }
    return null;
  }

  Future<void> setJsonMap(String key, Map<String, dynamic> value) async {
    _memory[key] = value;
    if (kIsWeb) {
      webLocalStorageSet(key, jsonEncode(value));
      return;
    }
    await _flush();
  }

  List<Map<String, dynamic>> getJsonList(String key) {
    if (kIsWeb) {
      final webVal = webLocalStorageGet(key);
      if (webVal != null && webVal.isNotEmpty) {
        try {
          final d = jsonDecode(webVal);
          if (d is List) return d.whereType<Map<String, dynamic>>().toList();
        } catch (_) {}
      }
    }
    final v = _memory[key];
    if (v is List) {
      return v.whereType<Map<String, dynamic>>().toList();
    }
    if (v is String && v.isNotEmpty) {
      try {
        final d = jsonDecode(v);
        if (d is List) return d.whereType<Map<String, dynamic>>().toList();
      } catch (_) {}
    }
    return [];
  }

  Future<void> setJsonList(String key, List<Map<String, dynamic>> value) async {
    _memory[key] = value;
    if (kIsWeb) {
      webLocalStorageSet(key, jsonEncode(value));
      return;
    }
    await _flush();
  }

  Future<void> remove(String key) async {
    _memory.remove(key);
    if (kIsWeb) {
      webLocalStorageRemove(key);
      return;
    }
    await _flush();
  }

  Future<void> clearLocalPreferences() async {
    final token = getString('sabore_token');
    final user = getJsonMap('sabore_user');
    final baseUrl = getString('sabore_api_base_url');
    _memory.clear();
    if (token != null) await setString('sabore_token', token);
    if (user != null) await setJsonMap('sabore_user', user);
    if (baseUrl != null) await setString('sabore_api_base_url', baseUrl);
    await _flush();
  }
}
