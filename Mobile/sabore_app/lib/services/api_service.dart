import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/sabore_models.dart';
import 'oauth_helper.dart';
import 'storage_service.dart';

/// Serviço central de integração real com o Supabase Auth (E-mail/Senha + Google/Facebook OAuth)
/// e a API Saboré (Node.js + Prisma + PostgreSQL)
class ApiService extends ChangeNotifier {
  ApiService._();
  static final ApiService instance = ApiService._();

  // Captura fragmento OAuth (#access_token=...) antes do roteador do Flutter Web limpá-lo
  static String initialOAuthFragment = '';

  // Configuração oficial do Supabase do projeto Saboré (extraída de Front-End/assets/js/supabase-config.js)
  static const String supabaseUrl = 'https://dzumxhfglusinxtyflwb.supabase.co';
  static const String supabaseAnonKey =
      'sb_publishable_qKiOJEMNUGFZE-1UDmUXcg_WpxoyP5_';

  // Pode ser definido no build mobile com --dart-define=SABORE_API_URL=https://api.seudominio.com.
  static const String _configuredApiUrl =
      String.fromEnvironment('SABORE_API_URL');

  // Na web publicada, usa a mesma origem da aplicação, como o Front-End web.
  // Em desenvolvimento e em emuladores, usa o backend local na porta 3000.
  static String get defaultLocalUrl {
    final configured = _configuredApiUrl.trim().replaceAll(RegExp(r'/+$'), '');
    if (configured.isNotEmpty) return configured;

    if (kIsWeb) {
      final uri = Uri.base;
      if (uri.scheme == 'http' || uri.scheme == 'https') {
        final isLocal = uri.host == 'localhost' ||
            uri.host == '127.0.0.1' ||
            uri.host.startsWith('192.168.') ||
            uri.host.startsWith('10.');
        if (isLocal) return '${uri.scheme}://${uri.host}:3000';
        return uri.origin;
      }
      return 'http://localhost:3000';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  String _baseUrl = defaultLocalUrl;
  String get baseUrl => _baseUrl;

  String? _token;
  String? get token => _token;
  bool get isAuthenticated =>
      _token != null && _token!.isNotEmpty && _currentUser != null;

  AppUser? _currentUser;
  AppUser? get currentUser => _currentUser;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  DateTime _lastActivityAt = DateTime.now();
  Timer? _sessionMonitorTimer;

  // Dados sincronizados em tempo real com o Back-End
  List<RecipeBook> books = [];
  List<Recipe> myRecipes = [];
  List<Recipe> publicRecipes = [];
  List<Recipe> favoriteRecipes = [];
  Set<int> favoriteRecipeIds = {};
  List<FridgeIngredient> fridgeIngredients = [];
  List<String> trendingHashtags = [];
  Map<String, int> trendingHashtagCounts = {};
  WeeklyChallenge? activeWeeklyChallenge;
  List<WeeklyChallenge> weeklyChallengeHistory = [];
  List<SpecialEvent> specialEvents = [];
  List<ChefProfile> featuredChefs = [];
  Set<int> followingChefIds = {};
  List<RankingEntry> rankingList = [];
  Map<String, dynamic> rankingPeriodo = {
    'mesReferencia': '',
    'diasRestantes': 0,
    'horasRestantes': 0,
    'totalParticipantes': 0,
  };
  List<EngagementActivity> myActivities = [];
  IaConsumption iaConsumption = const IaConsumption();
  List<AppNotification> notifications = [];
  List<Map<String, dynamic>> conquistas = [];
  List<Map<String, dynamic>> moldurasDisponiveis = [];
  Map<String, dynamic> publicStats = {
    'receitas': null,
    'usuarios': null,
    'totalAvaliacoes': null,
    'avaliacaoMedia': null,
    'totalReceitas': null,
    'totalUsuarios': null,
    'mediaSatisfacao': null,
  };
  bool publicStatsLoaded = false;

  int _activeTabIndex = 0;
  int get activeTabIndex => _activeTabIndex;
  void setActiveTab(int index) {
    _activeTabIndex = index;
    registerUserActivity();
    notifyListeners();
  }

  void registerUserActivity() {
    _lastActivityAt = DateTime.now();
  }

  void _startSessionMonitor() {
    _sessionMonitorTimer?.cancel();
    _sessionMonitorTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (!isAuthenticated) return;
      final diff = DateTime.now().difference(_lastActivityAt);
      // Mesmo limite de inatividade da versão Web (SESSION_IDLE_MS = 10 * 60 * 1000 em api.js)
      if (diff.inMinutes >= 10) {
        logout();
      }
    });
  }

  /// Inicializa armazenamento local, processa retorno OAuth (Google/Facebook) se houver,
  /// e restaura a sessão do usuário.
  Future<void> initialize() async {
    await StorageService.instance.init();
    _startSessionMonitor();

    final savedUrl = StorageService.instance.getString('sabore_api_base_url');
    final savedIsOldLocalDefault = savedUrl == 'http://localhost:3000' ||
        savedUrl == 'http://10.0.2.2:3000';
    final shouldUseCurrentDefault = savedUrl == null ||
        savedUrl.isEmpty ||
        savedUrl.contains('sabore-inky.vercel.app') ||
        (savedIsOldLocalDefault && savedUrl != defaultLocalUrl);
    if (shouldUseCurrentDefault) {
      _baseUrl = defaultLocalUrl;
      await StorageService.instance.setString('sabore_api_base_url', _baseUrl);
    } else {
      _baseUrl = savedUrl;
    }

    // 1) Verifica se voltamos de um login OAuth (Google / Facebook) via URL fragment (#access_token=...)
    final fragment = initialOAuthFragment.isNotEmpty
        ? initialOAuthFragment
        : getBrowserUrlFragment();
    if (fragment.contains('access_token=')) {
      final cleanFrag = fragment.startsWith('#') || fragment.startsWith('?')
          ? fragment.substring(1)
          : fragment;
      final params = Uri.splitQueryString(cleanFrag);
      final oauthToken = params['access_token'];
      if (oauthToken != null && oauthToken.isNotEmpty) {
        clearBrowserUrlFragment();
        initialOAuthFragment = '';
        await completeOAuthWithAccessToken(oauthToken);
        notifyListeners();
        return;
      }
    }

    // 2) Restaura sessão salva localmente
    _token = StorageService.instance.getString('sabore_token');
    final savedUser = StorageService.instance.getJsonMap('sabore_user');
    if (savedUser != null) {
      _currentUser = AppUser.fromJson(savedUser);
    }

    await fetchPublicStats();

    if (_token != null && _token!.isNotEmpty) {
      final ok = await fetchUserProfile();
      if (ok) {
        await refreshAllDashboardData();
      } else {
        _token = null;
        _currentUser = null;
        await StorageService.instance.remove('sabore_token');
        await StorageService.instance.remove('sabore_user');
      }
    }
    notifyListeners();
  }

  Future<bool> checkApiConnection() async {
    try {
      final response = await _request(
        'GET',
        '/estatisticas/publicas',
        auth: false,
        timeout: const Duration(seconds: 8),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    }
  }

  Future<void> setBaseUrl(String newUrl) async {
    final cleaned = newUrl.trim().replaceAll(RegExp(r'/+$'), '');
    if (cleaned.isEmpty) return;
    _baseUrl = cleaned;
    await StorageService.instance.setString('sabore_api_base_url', _baseUrl);
    notifyListeners();
  }

  Map<String, String> _headers({bool auth = true}) {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth && _token != null && _token!.isNotEmpty) {
      map['Authorization'] = 'Bearer $_token';
    }
    return map;
  }

  Future<http.Response> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    registerUserActivity();
    final url = path.startsWith('http') ? path : '$_baseUrl$path';
    final uri = Uri.parse(url);
    final headers = _headers(auth: auth);
    final encodedBody = body != null ? jsonEncode(body) : null;

    switch (method.toUpperCase()) {
      case 'POST':
        return await http
            .post(uri, headers: headers, body: encodedBody)
            .timeout(timeout);
      case 'PUT':
        return await http
            .put(uri, headers: headers, body: encodedBody)
            .timeout(timeout);
      case 'DELETE':
        return await http
            .delete(uri, headers: headers, body: encodedBody)
            .timeout(timeout);
      default:
        return await http.get(uri, headers: headers).timeout(timeout);
    }
  }

  dynamic _decodeResponse(http.Response res) {
    if (res.body.isEmpty) return {};
    try {
      return jsonDecode(utf8.decode(res.bodyBytes));
    } catch (_) {
      try {
        return jsonDecode(res.body);
      } catch (_) {
        return {'mensagem': res.body};
      }
    }
  }

  // ===========================================================================
  // 1. AUTENTICAÇÃO REAL (SUPABASE AUTH: E-MAIL/SENHA + GOOGLE / FACEBOOK OAUTH)
  // ===========================================================================

  /// Finaliza autenticação a partir de um `access_token` do Supabase (E-mail ou Google/Facebook OAuth)
  Future<bool> completeOAuthWithAccessToken(String accessToken) async {
    _token = accessToken;
    await StorageService.instance.setString('sabore_token', _token!);

    // Sincroniza com o Back-End Saboré (/usuarios/perfil) que cria o usuário e os 5 livros padrão automaticamente via authMiddleware
    final loadedFromBackend = await fetchUserProfile();
    if (!loadedFromBackend) {
      // Sem perfil confirmado pela API, não inicia uma sessão com usuário fictício.
      // Isso evita gravar dados no perfil errado quando o app não alcança o backend.
      _token = null;
      _currentUser = null;
      await StorageService.instance.remove('sabore_token');
      await StorageService.instance.remove('sabore_user');
      notifyListeners();
      return false;
    }

    await refreshAllDashboardData();
    notifyListeners();
    return true;
  }

  /// Login com Google ou Facebook via Supabase OAuth (igual ao `signInWithOAuth` do site!)
  Future<({bool ok, String message})> loginWithSocialProvider(
      String provider) async {
    _isLoading = true;
    notifyListeners();
    try {
      final token = await launchOAuthFlow(supabaseUrl, provider);
      if (kIsWeb) {
        return (
          ok: true,
          message:
              'Redirecionando para o login com ${provider.toUpperCase()}...'
        );
      }
      if (token != null && token.isNotEmpty) {
        final profileLoaded = await completeOAuthWithAccessToken(token);
        _isLoading = false;
        notifyListeners();
        if (!profileLoaded) {
          return (
            ok: false,
            message:
                'Login recebido, mas não foi possível conectar ao banco do Saboré. Confira o servidor da API nas Configurações.'
          );
        }
        return (
          ok: true,
          message: 'Login com ${provider.toUpperCase()} realizado com sucesso!'
        );
      }
      _isLoading = false;
      notifyListeners();
      return (
        ok: false,
        message:
            'O login com ${provider.toUpperCase()} foi cancelado ou não concluído.'
      );
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return (
        ok: false,
        message: 'Não foi possível iniciar o login social: $e'
      );
    }
  }

  Future<({bool ok, String message})> login(
      String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final supaUri =
          Uri.parse('$supabaseUrl/auth/v1/token?grant_type=password');
      final supaRes = await http
          .post(
            supaUri,
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'email': email.trim(),
              'password': password,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final supaData = _decodeResponse(supaRes);

      if (supaRes.statusCode >= 200 &&
          supaRes.statusCode < 300 &&
          supaData is Map &&
          supaData['access_token'] != null) {
        final profileLoaded = await completeOAuthWithAccessToken(
          supaData['access_token'].toString(),
        );

        _isLoading = false;
        if (!profileLoaded) {
          notifyListeners();
          return (
            ok: false,
            message:
                'Login recebido, mas não foi possível conectar ao banco do Saboré. Confira o servidor da API nas Configurações.'
          );
        }
        notifyListeners();
        return (
          ok: true,
          message: 'Bem-vindo de volta, ${_currentUser?.nome ?? 'Chef'}!'
        );
      }

      final errMsg = (supaData is Map
              ? (supaData['error_description'] ??
                  supaData['msg'] ??
                  supaData['message'])
              : null)
          ?.toString();
      _isLoading = false;
      notifyListeners();
      return (
        ok: false,
        message: _translateAuthError(errMsg ?? 'E-mail ou senha incorretos.')
      );
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return (
        ok: false,
        message:
            'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão.'
      );
    }
  }

  Future<({bool ok, String message})> register({
    required String nome,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final supaUri = Uri.parse('$supabaseUrl/auth/v1/signup');
      final supaRes = await http
          .post(
            supaUri,
            headers: {
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'email': email.trim(),
              'password': password,
              'data': {'nome': nome.trim(), 'full_name': nome.trim()},
            }),
          )
          .timeout(const Duration(seconds: 15));

      final supaData = _decodeResponse(supaRes);
      if (supaRes.statusCode >= 400) {
        final rawErr = (supaData is Map
                ? (supaData['msg'] ??
                    supaData['error_description'] ??
                    supaData['message'])
                : 'Não foi possível criar sua conta.')
            .toString();
        _isLoading = false;
        notifyListeners();
        return (ok: false, message: _translateAuthError(rawErr));
      }

      if (supaData is Map && supaData['access_token'] != null) {
        final profileLoaded = await completeOAuthWithAccessToken(
          supaData['access_token'].toString(),
        );
        _isLoading = false;
        if (!profileLoaded) {
          notifyListeners();
          return (
            ok: false,
            message:
                'Conta criada, mas não foi possível conectar ao banco do Saboré. Confira o servidor da API nas Configurações.'
          );
        }
        notifyListeners();
        return (
          ok: true,
          message: 'Conta criada com sucesso! Bem-vindo ao Saboré!'
        );
      }

      _isLoading = false;
      notifyListeners();
      return (
        ok: true,
        message:
            'Conta criada! Verifique seu e-mail para confirmar o cadastro ou entre com sua conta Google.'
      );
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return (ok: false, message: 'Erro ao criar conta: $e');
    }
  }

  Future<({bool ok, String message})> resetPassword(String email) async {
    try {
      final uri = Uri.parse('$supabaseUrl/auth/v1/recover');
      final res = await http.post(
        uri,
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'email': email.trim()}),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return (
          ok: true,
          message:
              'Enviamos um link de recuperação de senha para ${email.trim()}!'
        );
      }
      final data = _decodeResponse(res);
      final msg = data is Map
          ? (data['msg'] ?? data['message'] ?? 'Erro ao solicitar recuperação.')
          : 'Erro ao solicitar recuperação.';
      return (ok: false, message: _translateAuthError(msg.toString()));
    } catch (e) {
      return (ok: false, message: 'Falha ao enviar e-mail de recuperação: $e');
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    books = [];
    myRecipes = [];
    favoriteRecipes = [];
    favoriteRecipeIds = {};
    fridgeIngredients = [];
    notifications = [];
    followingChefIds = {};
    _activeTabIndex = 0;
    await StorageService.instance.remove('sabore_token');
    await StorageService.instance.remove('sabore_user');
    notifyListeners();
  }

  String _translateAuthError(String msg) {
    final lower = msg.toLowerCase();
    if (lower.contains('invalid login credentials')) {
      return 'E-mail ou senha incorretos. Se você criou sua conta pelo Google no site, clique no botão "Continuar com Google" abaixo!';
    }
    if (lower.contains('email not confirmed')) {
      return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou entre com o Google.';
    }
    if (lower.contains('user already registered') ||
        lower.contains('already exists')) {
      return 'Este e-mail já está cadastrado no Saboré. Faça login ou use o botão Google.';
    }
    if (lower.contains('password should be at least')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    return msg;
  }

  // ===========================================================================
  // 2. CARREGAMENTO COMPLETO DO PERFIL E DASHBOARD
  // ===========================================================================

  Future<bool> fetchUserProfile() async {
    if (_token == null || _token!.isEmpty) return false;
    try {
      final res = await _request('GET', '/usuarios/perfil');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          final userMap = data['usuario'] is Map<String, dynamic>
              ? data['usuario'] as Map<String, dynamic>
              : data;
          final parsed = AppUser.fromJson(userMap);
          final savedBio =
              StorageService.instance.getString('sabore_bio_${parsed.email}') ??
                  parsed.bio;
          final savedPrefs = StorageService.instance
              .getStringList('sabore_prefs_${parsed.email}');
          _currentUser = parsed.copyWith(
            bio: savedBio,
            preferencias:
                savedPrefs.isNotEmpty ? savedPrefs : parsed.preferencias,
          );
          await StorageService.instance
              .setJsonMap('sabore_user', _currentUser!.toJson());
          notifyListeners();
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  Future<void> refreshAllDashboardData() async {
    await Future.wait([
      fetchBooks(),
      fetchMyRecipes(),
      fetchPublicRecipes(),
      fetchFavorites(),
      fetchFridgeIngredients(),
      fetchIaConsumption(),
      fetchWeeklyChallenge(),
      fetchSpecialEvents(),
      fetchFeaturedChefs(),
      fetchRankingPro(),
      fetchNotifications(),
      fetchAchievementsAndFrames(),
      fetchTrendingHashtags(),
    ]);
    notifyListeners();
  }

  Future<void> fetchPublicStats() async {
    try {
      final res = await _request('GET', '/estatisticas/publicas', auth: false);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          publicStats = {
            ...data,
            'totalReceitas': data['receitas'] ?? data['totalReceitas'],
            'totalUsuarios': data['usuarios'] ?? data['totalUsuarios'],
            'mediaSatisfacao':
                data['avaliacaoMedia'] ?? data['mediaSatisfacao'],
            'totalAvaliacoes': data['totalAvaliacoes'],
          };
          publicStatsLoaded = true;
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<({bool ok, String message})> sendContactMessage({
    required String nome,
    required String email,
    required String assunto,
    required String mensagem,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/contato',
        body: {
          'nome': nome.trim(),
          'email': email.trim(),
          'assunto': assunto.trim(),
          'mensagem': mensagem.trim(),
        },
        auth: false,
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Mensagem enviada com sucesso! Nossa equipe responderá em breve.'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível enviar a mensagem.'
      );
    } catch (e) {
      return (ok: false, message: 'Não foi possível conectar ao servidor: $e');
    }
  }

  // ===========================================================================
  // 3. LIVROS DE RECEITAS (/livros) E RECEITAS (/receitas)
  // ===========================================================================

  Future<void> fetchBooks() async {
    try {
      final res = await _request('GET', '/livros/listar');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['livros'] ?? data['dados'] ?? []) : []);
        if (list is List) {
          books = list
              .whereType<Map<String, dynamic>>()
              .map((e) => RecipeBook.fromJson(e))
              .toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<List<Recipe>> fetchBookRecipes(int bookId) async {
    try {
      final res = await _request('GET', '/receitas/listar?livroId=$bookId');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((e) => Recipe.fromJson(e))
              .toList();
        }
      }
    } catch (_) {}
    return myRecipes.where((r) => r.livroId == bookId).toList();
  }

  Future<({bool ok, String message, RecipeBook? book})> createBook({
    required String nome,
    required String icone,
    String tag = 'Coleção',
  }) async {
    try {
      final res = await _request(
        'POST',
        '/livros/cadastrar',
        body: {
          'titulo': nome.trim(),
          'nome': nome.trim(),
          'emoji': icone,
          'icone': icone,
          'tag': tag.trim().isEmpty ? 'Coleção' : tag.trim(),
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([fetchBooks(), fetchUserProfile()]);
        RecipeBook? created;
        if (data is Map<String, dynamic>) {
          final bMap = data['livro'] is Map<String, dynamic>
              ? data['livro'] as Map<String, dynamic>
              : data;
          created = RecipeBook.fromJson(bMap);
        }
        return (
          ok: true,
          message: 'Livro "$nome" criado com sucesso!',
          book: created
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (ok: false, message: errMsg ?? 'Erro ao criar livro.', book: null);
    } catch (e) {
      return (
        ok: false,
        message: 'Erro ao conectar com o servidor: $e',
        book: null
      );
    }
  }

  Future<({bool ok, String message})> deleteBook(int bookId) async {
    try {
      final res = await _request('DELETE', '/livros/excluir/$bookId');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([fetchBooks(), fetchMyRecipes(), fetchUserProfile()]);
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Livro excluído com sucesso.'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível excluir o livro.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao excluir livro: $e');
    }
  }

  Future<void> fetchMyRecipes() async {
    try {
      final res = await _request('GET', '/receitas/listar');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['receitas'] ?? data['dados'] ?? []) : []);
        if (list is List) {
          myRecipes = list
              .whereType<Map<String, dynamic>>()
              .map((e) => Recipe.fromJson(e))
              .toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<void> fetchPublicRecipes({String? search, String? categoria}) async {
    try {
      final res = await _request('GET', '/receitas/publicas');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['receitas'] ?? data['dados'] ?? []) : []);
        if (list is List) {
          publicRecipes = list
              .whereType<Map<String, dynamic>>()
              .map((e) => Recipe.fromJson(e))
              .toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<Recipe?> fetchPublicRecipeById(int recipeId) async {
    try {
      final res =
          await _request('GET', '/receitas/publicas/$recipeId', auth: false);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          return Recipe.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<void> fetchTrendingHashtags() async {
    try {
      final res = await _request('GET', '/receitas/hashtags-em-alta');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list =
            data is List ? data : (data is Map ? (data['hashtags'] ?? []) : []);
        if (list is List && list.isNotEmpty) {
          final tags = <String>[];
          final counts = <String, int>{};
          for (final e in list) {
            if (e is Map) {
              final rawTag = (e['tag'] ?? e['hashtag'] ?? '').toString().trim();
              if (rawTag.isNotEmpty) {
                final tag = rawTag.startsWith('#') ? rawTag : '#$rawTag';
                tags.add(tag);
                counts[tag] = int.tryParse((e['count'] ?? 1).toString()) ?? 1;
              }
            } else {
              final rawTag = e.toString().trim();
              if (rawTag.isNotEmpty) {
                final tag = rawTag.startsWith('#') ? rawTag : '#$rawTag';
                tags.add(tag);
              }
            }
          }
          if (tags.isNotEmpty) {
            trendingHashtags = tags;
            trendingHashtagCounts = counts;
            notifyListeners();
          }
        }
      }
    } catch (_) {}
  }

  Future<({bool ok, String message, Recipe? recipe})> createRecipe({
    required String titulo,
    required String descricao,
    required String modoPreparo,
    required int tempoPreparo,
    required int porcoes,
    required String dificuldade,
    required List<Map<String, dynamic>> ingredientes,
    int? livroId,
    bool publica = false,
    bool criadaPorIA = false,
    String? imagemBase64,
  }) async {
    try {
      int? targetBookId = livroId;
      if (targetBookId == null) {
        if (books.isEmpty) await fetchBooks();
        if (books.isNotEmpty) {
          targetBookId = books.first.id;
        }
      }

      if (targetBookId == null) {
        return (
          ok: false,
          message: 'Crie ou selecione um livro de receitas antes de salvar.',
          recipe: null
        );
      }

      // O Back-End (receitas.controllers.js) aceita ingredientes como Array<String> ou Array<{nome}>
      final ingStrings = ingredientes
          .map((i) {
            final nome = (i['nome'] ?? '').toString().trim();
            final qtd = (i['quantidade'] ?? '').toString().trim();
            final un = (i['unidadeMedida'] ?? '').toString().trim();
            if (qtd.isEmpty || (qtd == '1' && un == 'unidade')) return nome;
            if (un.isEmpty || un == 'unidade') return '$qtd $nome'.trim();
            return '$qtd $un de $nome'.trim();
          })
          .where((s) => s.isNotEmpty)
          .toList();

      final payload = <String, dynamic>{
        'titulo': titulo.trim(),
        'descricao': descricao.trim(),
        'modoPreparo': modoPreparo.trim(),
        'tempoPreparo': '$tempoPreparo min',
        'porcoes': porcoes,
        'dificuldade': dificuldade,
        'publica': publica,
        'criadaPorIA': criadaPorIA,
        'ingredientes': ingStrings,
        'livroId': targetBookId,
        if (imagemBase64 != null && imagemBase64.isNotEmpty)
          'imagem': imagemBase64,
      };

      final res = await _request('POST', '/receitas/cadastrar', body: payload);
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Recipe? rec;
        bool concluiuDesafio = false;
        if (data is Map<String, dynamic>) {
          final rMap = data['receita'] is Map<String, dynamic>
              ? data['receita'] as Map<String, dynamic>
              : data;
          rec = Recipe.fromJson(rMap);
          if (data['desafioInfo'] is Map &&
              data['desafioInfo']['concluiuDesafio'] == true) {
            concluiuDesafio = true;
          }
        }
        await Future.wait([
          fetchBooks(),
          fetchMyRecipes(),
          fetchUserProfile(),
          if (publica) fetchPublicRecipes(),
          if (publica) fetchTrendingHashtags(),
          if (concluiuDesafio) fetchWeeklyChallenge(),
        ]);

        String msg = publica
            ? 'Receita publicada na Comunidade (+10 pts no Ranking PRO)!'
            : 'Receita salva no seu livro com sucesso!';
        if (concluiuDesafio) {
          msg =
              'Receita publicada e Desafio da Semana concluído (+40 pts no Ranking PRO)! 🏆';
        }
        return (ok: true, message: msg, recipe: rec);
      }

      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível salvar a receita.',
        recipe: null
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao salvar receita: $e', recipe: null);
    }
  }

  Future<({bool ok, String message})> toggleRecipePublic(Recipe recipe) async {
    final newPublicState = !recipe.publica;
    try {
      final res = await _request(
        'PUT',
        '/receitas/atualizar/${recipe.id}',
        body: {
          'publica': newPublicState,
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([
          fetchMyRecipes(),
          fetchPublicRecipes(),
          fetchBooks(),
          fetchUserProfile(),
        ]);
        final concluiu = data is Map &&
            data['desafioInfo'] is Map &&
            data['desafioInfo']['concluiuDesafio'] == true;
        return (
          ok: true,
          message: concluiu
              ? 'Receita publicada e Desafio da Semana concluído (+30 pts)! 🏆'
              : (newPublicState
                  ? 'Receita publicada na Comunidade Saboré (+10 pts)!'
                  : 'Receita alterada para privada.')
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Erro ao atualizar visibilidade da receita.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao atualizar receita: $e');
    }
  }

  Future<({bool ok, String message})> deleteRecipe(int recipeId) async {
    try {
      final res = await _request('DELETE', '/receitas/excluir/$recipeId');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        myRecipes.removeWhere((r) => r.id == recipeId);
        publicRecipes.removeWhere((r) => r.id == recipeId);
        favoriteRecipes.removeWhere((r) => r.id == recipeId);
        favoriteRecipeIds.remove(recipeId);
        await Future.wait([fetchBooks(), fetchUserProfile()]);
        notifyListeners();
        return (ok: true, message: 'Receita excluída com sucesso.');
      }
      final data = _decodeResponse(res);
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao excluir receita.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao excluir receita: $e');
    }
  }

  // ===========================================================================
  // 4. FAVORITOS (/favoritos), AVALIAÇÕES (/avaliacoes), COMENTÁRIOS (/comentarios) E COMPARTILHAMENTO
  // ===========================================================================

  Future<void> fetchFavorites() async {
    try {
      final res = await _request('GET', '/favoritos/listar');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map
                ? (data['favoritos'] ?? data['receitas'] ?? [])
                : []);
        if (list is List) {
          final parsed = <Recipe>[];
          final ids = <int>{};
          for (final item in list) {
            if (item is Map<String, dynamic>) {
              final recMap = item['receita'] is Map<String, dynamic>
                  ? item['receita'] as Map<String, dynamic>
                  : item;
              final r = Recipe.fromJson(recMap);
              if (r.id > 0) {
                parsed.add(r);
                ids.add(r.id);
              }
            }
          }
          favoriteRecipes = parsed;
          favoriteRecipeIds = ids;
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  bool isFavorite(int recipeId) => favoriteRecipeIds.contains(recipeId);

  Future<({bool ok, bool favorited, String message})> toggleFavorite(
      Recipe recipe) async {
    final currentlyFav = favoriteRecipeIds.contains(recipe.id);
    if (currentlyFav) {
      favoriteRecipeIds.remove(recipe.id);
      favoriteRecipes.removeWhere((r) => r.id == recipe.id);
      notifyListeners();
      try {
        final res = await _request('DELETE', '/favoritos/excluir/${recipe.id}');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          favoriteRecipeIds.add(recipe.id);
          favoriteRecipes.insert(0, recipe);
          notifyListeners();
          return (
            ok: false,
            favorited: true,
            message: 'Não foi possível remover a favorita.'
          );
        }
        await Future.wait([fetchPublicRecipes(), fetchUserProfile()]);
      } catch (_) {
        favoriteRecipeIds.add(recipe.id);
        if (!favoriteRecipes.any((r) => r.id == recipe.id)) {
          favoriteRecipes.insert(0, recipe);
        }
        notifyListeners();
        return (
          ok: false,
          favorited: true,
          message: 'Falha de conexão ao remover a favorita.'
        );
      }
      return (
        ok: true,
        favorited: false,
        message: 'Removida das suas Favoritas.'
      );
    } else {
      favoriteRecipeIds.add(recipe.id);
      if (!favoriteRecipes.any((r) => r.id == recipe.id)) {
        favoriteRecipes.insert(0, recipe);
      }
      notifyListeners();
      try {
        final res = await _request('POST', '/favoritos/cadastrar',
            body: {'receitaId': recipe.id});
        if (res.statusCode < 200 || res.statusCode >= 300) {
          favoriteRecipeIds.remove(recipe.id);
          favoriteRecipes.removeWhere((r) => r.id == recipe.id);
          notifyListeners();
          return (
            ok: false,
            favorited: false,
            message: 'Não foi possível salvar a favorita.'
          );
        }
        await Future.wait(
            [fetchFavorites(), fetchPublicRecipes(), fetchUserProfile()]);
      } catch (_) {
        favoriteRecipeIds.remove(recipe.id);
        favoriteRecipes.removeWhere((r) => r.id == recipe.id);
        notifyListeners();
        return (
          ok: false,
          favorited: false,
          message: 'Falha de conexão ao salvar a favorita.'
        );
      }
      return (
        ok: true,
        favorited: true,
        message: 'Adicionada às suas Favoritas ❤️'
      );
    }
  }

  Future<({double media, int total, int? minhaNota})> fetchRecipeRatings(
      int recipeId) async {
    try {
      final res =
          await _request('GET', '/avaliacoes/listar?receitaId=$recipeId');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          return (
            media: double.tryParse((data['media'] ?? 0).toString()) ?? 0.0,
            total: int.tryParse((data['total'] ?? 0).toString()) ?? 0,
            minhaNota: data['minhaNota'] != null
                ? int.tryParse(data['minhaNota'].toString())
                : null,
          );
        }
      }
    } catch (_) {}
    return (media: 0.0, total: 0, minhaNota: null);
  }

  Future<({bool ok, String message, double? novaMedia, int? novoTotal})>
      rateRecipe(
    int recipeId,
    int nota,
  ) async {
    try {
      final res = await _request(
        'POST',
        '/avaliacoes/cadastrar',
        body: {'receitaId': recipeId, 'nota': nota},
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait(
            [fetchPublicRecipes(), fetchMyRecipes(), fetchRankingPro()]);
        final media = data is Map && data['media'] != null
            ? double.tryParse(data['media'].toString())
            : null;
        final total = data is Map && data['total'] != null
            ? int.tryParse(data['total'].toString())
            : null;
        return (
          ok: true,
          message: 'Avaliação de $nota estrelas registrada (+2 pts)! ⭐',
          novaMedia: media,
          novoTotal: total,
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível registrar avaliação.',
        novaMedia: null,
        novoTotal: null
      );
    } catch (e) {
      return (
        ok: false,
        message: 'Erro ao avaliar receita: $e',
        novaMedia: null,
        novoTotal: null
      );
    }
  }

  Future<({bool ok, String message})> deleteRecipeRating(int recipeId) async {
    try {
      final res = await _request('DELETE', '/avaliacoes/excluir/$recipeId');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([fetchPublicRecipes(), fetchMyRecipes()]);
        return (ok: true, message: 'Sua avaliação foi removida.');
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao remover avaliação.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao remover avaliação: $e');
    }
  }

  Future<List<RecipeComment>> fetchRecipeComments(int recipeId) async {
    try {
      final res =
          await _request('GET', '/comentarios/listar?receitaId=$recipeId');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['comentarios'] ?? data['dados'] ?? []) : []);
        if (list is List) {
          return list
              .whereType<Map<String, dynamic>>()
              .map((e) => RecipeComment.fromJson(e))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<({bool ok, String message})> addComment(
      int recipeId, String texto) async {
    try {
      final res = await _request(
        'POST',
        '/comentarios/cadastrar',
        body: {'receitaId': recipeId, 'texto': texto.trim()},
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([fetchPublicRecipes(), fetchRankingPro()]);
        return (
          ok: true,
          message: 'Comentário publicado (+3 pts no Ranking PRO)!'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível publicar o comentário.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao comentar: $e');
    }
  }

  Future<({bool ok, String message})> deleteComment(int commentId) async {
    try {
      final res = await _request('DELETE', '/comentarios/excluir/$commentId');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchPublicRecipes();
        return (ok: true, message: 'Comentário excluído com sucesso.');
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível excluir o comentário.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao excluir comentário: $e');
    }
  }

  Future<void> registerRecipeShare(int recipeId) async {
    try {
      await _request('POST', '/compartilhamento/registrar/$recipeId');
      await fetchPublicRecipes();
    } catch (_) {}
  }

  // ===========================================================================
  // 5. GELADEIRA / DESPENSA (/ingredientes-disponiveis)
  // ===========================================================================

  Future<void> fetchFridgeIngredients() async {
    try {
      final res = await _request('GET', '/ingredientes-disponiveis/listar');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map
                ? (data['ingredientes'] ?? data['dados'] ?? [])
                : []);
        if (list is List) {
          final parsed = <FridgeIngredient>[];
          for (var i = 0; i < list.length; i++) {
            final item = FridgeIngredient.fromDynamic(list[i], i + 1);
            if (item.nome.isNotEmpty) parsed.add(item);
          }
          fridgeIngredients = parsed;
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<bool> addFridgeIngredient(String nome) async {
    final cleaned = nome.trim();
    if (cleaned.isEmpty) return false;
    final alreadyExists = fridgeIngredients
        .any((i) => i.nome.toLowerCase() == cleaned.toLowerCase());
    if (!alreadyExists) {
      fridgeIngredients.add(
        FridgeIngredient(
            id: DateTime.now().millisecondsSinceEpoch, nome: cleaned),
      );
      notifyListeners();
    }
    try {
      final res = await _request(
        'POST',
        '/ingredientes-disponiveis/cadastrar',
        body: {'nome': cleaned},
      );
      if (res.statusCode < 200 || res.statusCode >= 300) {
        if (!alreadyExists) {
          fridgeIngredients.removeWhere((i) => i.nome == cleaned);
          notifyListeners();
        }
        return false;
      }
      await fetchFridgeIngredients();
      return true;
    } catch (_) {
      if (!alreadyExists) {
        fridgeIngredients.removeWhere((i) => i.nome == cleaned);
        notifyListeners();
      }
      return false;
    }
  }

  Future<bool> removeFridgeIngredient(int id, {String? nome}) async {
    final target = fridgeIngredients.where((i) => i.id == id).firstOrNull;
    final targetName = nome ?? target?.nome;
    if (targetName == null || targetName.isEmpty) return false;
    fridgeIngredients.removeWhere((i) => i.id == id || i.nome == targetName);
    notifyListeners();
    try {
      final res = await _request(
        'DELETE',
        '/ingredientes-disponiveis/excluir/${Uri.encodeComponent(targetName)}',
      );
      await fetchFridgeIngredients();
      return res.statusCode >= 200 && res.statusCode < 300;
    } catch (_) {
      await fetchFridgeIngredients();
      return false;
    }
  }

  Future<bool> clearFridgeIngredients() async {
    final copy = List<FridgeIngredient>.from(fridgeIngredients);
    fridgeIngredients = [];
    notifyListeners();
    var allRemoved = true;
    for (final item in copy) {
      try {
        final res = await _request(
          'DELETE',
          '/ingredientes-disponiveis/excluir/${Uri.encodeComponent(item.nome)}',
        );
        if (res.statusCode < 200 || res.statusCode >= 300) allRemoved = false;
      } catch (_) {
        allRemoved = false;
      }
    }
    if (!allRemoved) await fetchFridgeIngredients();
    return allRemoved;
  }

  // ===========================================================================
  // 6. CHEF IA (/ia/gerar, /ia/consumo), IA POR FOTO E IMPORTAR VÍDEO
  // ===========================================================================

  Future<void> fetchIaConsumption() async {
    try {
      final res = await _request('GET', '/ia/consumo');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          iaConsumption = IaConsumption.fromJson(data);
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<({bool ok, String replyText, Recipe? recipe, bool limitReached})>
      generateChefIaRecipe({
    required String prompt,
    String? tempoMaximo,
    String? restricao,
    String? dificuldade,
    List<String>? customIngredients,
  }) async {
    try {
      final defaultDiff =
          StorageService.instance.getString('sabore_ai_difficulty') ??
              'Qualquer';
      final defaultServings =
          StorageService.instance.getString('sabore_ai_servings') ?? '2';
      final activeDiets = <String>[];
      for (final d in [
        'Vegano',
        'Vegetariano',
        'Sem Glúten',
        'Sem Lactose',
        'Low Carb',
        'Keto'
      ]) {
        if (StorageService.instance.getBool('sabore_diet_$d')) {
          activeDiets.add(d);
        }
      }
      if (restricao != null && restricao.isNotEmpty && restricao != 'Nenhuma') {
        if (!activeDiets.contains(restricao)) activeDiets.insert(0, restricao);
      }

      int maxTimeNum = 45;
      if (tempoMaximo != null) {
        final m = RegExp(r'\d+').firstMatch(tempoMaximo);
        if (m != null) maxTimeNum = int.tryParse(m.group(0)!) ?? 45;
      }

      final ingList =
          customIngredients ?? fridgeIngredients.map((i) => i.nome).toList();

      final payload = <String, dynamic>{
        'prompt': prompt.trim(),
        'ingredients': ingList.join(', '),
        'maxTime': maxTimeNum,
        'diet': activeDiets.isEmpty ? 'Nenhuma' : activeDiets.join(', '),
        'difficulty': (dificuldade != null && dificuldade != 'Qualquer')
            ? dificuldade
            : defaultDiff,
        'servings': defaultServings,
        'userBio': _currentUser?.bio ?? '',
        'userPrefs': (_currentUser?.preferencias ?? []).join(', '),
      };

      final res = await _request(
        'POST',
        '/ia/gerar',
        body: payload,
        timeout: const Duration(seconds: 65),
      );
      final data = _decodeResponse(res);
      await fetchIaConsumption();

      if (res.statusCode == 403 || res.statusCode == 429) {
        final msg = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Você atingiu o limite mensal gratuito do Chef IA (5 gerações/mês). Conquiste o Top 5 no Ranking PRO para uso ilimitado!';
        return (ok: false, replyText: msg, recipe: null, limitReached: true);
      }

      if (res.statusCode >= 200 &&
          res.statusCode < 300 &&
          data is Map<String, dynamic>) {
        final isRecipe = data['isRecipe'] != false &&
            (data['title'] != null ||
                data['titulo'] != null ||
                data['ingredients'] != null ||
                data['steps'] != null);

        Recipe? parsedRecipe;
        if (isRecipe) {
          parsedRecipe = Recipe.fromJson({
            ...data,
            'criadaPorIA': true,
          });
        }
        final text = (data['message'] ??
                data['resposta'] ??
                data['mensagem'] ??
                parsedRecipe?.descricao ??
                'Aqui está a sugestão preparada pelo Chef IA:')
            .toString();

        return (
          ok: true,
          replyText: text,
          recipe: parsedRecipe,
          limitReached: false
        );
      }

      final errMsg = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
              ?.toString() ??
          'Não foi possível gerar a resposta do Chef IA no momento.';
      return (ok: false, replyText: errMsg, recipe: null, limitReached: false);
    } catch (e) {
      return (
        ok: false,
        replyText: 'Erro de comunicação com o Chef IA: $e',
        recipe: null,
        limitReached: false,
      );
    }
  }

  Future<
      ({
        bool ok,
        PhotoAnalysisResult? result,
        String message,
        bool limitReached
      })> analyzeDishPhoto({
    required String imagemBase64,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/ia/analisar-foto',
        body: {
          'image': imagemBase64,
        },
        timeout: const Duration(seconds: 65),
      );
      final data = _decodeResponse(res);
      await fetchIaConsumption();

      if (res.statusCode == 403 || res.statusCode == 429) {
        return (
          ok: false,
          result: null,
          message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                  ?.toString() ??
              'Seus 2 créditos gratuitos mensais do Scanner IA por Foto acabaram.',
          limitReached: true
        );
      }

      if (res.statusCode >= 200 &&
          res.statusCode < 300 &&
          data is Map<String, dynamic>) {
        return (
          ok: true,
          result: PhotoAnalysisResult.fromJson(data),
          message: 'Análise concluída com sucesso!',
          limitReached: false
        );
      }

      final errMsg = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
              ?.toString() ??
          'Não foi possível analisar a imagem enviada.';
      return (ok: false, result: null, message: errMsg, limitReached: false);
    } catch (e) {
      return (
        ok: false,
        result: null,
        message: 'Falha ao conectar com o serviço de Visão IA: $e',
        limitReached: false,
      );
    }
  }

  Future<({bool ok, Recipe? recipe, String message})>
      generateRecipeFromPhotoAnalysis(
    PhotoAnalysisResult analysis, {
    String? imagemOriginal,
  }) async {
    try {
      final defaultServings =
          StorageService.instance.getString('sabore_ai_servings') ??
              '2 porções';
      final activeDiets = <String>[];
      for (final d in [
        'Vegano',
        'Vegetariano',
        'Sem Glúten',
        'Sem Lactose',
        'Low Carb',
        'Keto'
      ]) {
        if (StorageService.instance.getBool('sabore_diet_$d')) {
          activeDiets.add(d);
        }
      }

      final res = await _request(
        'POST',
        '/ia/gerar-receita-foto',
        body: {
          'dishName': analysis.pratoIdentificado,
          'ingredientsList': analysis.ingredientes.map((e) => e.nome).toList(),
          'diet': activeDiets.isEmpty ? 'Tradicional' : activeDiets.join(', '),
          'servings': defaultServings.contains('porç')
              ? defaultServings
              : '$defaultServings porções',
        },
        timeout: const Duration(seconds: 65),
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 &&
          res.statusCode < 300 &&
          data is Map<String, dynamic>) {
        final recMap = data['receita'] is Map<String, dynamic>
            ? data['receita'] as Map<String, dynamic>
            : data;
        return (
          ok: true,
          recipe: Recipe.fromJson({
            ...recMap,
            'title': recMap['title'] ?? analysis.pratoIdentificado,
            'description': recMap['description'] ?? analysis.descricao,
            'criadaPorIA': true,
            if (imagemOriginal != null) 'image': imagemOriginal,
          }),
          message: 'Receita completa gerada com sucesso!'
        );
      }
      final errMsg = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
              ?.toString() ??
          'Não foi possível gerar a receita a partir da foto.';
      return (ok: false, recipe: null, message: errMsg);
    } catch (e) {
      return (
        ok: false,
        recipe: null,
        message: 'Erro ao gerar receita da foto: $e'
      );
    }
  }

  Future<
      ({
        bool ok,
        Recipe? recipe,
        Map<String, dynamic>? videoMeta,
        String message,
        bool limitReached
      })> importVideoRecipe(String videoUrl) async {
    try {
      final res = await _request(
        'POST',
        '/importacao/importar',
        body: {'url': videoUrl.trim()},
        timeout: const Duration(seconds: 65),
      );
      final data = _decodeResponse(res);
      await fetchIaConsumption();

      if (res.statusCode == 403 || res.statusCode == 429) {
        return (
          ok: false,
          recipe: null,
          videoMeta: null,
          message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                  ?.toString() ??
              'Seus 2 créditos gratuitos mensais de Importação de Vídeo acabaram.',
          limitReached: true
        );
      }

      if (res.statusCode >= 200 &&
          res.statusCode < 300 &&
          data is Map<String, dynamic>) {
        final recMap = data['recipe'] is Map<String, dynamic>
            ? data['recipe'] as Map<String, dynamic>
            : (data['receita'] is Map<String, dynamic>
                ? data['receita'] as Map<String, dynamic>
                : data);
        final rec = Recipe.fromJson({
          ...recMap,
          'title': data['title'] ??
              recMap['title'] ??
              'Receita Importada do YouTube',
          'description': data['description'] ?? recMap['description'] ?? '',
          'image': data['thumbnail'] ?? recMap['image'],
          'criadaPorIA': true,
        });
        final meta = <String, dynamic>{
          'titulo': data['title'] ?? rec.titulo,
          'canal': data['platformLabel'] ?? 'YouTube',
          'duracao': '${rec.tempoPreparo} min',
          'thumbnail': data['thumbnail'] ?? rec.imagem,
          'videoId': data['videoId'],
          'embedUrl': data['embedUrl'],
          'urlOriginal': videoUrl.trim(),
        };
        return (
          ok: true,
          recipe: rec,
          videoMeta: meta,
          message: 'Receita extraída do vídeo com sucesso!',
          limitReached: false
        );
      }

      final errMsg = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
              ?.toString() ??
          'Não foi possível extrair a receita deste vídeo do YouTube.';
      return (
        ok: false,
        recipe: null,
        videoMeta: null,
        message: errMsg,
        limitReached: false
      );
    } catch (e) {
      return (
        ok: false,
        recipe: null,
        videoMeta: null,
        message: 'Erro ao importar vídeo: $e',
        limitReached: false,
      );
    }
  }

  // ===========================================================================
  // 7. DESAFIO DA SEMANA E EVENTOS ESPECIAIS (/desafios)
  // ===========================================================================

  Future<void> fetchWeeklyChallenge() async {
    try {
      var res = await _request('GET', '/desafios/semanal/atual');
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res = await _request('GET', '/desafios/atual');
      }
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          final dMap = data['desafio'] is Map<String, dynamic>
              ? data['desafio'] as Map<String, dynamic>
              : data;
          activeWeeklyChallenge = WeeklyChallenge.fromJson(dMap);
          notifyListeners();
        }
      }
      final histRes = await _request('GET', '/desafios/historico');
      if (histRes.statusCode >= 200 && histRes.statusCode < 300) {
        final hData = _decodeResponse(histRes);
        final list = hData is List
            ? hData
            : (hData is Map
                ? (hData['historico'] ?? hData['desafios'] ?? [])
                : []);
        if (list is List) {
          weeklyChallengeHistory = list
              .whereType<Map<String, dynamic>>()
              .map((e) => WeeklyChallenge.fromJson(e))
              .toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<({bool ok, String message})> submitWeeklyChallenge({
    required String tituloReceita,
    required String descricao,
    required String aprendizado,
    required String imagemBase64,
    int? receitaId,
  }) async {
    try {
      final fullDesc = aprendizado.trim().isNotEmpty
          ? '${descricao.trim()}\n\nAprendizado: ${aprendizado.trim()}'
          : descricao.trim();

      final res = await _request(
        'POST',
        '/desafios/publicar',
        body: {
          if (activeWeeklyChallenge != null)
            'desafioId': activeWeeklyChallenge!.id,
          'nomeReceita': tituloReceita.trim(),
          'descricaoPreparacao': fullDesc,
          'foto': imagemBase64,
          if (receitaId != null) 'receitaId': receitaId,
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([
          fetchWeeklyChallenge(),
          fetchRankingPro(),
          fetchUserProfile(),
          fetchAchievementsAndFrames(),
        ]);
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Participação publicada com sucesso! Você ganhou +30 pontos no Ranking PRO! 🏆'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível enviar sua participação.'
      );
    } catch (e) {
      return (
        ok: false,
        message: 'Erro ao publicar participação no desafio: $e'
      );
    }
  }

  Future<void> fetchSpecialEvents() async {
    try {
      final res = await _request('GET', '/desafios/eventos');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['eventos'] ?? data['dados'] ?? []) : []);
        if (list is List) {
          final loaded = <SpecialEvent>[];
          for (final item in list.whereType<Map<String, dynamic>>()) {
            final ev = SpecialEvent.fromJson(item);
            // Carrega detalhes completos (entradas, votos, minha inscrição) de cada evento
            final detail = await fetchSpecialEventDetails(ev.id);
            loaded.add(detail ?? ev);
          }
          specialEvents = loaded;
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<SpecialEvent?> fetchSpecialEventDetails(String eventIdOrSlug) async {
    try {
      final res = await _request('GET', '/desafios/eventos/$eventIdOrSlug');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          return SpecialEvent.fromJson(data);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<({bool ok, String message})> enrollRecipeInEvent({
    required String eventId,
    required int receitaId,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/desafios/eventos/$eventId/inscrever',
        body: {'receitaId': receitaId},
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Receita inscrita na competição especial com sucesso!'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível inscrever a receita.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao inscrever receita no evento: $e');
    }
  }

  Future<({bool ok, String message})> voteInEventEntry({
    required String eventId,
    required int entradaId,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/desafios/eventos/$eventId/votar',
        body: {'entradaId': entradaId},
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Voto oficial registrado com sucesso!'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível registrar o voto.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao votar no prato: $e');
    }
  }

  Future<({bool ok, String message})> reportEventEntry({
    required String eventId,
    required int entradaId,
    required String motivo,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/desafios/eventos/$eventId/denunciar',
        body: {
          'entradaId': entradaId,
          'motivo': motivo.trim(),
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Denúncia registrada para análise da moderação.'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Não foi possível registrar a denúncia.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao enviar denúncia: $e');
    }
  }

  // ===========================================================================
  // 8. SOCIAL, CHEFS EM DESTAQUE, SEGUIDORES E NOTIFICAÇÕES (/social)
  // ===========================================================================

  Future<void> fetchFeaturedChefs({String? search}) async {
    try {
      final path = (search != null && search.trim().isNotEmpty)
          ? '/social/perfis?busca=${Uri.encodeComponent(search.trim())}'
          : '/social/perfis';
      final res = await _request('GET', path);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['perfis'] ?? data['usuarios'] ?? []) : []);
        if (list is List) {
          featuredChefs = list
              .whereType<Map<String, dynamic>>()
              .map((e) => ChefProfile.fromJson(e))
              .toList();
          followingChefIds =
              featuredChefs.where((c) => c.seguindo).map((c) => c.id).toSet();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<ChefProfile?> fetchChefProfileDetails(int userId) async {
    try {
      final results = await Future.wait([
        _request('GET', '/social/perfis/$userId'),
        _request('GET', '/usuarios/conquistas/$userId'),
      ]);
      final res = results[0];
      final conqRes = results[1];
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          final pMap = Map<String, dynamic>.from(
            data['perfil'] is Map<String, dynamic>
                ? data['perfil'] as Map<String, dynamic>
                : data,
          );
          if (conqRes.statusCode >= 200 && conqRes.statusCode < 300) {
            final cData = _decodeResponse(conqRes);
            if (cData is Map && cData['emblemas'] is List) {
              pMap['conquistas'] = cData['emblemas'];
            }
          }
          return ChefProfile.fromJson(pMap);
        }
      }
    } catch (_) {}
    return null;
  }

  Future<({bool ok, bool following, String message})> toggleFollowChef(
    int targetUserId, {
    bool? currentlyFollowing,
  }) async {
    final isCurrentlyFollowing =
        currentlyFollowing ?? followingChefIds.contains(targetUserId);
    try {
      final method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      final res = await _request(method, '/social/seguir/$targetUserId');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final newFollowing = !isCurrentlyFollowing;
        if (newFollowing) {
          followingChefIds.add(targetUserId);
        } else {
          followingChefIds.remove(targetUserId);
        }
        await Future.wait([fetchFeaturedChefs(), fetchUserProfile()]);
        return (
          ok: true,
          following: newFollowing,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              (newFollowing
                  ? 'Agora você está seguindo este Chef!'
                  : 'Você deixou de seguir este Chef.')
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        following: isCurrentlyFollowing,
        message: errMsg ?? 'Não foi possível atualizar o status de seguidor.'
      );
    } catch (e) {
      return (
        ok: false,
        following: isCurrentlyFollowing,
        message: 'Erro ao atualizar seguidor: $e'
      );
    }
  }

  Future<({bool ok, String message})> removeFollower(int followerUserId) async {
    try {
      final res =
          await _request('DELETE', '/social/remover-seguidor/$followerUserId');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchUserProfile();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Seguidor removido com sucesso.'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível remover o seguidor.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao remover seguidor: $e');
    }
  }

  Future<List<ChefProfile>> fetchMyFollowers() async {
    try {
      final res = await _request('GET', '/social/meus-seguidores');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map ? (data['seguidores'] ?? []) : []);
        if (list is List) {
          return list
              .whereType<Map<String, dynamic>>()
              .map((e) => ChefProfile.fromJson(
                    e['seguidor'] is Map<String, dynamic> ? e['seguidor'] : e,
                  ))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<ChefProfile>> fetchMyFollowing() async {
    try {
      final res = await _request('GET', '/social/meus-seguindo');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list =
            data is List ? data : (data is Map ? (data['seguindo'] ?? []) : []);
        if (list is List) {
          return list
              .whereType<Map<String, dynamic>>()
              .map((e) => ChefProfile.fromJson(
                    e['seguido'] is Map<String, dynamic> ? e['seguido'] : e,
                  ))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<void> fetchNotifications() async {
    try {
      final res = await _request('GET', '/social/notificacoes');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        final list = data is List
            ? data
            : (data is Map
                ? (data['notificacoes'] ?? data['dados'] ?? [])
                : []);
        if (list is List) {
          final readIds = StorageService.instance
              .getStringList('sabore_read_notifications')
              .toSet();
          final deletedIds = StorageService.instance
              .getStringList('sabore_deleted_notifications')
              .toSet();

          notifications = list
              .whereType<Map<String, dynamic>>()
              .map((e) => AppNotification.fromJson(e))
              .where((n) => !deletedIds.contains(n.id))
              .map((n) {
            if (readIds.contains(n.id)) n.lida = true;
            return n;
          }).toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  int get unreadNotificationsCount =>
      notifications.where((n) => !n.lida).length;

  Future<void> markAllNotificationsAsRead() async {
    final readIds = StorageService.instance
        .getStringList('sabore_read_notifications')
        .toSet();
    for (final n in notifications) {
      n.lida = true;
      readIds.add(n.id);
    }
    await StorageService.instance
        .setStringList('sabore_read_notifications', readIds.toList());
    notifyListeners();
  }

  Future<void> deleteNotificationsByIds(Set<String> ids) async {
    final deletedIds = StorageService.instance
        .getStringList('sabore_deleted_notifications')
        .toSet();
    deletedIds.addAll(ids);
    await StorageService.instance
        .setStringList('sabore_deleted_notifications', deletedIds.toList());
    notifications.removeWhere((n) => ids.contains(n.id));
    notifyListeners();
  }

  // ===========================================================================
  // 9. RANKING PRO (/planos/ranking, /planos/historico-atividades) E PERFIL
  // ===========================================================================

  Future<void> fetchRankingPro() async {
    try {
      final res = await _request('GET', '/planos/ranking');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) {
          final per = data['periodo'] is Map<String, dynamic>
              ? data['periodo'] as Map<String, dynamic>
              : <String, dynamic>{};
          rankingPeriodo = {
            'mesReferencia':
                data['mesReferencia'] ?? per['mesReferencia'] ?? '',
            'diasRestantes': per['diasRestantes'] ?? 10,
            'horasRestantes': per['horasRestantes'] ?? 12,
            'totalParticipantes': data['totalParticipantes'] ?? 0,
          };
        }
        final list = data is List
            ? data
            : (data is Map
                ? (data['rankingCompleto'] ??
                    data['ranking'] ??
                    data['top5'] ??
                    data['usuarios'] ??
                    [])
                : []);
        if (list is List) {
          rankingList = [];
          for (var i = 0; i < list.length; i++) {
            if (list[i] is Map<String, dynamic>) {
              rankingList.add(
                  RankingEntry.fromJson(list[i] as Map<String, dynamic>, i));
            }
          }
          if (_currentUser != null) {
            final myEntry = rankingList
                .where((r) => r.usuarioId == _currentUser!.id)
                .firstOrNull;
            if (myEntry != null) {
              _currentUser = _currentUser!.copyWith(
                pontosMensais: myEntry.pontos,
                posicaoRanking: myEntry.posicao,
                naZonaPro: myEntry.naZonaPro,
              );
            }
          }
          notifyListeners();
        }
      }

      final actRes = await _request('GET', '/planos/historico-atividades');
      if (actRes.statusCode >= 200 && actRes.statusCode < 300) {
        final actData = _decodeResponse(actRes);
        final list = actData is List
            ? actData
            : (actData is Map
                ? (actData['atividades'] ?? actData['historico'] ?? [])
                : []);
        if (list is List) {
          myActivities = list
              .whereType<Map<String, dynamic>>()
              .map((e) => EngagementActivity.fromJson(e))
              .toList();
          notifyListeners();
        }
      }
    } catch (_) {}
  }

  Future<void> fetchAchievementsAndFrames() async {
    try {
      final cRes = await _request('GET', '/usuarios/conquistas');
      if (cRes.statusCode >= 200 && cRes.statusCode < 300) {
        final cData = _decodeResponse(cRes);
        final list = cData is List
            ? cData
            : (cData is Map
                ? (cData['emblemas'] ?? cData['conquistas'] ?? [])
                : []);
        if (list is List) {
          conquistas = list.whereType<Map<String, dynamic>>().toList();
        }
      }
      final mRes = await _request('GET', '/usuarios/molduras');
      if (mRes.statusCode >= 200 && mRes.statusCode < 300) {
        final mData = _decodeResponse(mRes);
        final list = mData is List
            ? mData
            : (mData is Map ? (mData['molduras'] ?? []) : []);
        if (list is List) {
          moldurasDisponiveis = list.whereType<Map<String, dynamic>>().toList();
        }
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<({bool ok, String message})> equipProfileFrame(
      String? molduraId) async {
    try {
      final res = await _request(
        'PUT',
        '/usuarios/equipar-moldura',
        body: {'moldura': molduraId ?? 'none'},
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await Future.wait([fetchUserProfile(), fetchAchievementsAndFrames()]);
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Moldura atualizada com sucesso!'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Você ainda não desbloqueou esta moldura.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao equipar moldura: $e');
    }
  }

  Future<({bool ok, String message})> updateProfile({
    String? nome,
    String? email,
    String? novaSenha,
    String? fotoPerfilBase64,
    bool removerFoto = false,
    String? molduraAtiva,
    bool removerMoldura = false,
    String? bio,
    List<String>? preferencias,
  }) async {
    if (_currentUser == null) {
      return (ok: false, message: 'Usuário não autenticado.');
    }
    try {
      if (removerMoldura || molduraAtiva != null) {
        final frameResult =
            await equipProfileFrame(removerMoldura ? 'none' : molduraAtiva);
        if (!frameResult.ok) return frameResult;
      }

      final body = <String, dynamic>{
        'nome': (nome ?? _currentUser!.nome).trim(),
        'email': (email ?? _currentUser!.email).trim(),
        if (novaSenha != null && novaSenha.trim().isNotEmpty)
          'senha': novaSenha.trim(),
        if (removerFoto)
          'foto': null
        else if (fotoPerfilBase64 != null)
          'foto': fotoPerfilBase64,
      };

      final res = await _request(
          'PUT', '/usuarios/atualizar/${_currentUser!.id}',
          body: body);
      if (res.statusCode < 200 || res.statusCode >= 300) {
        final data = _decodeResponse(res);
        final err = (data is Map ? (data['erro'] ?? data['mensagem']) : null)
            ?.toString();
        return (
          ok: false,
          message: err ?? 'Não foi possível atualizar o perfil no servidor.',
        );
      }
    } catch (e) {
      return (ok: false, message: 'Falha ao sincronizar o perfil: $e');
    }

    if (bio != null) {
      await StorageService.instance
          .setString('sabore_bio_${_currentUser!.email}', bio.trim());
    }
    if (preferencias != null) {
      await StorageService.instance
          .setStringList('sabore_prefs_${_currentUser!.email}', preferencias);
    }

    await fetchUserProfile();
    if (bio != null || preferencias != null) {
      _currentUser = _currentUser?.copyWith(
        bio: bio ?? _currentUser!.bio,
        preferencias: preferencias ?? _currentUser!.preferencias,
      );
      if (_currentUser != null) {
        await StorageService.instance
            .setJsonMap('sabore_user', _currentUser!.toJson());
      }
    }
    notifyListeners();
    return (ok: true, message: 'Perfil atualizado com sucesso!');
  }

  Future<({bool ok, String message})> deleteMyAccount() async {
    if (_currentUser == null) {
      return (ok: false, message: 'Usuário não autenticado.');
    }
    try {
      final res =
          await _request('DELETE', '/usuarios/excluir/${_currentUser!.id}');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await logout();
        return (
          ok: true,
          message: 'Sua conta foi encerrada e excluída com sucesso.'
        );
      }
      final data = _decodeResponse(res);
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível excluir sua conta.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao excluir conta: $e');
    }
  }

  // ===========================================================================
  // 10. PAINEL ADMINISTRATIVO COMPLETO (3 ABAS DO WEB ADMIN)
  // ===========================================================================

  Future<Map<String, dynamic>> fetchAdminDashboard() async {
    try {
      final res = await _request('GET', '/planos/admin/dashboard');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is Map<String, dynamic>) return data;
      }
    } catch (_) {}
    return {};
  }

  Future<({bool ok, String message})> executeAdminMonthlyClosing(
      {String? mesReferencia}) async {
    try {
      final res = await _request(
        'POST',
        '/planos/admin/fechamento',
        body: {
          if (mesReferencia != null && mesReferencia.trim().isNotEmpty)
            'mesReferencia': mesReferencia.trim(),
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchRankingPro();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Fechamento mensal executado! Top 5 premiados com 30 dias de Saboré PRO!'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (
        ok: false,
        message: errMsg ?? 'Erro ao executar fechamento mensal.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao executar fechamento mensal: $e');
    }
  }

  Future<List<Map<String, dynamic>>>
      fetchAdminScheduledWeeklyChallenges() async {
    try {
      final res = await _request('GET', '/desafios/semanal/programados');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<List<Map<String, dynamic>>> fetchAdminWeeklyParticipations(
      {int? desafioId}) async {
    try {
      final query = desafioId != null
          ? '/desafios/semanal/admin/participacoes?desafioId=$desafioId'
          : '/desafios/semanal/admin/participacoes';
      final res = await _request('GET', query);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<({bool ok, String message})> createAdminWeeklyChallenge({
    int? id,
    required String titulo,
    required String descricao,
    required String ingredienteFoco,
    required String dicaChef,
    String? regras,
    String? hashtag,
    int pontos = 30,
    String? dataInicio,
    String? dataFim,
  }) async {
    try {
      final now = DateTime.now();
      final end = now.add(const Duration(days: 7));
      final res = await _request(
        'POST',
        '/desafios/semanal/admin/salvar',
        body: {
          if (id != null) 'id': id,
          'titulo': titulo.trim(),
          'descricao': descricao.trim(),
          'ingrediente': ingredienteFoco.trim(),
          'regras': (regras ?? 'Prato autoral com foto real do preparo').trim(),
          'dica': dicaChef.trim(),
          'hashtag': (hashtag ?? '#DesafioSabore').trim(),
          'pontos': pontos,
          'status': 'ATIVO',
          'dataInicio': dataInicio ?? now.toIso8601String(),
          'dataFim': dataFim ?? end.toIso8601String(),
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchWeeklyChallenge();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Desafio Semanal salvo e ativado com sucesso!'
        );
      }
      final errMsg =
          (data is Map ? (data['erro'] ?? data['mensagem']) : null)?.toString();
      return (ok: false, message: errMsg ?? 'Erro ao salvar desafio semanal.');
    } catch (e) {
      return (ok: false, message: 'Erro ao salvar desafio semanal: $e');
    }
  }

  Future<({bool ok, String message})> endAdminWeeklyChallenge(
      int desafioId) async {
    try {
      final res =
          await _request('POST', '/desafios/semanal/admin/$desafioId/encerrar');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchWeeklyChallenge();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Desafio semanal encerrado.'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao encerrar desafio.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao encerrar desafio: $e');
    }
  }

  Future<List<Map<String, dynamic>>> fetchAdminEventEntries(
      String eventId) async {
    try {
      final res =
          await _request('GET', '/desafios/eventos/$eventId/admin/entradas');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().toList();
        }
      }
    } catch (_) {}
    return [];
  }

  Future<({bool ok, String message})> saveAdminSpecialEvent({
    String? id,
    required Map<String, dynamic> payload,
  }) async {
    try {
      final res = id != null && id.isNotEmpty
          ? await _request('PUT', '/desafios/eventos/$id', body: payload)
          : await _request('POST', '/desafios/eventos', body: payload);
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Evento Especial salvo com sucesso!'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Não foi possível salvar o evento.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao salvar evento: $e');
    }
  }

  Future<({bool ok, String message})> moderateAdminEventEntry({
    required String eventId,
    required int entradaId,
    required String acao, // 'APROVAR' ou 'REJEITAR'
    String? motivoRejeicao,
  }) async {
    try {
      final res = await _request(
        'POST',
        '/desafios/eventos/$eventId/entradas/$entradaId/moderar',
        body: {
          'acao': acao,
          if (motivoRejeicao != null) 'motivoRejeicao': motivoRejeicao,
        },
      );
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Moderação aplicada com sucesso.'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao moderar inscrição.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao moderar inscrição: $e');
    }
  }

  Future<({bool ok, String message})> endAdminEventVoting(
      String eventId) async {
    try {
      final res =
          await _request('POST', '/desafios/eventos/$eventId/encerrar-votacao');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Votação encerrada com sucesso!'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao encerrar votação.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao encerrar votação: $e');
    }
  }

  Future<({bool ok, String message})> confirmAdminEventResult(
      String eventId) async {
    try {
      final res = await _request(
          'POST', '/desafios/eventos/$eventId/confirmar-resultado');
      final data = _decodeResponse(res);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await fetchSpecialEvents();
        return (
          ok: true,
          message: (data is Map ? data['mensagem'] : null)?.toString() ??
              'Resultado oficial confirmado e prêmios concedidos ao vencedor!'
        );
      }
      return (
        ok: false,
        message: (data is Map ? (data['erro'] ?? data['mensagem']) : null)
                ?.toString() ??
            'Erro ao confirmar resultado.'
      );
    } catch (e) {
      return (ok: false, message: 'Erro ao confirmar resultado: $e');
    }
  }

  Future<List<Map<String, dynamic>>> fetchAdminEventAuditLogs() async {
    try {
      final res = await _request('GET', '/desafios/eventos/auditoria');
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = _decodeResponse(res);
        if (data is List) {
          return data.whereType<Map<String, dynamic>>().toList();
        }
      }
    } catch (_) {}
    return [];
  }
}
