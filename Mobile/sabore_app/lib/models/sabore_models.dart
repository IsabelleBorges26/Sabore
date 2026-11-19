// Modelos de dados completos do ecossistema Saboré Mobile,
// mapeados 1:1 com a API Node.js/Express + Prisma/PostgreSQL do Saboré Web.

class AppUser {
  final int id;
  final String nome;
  final String email;
  final String? fotoPerfil;
  final String plano; // 'FREE' ou 'PRO'
  final bool isPro;
  final bool isAdmin;
  final String? dataExpiracaoPro;
  final String? molduraAtiva;
  final String bio;
  final List<String> preferencias;
  final int seguidoresCount;
  final int seguindoCount;
  final int publicacoesCount;
  final int pontosMensais;
  final int? posicaoRanking;
  final int totalParticipantesRanking;
  final bool naZonaPro;
  final int pontosParaTop5;
  final int statsSaved;
  final int statsCreated;
  final int statsAiGenerated;
  final int statsBooksCount;

  const AppUser({
    required this.id,
    required this.nome,
    required this.email,
    this.fotoPerfil,
    this.plano = 'FREE',
    this.isPro = false,
    this.isAdmin = false,
    this.dataExpiracaoPro,
    this.molduraAtiva,
    this.bio = '',
    this.preferencias = const [],
    this.seguidoresCount = 0,
    this.seguindoCount = 0,
    this.publicacoesCount = 0,
    this.pontosMensais = 0,
    this.posicaoRanking,
    this.totalParticipantesRanking = 0,
    this.naZonaPro = false,
    this.pontosParaTop5 = 0,
    this.statsSaved = 0,
    this.statsCreated = 0,
    this.statsAiGenerated = 0,
    this.statsBooksCount = 0,
  });

  String get initials {
    final parts = nome.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return 'S';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final rawPlano = (json['plano'] ?? json['plan'] ?? 'FREE').toString().toUpperCase();
    final rawIsPro = json['isPro'] == true ||
        json['proAtivo'] == true ||
        rawPlano == 'PRO';
    final rawIsAdmin = json['isAdmin'] == true ||
        json['role'] == 'ADMIN' ||
        (json['email'] ?? '').toString().toLowerCase().contains('admin');

    List<String> prefs = [];
    if (json['preferencias'] is List) {
      prefs = (json['preferencias'] as List).map((e) => e.toString()).toList();
    }

    final eng = json['engajamento'] is Map<String, dynamic>
        ? json['engajamento'] as Map<String, dynamic>
        : null;
    final st = json['stats'] is Map<String, dynamic>
        ? json['stats'] as Map<String, dynamic>
        : null;

    final foto = (json['foto'] ?? json['fotoPerfil'] ?? json['avatar'])?.toString();

    return AppUser(
      id: _toInt(json['id'] ?? json['usuarioId'] ?? 0),
      nome: (json['nome'] ??
              json['name'] ??
              json['email']?.toString().split('@').first ??
              'Chef Saboré')
          .toString(),
      email: (json['email'] ?? '').toString(),
      fotoPerfil: (foto != null && foto.isNotEmpty && foto != 'null') ? foto : null,
      plano: rawIsPro ? 'PRO' : 'FREE',
      isPro: rawIsPro,
      isAdmin: rawIsAdmin,
      dataExpiracaoPro: json['dataExpiracaoPro']?.toString() ??
          json['proExpiraEm']?.toString() ??
          json['planoExpiraEm']?.toString(),
      molduraAtiva: json['molduraAtiva']?.toString(),
      bio: (json['bio'] ?? '').toString(),
      preferencias: prefs,
      seguidoresCount: _toInt(
        json['seguidoresCount'] ??
            json['totalSeguidores'] ??
            json['seguidores'] ??
            json['_count']?['seguidores'] ??
            0,
      ),
      seguindoCount: _toInt(
        json['seguindoCount'] ??
            json['totalSeguindo'] ??
            json['seguindo'] ??
            json['_count']?['seguindo'] ??
            0,
      ),
      publicacoesCount: _toInt(
        json['publicacoesCount'] ??
            json['totalReceitas'] ??
            st?['created'] ??
            json['_count']?['receitas'] ??
            0,
      ),
      pontosMensais: _toInt(
        eng?['pontosMes'] ?? json['pontosMensais'] ?? json['pontos'] ?? 0,
      ),
      posicaoRanking: (eng?['posicaoRanking'] ?? json['posicaoRanking']) != null
          ? _toInt(eng?['posicaoRanking'] ?? json['posicaoRanking'])
          : null,
      totalParticipantesRanking: _toInt(eng?['totalParticipantes'] ?? json['totalParticipantesRanking'] ?? 0),
      naZonaPro: eng?['naZonaPro'] == true || json['naZonaPro'] == true,
      pontosParaTop5: _toInt(eng?['pontosParaTop5'] ?? json['pontosParaTop5'] ?? 0),
      statsSaved: _toInt(st?['saved'] ?? json['statsSaved'] ?? 0),
      statsCreated: _toInt(st?['created'] ?? json['statsCreated'] ?? 0),
      statsAiGenerated: _toInt(st?['aiGenerated'] ?? json['statsAiGenerated'] ?? 0),
      statsBooksCount: _toInt(st?['booksCount'] ?? json['statsBooksCount'] ?? 0),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'email': email,
        'fotoPerfil': fotoPerfil,
        'foto': fotoPerfil,
        'plano': plano,
        'isPro': isPro,
        'isAdmin': isAdmin,
        'dataExpiracaoPro': dataExpiracaoPro,
        'molduraAtiva': molduraAtiva,
        'bio': bio,
        'preferencias': preferencias,
        'seguidoresCount': seguidoresCount,
        'seguindoCount': seguindoCount,
        'publicacoesCount': publicacoesCount,
        'pontosMensais': pontosMensais,
        'posicaoRanking': posicaoRanking,
        'totalParticipantesRanking': totalParticipantesRanking,
        'naZonaPro': naZonaPro,
        'pontosParaTop5': pontosParaTop5,
        'statsSaved': statsSaved,
        'statsCreated': statsCreated,
        'statsAiGenerated': statsAiGenerated,
        'statsBooksCount': statsBooksCount,
      };

  AppUser copyWith({
    int? id,
    String? nome,
    String? email,
    String? fotoPerfil,
    bool clearFoto = false,
    String? plano,
    bool? isPro,
    bool? isAdmin,
    String? dataExpiracaoPro,
    String? molduraAtiva,
    bool clearMoldura = false,
    String? bio,
    List<String>? preferencias,
    int? seguidoresCount,
    int? seguindoCount,
    int? publicacoesCount,
    int? pontosMensais,
    int? posicaoRanking,
    int? totalParticipantesRanking,
    bool? naZonaPro,
    int? pontosParaTop5,
    int? statsSaved,
    int? statsCreated,
    int? statsAiGenerated,
    int? statsBooksCount,
  }) {
    return AppUser(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      email: email ?? this.email,
      fotoPerfil: clearFoto ? null : (fotoPerfil ?? this.fotoPerfil),
      plano: plano ?? this.plano,
      isPro: isPro ?? this.isPro,
      isAdmin: isAdmin ?? this.isAdmin,
      dataExpiracaoPro: dataExpiracaoPro ?? this.dataExpiracaoPro,
      molduraAtiva: clearMoldura ? null : (molduraAtiva ?? this.molduraAtiva),
      bio: bio ?? this.bio,
      preferencias: preferencias ?? this.preferencias,
      seguidoresCount: seguidoresCount ?? this.seguidoresCount,
      seguindoCount: seguindoCount ?? this.seguindoCount,
      publicacoesCount: publicacoesCount ?? this.publicacoesCount,
      pontosMensais: pontosMensais ?? this.pontosMensais,
      posicaoRanking: posicaoRanking ?? this.posicaoRanking,
      totalParticipantesRanking: totalParticipantesRanking ?? this.totalParticipantesRanking,
      naZonaPro: naZonaPro ?? this.naZonaPro,
      pontosParaTop5: pontosParaTop5 ?? this.pontosParaTop5,
      statsSaved: statsSaved ?? this.statsSaved,
      statsCreated: statsCreated ?? this.statsCreated,
      statsAiGenerated: statsAiGenerated ?? this.statsAiGenerated,
      statsBooksCount: statsBooksCount ?? this.statsBooksCount,
    );
  }
}

class RecipeIngredient {
  final int? id;
  final String nome;
  final String quantidade;
  final String unidadeMedida;
  bool checked;

  RecipeIngredient({
    this.id,
    required this.nome,
    this.quantidade = '',
    this.unidadeMedida = '',
    this.checked = false,
  });

  String get displayText {
    final q = quantidade.trim();
    final u = unidadeMedida.trim();
    if (q.isEmpty && u.isEmpty) return nome;
    if (u.isEmpty ||
        u.toLowerCase() == 'unidade' && q == '1' && nome.contains(' ') ||
        (u.toLowerCase() == 'a gosto' && q.toLowerCase() == 'a gosto')) {
      if (u.toLowerCase() == 'unidade' && q == '1' && nome.contains(' ')) {
        return nome;
      }
      return '$q $nome'.trim();
    }
    return '$q $u de $nome'.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  factory RecipeIngredient.fromDynamic(dynamic raw) {
    if (raw is String) {
      return RecipeIngredient(nome: raw.trim());
    }
    if (raw is Map<String, dynamic>) {
      final ingObj = raw['ingrediente'] is Map<String, dynamic>
          ? raw['ingrediente'] as Map<String, dynamic>
          : null;
      final nome = (raw['nome'] ??
              ingObj?['nome'] ??
              raw['item'] ??
              raw['name'] ??
              raw['ingredienteNome'] ??
              'Ingrediente')
          .toString();
      final qtd = (raw['quantidade'] ?? raw['qtd'] ?? raw['amount'] ?? '').toString();
      final un = (raw['unidadeMedida'] ?? raw['unidade'] ?? raw['unit'] ?? '').toString();
      return RecipeIngredient(
        id: raw['id'] != null ? _toInt(raw['id']) : null,
        nome: nome,
        quantidade: qtd == 'null' ? '' : qtd,
        unidadeMedida: un == 'null' ? '' : un,
      );
    }
    return RecipeIngredient(nome: raw.toString());
  }

  Map<String, dynamic> toJson() => {
        'nome': nome,
        'quantidade': quantidade.isEmpty ? '1' : quantidade,
        'unidadeMedida': unidadeMedida.isEmpty ? 'unidade' : unidadeMedida,
      };
}

class Recipe {
  final int id;
  final String titulo;
  final String descricao;
  final String modoPreparo;
  final int tempoPreparo;
  final int porcoes;
  final String dificuldade;
  final String categoria;
  final List<String> categorias;
  final bool publica;
  final bool criadaPorIA;
  final String? imagem;
  final int? autorId;
  final String autorNome;
  final String? autorFoto;
  final String? autorMoldura;
  final bool autorIsPro;
  final int? livroId;
  final String? livroNome;
  final List<RecipeIngredient> ingredientes;
  final double mediaAvaliacoes;
  final int totalAvaliacoes;
  final int totalComentarios;
  final int totalFavoritos;
  final int totalCompartilhamentos;
  final String? criadaEm;
  final List<String> hashtags;

  const Recipe({
    required this.id,
    required this.titulo,
    this.descricao = '',
    required this.modoPreparo,
    this.tempoPreparo = 30,
    this.porcoes = 2,
    this.dificuldade = 'Médio',
    this.categoria = 'Prato Principal',
    this.categorias = const [],
    this.publica = false,
    this.criadaPorIA = false,
    this.imagem,
    this.autorId,
    this.autorNome = 'Chef Saboré',
    this.autorFoto,
    this.autorMoldura,
    this.autorIsPro = false,
    this.livroId,
    this.livroNome,
    this.ingredientes = const [],
    this.mediaAvaliacoes = 0.0,
    this.totalAvaliacoes = 0,
    this.totalComentarios = 0,
    this.totalFavoritos = 0,
    this.totalCompartilhamentos = 0,
    this.criadaEm,
    this.hashtags = const [],
  });

  List<String> get steps {
    if (modoPreparo.trim().isEmpty) {
      return ['Siga os passos tradicionais de preparo.'];
    }
    final splitByLines = modoPreparo
        .split(RegExp(r'\r?\n+'))
        .map((s) => s
            .replaceFirst(
              RegExp(r'^\s*(\d+[\.\)\-]\s*|Passo\s*\d+[:\-]?\s*)', caseSensitive: false),
              '',
            )
            .trim())
        .where((s) => s.isNotEmpty)
        .toList();
    if (splitByLines.length > 1) return splitByLines;
    final splitByDot = modoPreparo
        .split(RegExp(r'(?<=\.)\s+(?=[A-ZÀ-Ú])'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    return splitByDot.isNotEmpty ? splitByDot : [modoPreparo.trim()];
  }

  factory Recipe.fromJson(Map<String, dynamic> json) {
    final usuario = json['usuario'] is Map<String, dynamic>
        ? json['usuario'] as Map<String, dynamic>
        : (json['autor'] is Map<String, dynamic>
            ? json['autor'] as Map<String, dynamic>
            : null);

    final livro = json['livro'] is Map<String, dynamic>
        ? json['livro'] as Map<String, dynamic>
        : null;

    // Ingredientes: suporta `ingredients` (formatRecipe do Back-End) e `ingredientes`
    List<RecipeIngredient> parsedIngs = [];
    final rawIngs =
        json['ingredients'] ?? json['ingredientes'] ?? json['receitaIngredientes'] ?? [];
    if (rawIngs is List) {
      parsedIngs = rawIngs.map((e) => RecipeIngredient.fromDynamic(e)).toList();
    } else if (rawIngs is String && rawIngs.isNotEmpty) {
      parsedIngs = rawIngs
          .split(RegExp(r'[\n,]'))
          .where((s) => s.trim().isNotEmpty)
          .map((s) => RecipeIngredient(nome: s.trim()))
          .toList();
    }

    // Passos / Modo de Preparo: suporta `steps` (List<String>) e `modoPreparo` (String)
    String preparoStr = '';
    final rawPreparo =
        json['steps'] ?? json['modoPreparo'] ?? json['preparo'] ?? json['passos'] ?? '';
    if (rawPreparo is List) {
      preparoStr = rawPreparo.map((e) => e.toString().trim()).where((s) => s.isNotEmpty).join('\n');
    } else {
      preparoStr = rawPreparo.toString();
    }

    // Avaliações: suporta `avaliacoes: { media, total }`, `avaliacoes: List`, `mediaAvaliacoes`
    double media = _toDouble(
      json['mediaAvaliacoes'] ?? json['notaMedia'] ?? json['rating'] ?? 0,
    );
    int countAval = _toInt(
      json['totalAvaliacoes'] ?? json['_count']?['avaliacoes'] ?? 0,
    );
    if (json['avaliacoes'] is Map<String, dynamic>) {
      final avMap = json['avaliacoes'] as Map<String, dynamic>;
      media = _toDouble(avMap['media'] ?? media);
      countAval = _toInt(avMap['total'] ?? countAval);
    } else if (json['avaliacoes'] is List) {
      final list = json['avaliacoes'] as List;
      if (countAval == 0) countAval = list.length;
      if (media == 0 && list.isNotEmpty) {
        double sum = 0;
        for (final a in list) {
          if (a is Map) sum += _toDouble(a['nota'] ?? 0);
        }
        media = sum / list.length;
      }
    }

    // Tempo de preparo: suporta `"30 min"` ou `30`
    int parsedTime = 30;
    final rawTime = json['tempoPreparo'] ?? json['time'] ?? json['tempo'];
    if (rawTime != null) {
      if (rawTime is int) {
        parsedTime = rawTime;
      } else {
        final match = RegExp(r'\d+').firstMatch(rawTime.toString());
        if (match != null) {
          parsedTime = int.tryParse(match.group(0)!) ?? 30;
        }
      }
    }

    // Porções: suporta `"2 porções"` ou `2`
    int parsedServings = 2;
    final rawServings = json['porcoes'] ?? json['servings'];
    if (rawServings != null) {
      if (rawServings is int) {
        parsedServings = rawServings;
      } else {
        final match = RegExp(r'\d+').firstMatch(rawServings.toString());
        if (match != null) {
          parsedServings = int.tryParse(match.group(0)!) ?? 2;
        }
      }
    }

    final titleStr = (json['title'] ?? json['titulo'] ?? json['nome'] ?? 'Receita Saboré').toString();
    final desc = (json['description'] ?? json['descricao'] ?? '').toString();

    // Hashtags: usa `json['hashtags']` do Back-End ou extrai via regex
    List<String> extractedTags = [];
    if (json['hashtags'] is List) {
      extractedTags = (json['hashtags'] as List)
          .map((e) => e.toString().trim())
          .where((s) => s.isNotEmpty)
          .map((s) => s.startsWith('#') ? s : '#$s')
          .toSet()
          .toList();
    }
    if (extractedTags.isEmpty) {
      final RegExp hashRegex = RegExp(r'#[a-zA-Z0-9À-ÿ_]+');
      extractedTags = hashRegex
          .allMatches('$desc $titleStr')
          .map((m) => m.group(0)!)
          .toSet()
          .toList();
    }

    List<String> cats = [];
    if (json['categories'] is List) {
      cats = (json['categories'] as List).map((e) => e.toString()).toList();
    }

    final rawImage = (json['image'] ?? json['imagem'] ?? json['foto'])?.toString();
    final cleanImage =
        (rawImage != null && rawImage.isNotEmpty && rawImage != 'null') ? rawImage : null;

    final rawAuthorAvatar = (json['authorAvatar'] ??
            usuario?['foto'] ??
            usuario?['fotoPerfil'] ??
            json['autorFoto'])
        ?.toString();

    return Recipe(
      id: _toInt(json['id'] ?? json['receitaId'] ?? 0),
      titulo: titleStr,
      descricao: desc,
      modoPreparo: preparoStr,
      tempoPreparo: parsedTime,
      porcoes: parsedServings,
      dificuldade: (json['difficulty'] ?? json['dificuldade'] ?? 'Médio').toString(),
      categoria: (json['category'] ??
              json['categoria'] ??
              (cats.isNotEmpty ? cats.first : null) ??
              livro?['titulo'] ??
              livro?['nome'] ??
              'Prato Principal')
          .toString(),
      categorias: cats,
      publica: json['public'] == true ||
          json['publica'] == true ||
          json['communityPublished'] == true ||
          json['isPublic'] == true,
      criadaPorIA: json['criadaPorIA'] == true,
      imagem: cleanImage,
      autorId: json['authorId'] != null
          ? _toInt(json['authorId'])
          : (json['usuarioId'] != null
              ? _toInt(json['usuarioId'])
              : (usuario?['id'] != null ? _toInt(usuario!['id']) : null)),
      autorNome: (json['author'] ??
              usuario?['nome'] ??
              json['autorNome'] ??
              json['chef'] ??
              'Chef Saboré')
          .toString(),
      autorFoto: (rawAuthorAvatar != null && rawAuthorAvatar.isNotEmpty && rawAuthorAvatar != 'null')
          ? rawAuthorAvatar
          : null,
      autorMoldura: (json['authorFrame'] ??
              usuario?['molduraAtiva'] ??
              json['autorMoldura'])
          ?.toString(),
      autorIsPro: json['authorPlan'] == 'PRO' ||
          usuario?['plano'] == 'PRO' ||
          usuario?['isPro'] == true ||
          json['autorIsPro'] == true,
      livroId: json['livroId'] != null
          ? _toInt(json['livroId'])
          : (livro?['id'] != null ? _toInt(livro!['id']) : null),
      livroNome: (livro?['titulo'] ?? livro?['nome'])?.toString(),
      ingredientes: parsedIngs,
      mediaAvaliacoes: media,
      totalAvaliacoes: countAval,
      totalComentarios: _toInt(
        json['comentarios'] is int
            ? json['comentarios']
            : (json['totalComentarios'] ??
                json['_count']?['comentarios'] ??
                (json['comentarios'] is List ? (json['comentarios'] as List).length : 0)),
      ),
      totalFavoritos: _toInt(
        json['likes'] ?? json['totalFavoritos'] ?? json['_count']?['favoritos'] ?? 0,
      ),
      totalCompartilhamentos: _toInt(
        json['compartilhamentos'] ?? json['totalCompartilhamentos'] ?? 0,
      ),
      criadaEm: (json['publishedAt'] ??
              json['criadaEm'] ??
              json['createdAt'] ??
              json['publicadaEm'])
          ?.toString(),
      hashtags: extractedTags,
    );
  }

  Recipe copyWith({
    bool? publica,
    double? mediaAvaliacoes,
    int? totalAvaliacoes,
    int? totalComentarios,
    int? totalFavoritos,
    int? totalCompartilhamentos,
  }) {
    return Recipe(
      id: id,
      titulo: titulo,
      descricao: descricao,
      modoPreparo: modoPreparo,
      tempoPreparo: tempoPreparo,
      porcoes: porcoes,
      dificuldade: dificuldade,
      categoria: categoria,
      categorias: categorias,
      publica: publica ?? this.publica,
      criadaPorIA: criadaPorIA,
      imagem: imagem,
      autorId: autorId,
      autorNome: autorNome,
      autorFoto: autorFoto,
      autorMoldura: autorMoldura,
      autorIsPro: autorIsPro,
      livroId: livroId,
      livroNome: livroNome,
      ingredientes: ingredientes,
      mediaAvaliacoes: mediaAvaliacoes ?? this.mediaAvaliacoes,
      totalAvaliacoes: totalAvaliacoes ?? this.totalAvaliacoes,
      totalComentarios: totalComentarios ?? this.totalComentarios,
      totalFavoritos: totalFavoritos ?? this.totalFavoritos,
      totalCompartilhamentos: totalCompartilhamentos ?? this.totalCompartilhamentos,
      criadaEm: criadaEm,
      hashtags: hashtags,
    );
  }
}

class RecipeBook {
  final int id;
  final String nome;
  final String icone;
  final String tag;
  final bool padrao;
  final int totalReceitas;
  final List<Recipe> receitas;
  final String? criadaEm;

  const RecipeBook({
    required this.id,
    required this.nome,
    this.icone = '📖',
    this.tag = 'Coleção',
    this.padrao = false,
    this.totalReceitas = 0,
    this.receitas = const [],
    this.criadaEm,
  });

  String? get coverImage {
    for (final r in receitas) {
      if (r.imagem != null && r.imagem!.isNotEmpty) return r.imagem;
    }
    return null;
  }

  factory RecipeBook.fromJson(Map<String, dynamic> json) {
    List<Recipe> recs = [];
    final rawRecs = json['receitas'] ?? (json['recipes'] is List ? json['recipes'] : null);
    if (rawRecs is List) {
      recs = rawRecs
          .whereType<Map<String, dynamic>>()
          .map((e) => Recipe.fromJson(e))
          .toList();
    }
    final count = _toInt(
      (json['recipes'] is int ? json['recipes'] : null) ??
          json['totalReceitas'] ??
          json['_count']?['receitas'] ??
          recs.length,
    );

    final title = (json['title'] ?? json['titulo'] ?? json['nome'] ?? 'Meu Livro').toString();
    final emoji = (json['emoji'] ?? json['icone'] ?? '📖').toString();
    final tagStr = (json['tag'] ?? 'Coleção').toString();
    final isDefault = json['padrao'] == true ||
        const ['Café da Manhã', 'Fitness', 'Sobremesas', 'Favoritas', 'Receitas Rápidas']
            .contains(title);

    return RecipeBook(
      id: _toInt(json['id'] ?? 0),
      nome: title,
      icone: emoji,
      tag: tagStr,
      padrao: isDefault,
      totalReceitas: count,
      receitas: recs,
      criadaEm: json['criadoEm']?.toString() ?? json['createdAt']?.toString(),
    );
  }
}

class RecipeComment {
  final int id;
  final String texto;
  final String criadoEm;
  final int usuarioId;
  final String usuarioNome;
  final String? usuarioFoto;
  final String? usuarioMoldura;

  const RecipeComment({
    required this.id,
    required this.texto,
    required this.criadoEm,
    required this.usuarioId,
    required this.usuarioNome,
    this.usuarioFoto,
    this.usuarioMoldura,
  });

  factory RecipeComment.fromJson(Map<String, dynamic> json) {
    final u = json['autor'] is Map<String, dynamic>
        ? json['autor'] as Map<String, dynamic>
        : (json['usuario'] is Map<String, dynamic>
            ? json['usuario'] as Map<String, dynamic>
            : null);
    final rawFoto = (u?['foto'] ?? u?['fotoPerfil'] ?? json['usuarioFoto'])?.toString();
    return RecipeComment(
      id: _toInt(json['id'] ?? 0),
      texto: (json['texto'] ?? json['comentario'] ?? '').toString(),
      criadoEm: (json['createdAt'] ?? json['criadoEm'] ?? '').toString(),
      usuarioId: _toInt(json['usuarioId'] ?? u?['id'] ?? 0),
      usuarioNome: (u?['nome'] ?? json['usuarioNome'] ?? 'Chef Saboré').toString(),
      usuarioFoto: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      usuarioMoldura: (u?['molduraAtiva'] ?? json['usuarioMoldura'])?.toString(),
    );
  }
}

class FridgeIngredient {
  final int id;
  final String nome;

  const FridgeIngredient({required this.id, required this.nome});

  factory FridgeIngredient.fromDynamic(dynamic raw, [int fallbackId = 0]) {
    if (raw is String) {
      return FridgeIngredient(
        id: fallbackId > 0 ? fallbackId : raw.hashCode.abs(),
        nome: raw.trim(),
      );
    }
    if (raw is Map<String, dynamic>) {
      return FridgeIngredient.fromJson(raw);
    }
    return FridgeIngredient(id: fallbackId, nome: raw.toString().trim());
  }

  factory FridgeIngredient.fromJson(Map<String, dynamic> json) {
    final ing = json['ingrediente'] is Map<String, dynamic>
        ? json['ingrediente'] as Map<String, dynamic>
        : null;
    final nome = (json['nome'] ?? ing?['nome'] ?? '').toString().trim();
    return FridgeIngredient(
      id: _toInt(json['id'] ?? json['ingredienteId'] ?? nome.hashCode.abs()),
      nome: nome,
    );
  }
}

class WeeklyChallenge {
  final int id;
  final String titulo;
  final String descricao;
  final String ingredienteFoco;
  final String regras;
  final String dicaChef;
  final String hashtag;
  final String? imagem;
  final String premio;
  final int pontosParticipacao;
  final String? dataInicio;
  final String? dataFim;
  final int diasRestantes;
  final int totalParticipantes;
  final bool ativo;
  final bool jaParticipou;
  final List<ChallengeParticipation> participacoes;

  const WeeklyChallenge({
    required this.id,
    required this.titulo,
    required this.descricao,
    this.ingredienteFoco = '',
    this.regras = '',
    this.dicaChef = '',
    this.hashtag = '#DesafioSabore',
    this.imagem,
    this.premio = '+30 pts no Ranking PRO',
    this.pontosParticipacao = 30,
    this.dataInicio,
    this.dataFim,
    this.diasRestantes = 5,
    this.totalParticipantes = 0,
    this.ativo = true,
    this.jaParticipou = false,
    this.participacoes = const [],
  });

  factory WeeklyChallenge.fromJson(Map<String, dynamic> json) {
    final rawParts =
        json['participacoes'] ?? json['submissoes'] ?? json['receitas'] ?? [];
    List<ChallengeParticipation> parts = [];
    if (rawParts is List) {
      parts = rawParts
          .whereType<Map<String, dynamic>>()
          .map((e) => ChallengeParticipation.fromJson(e))
          .toList();
    }
    final pts = _toInt(json['pontos'] ?? json['pontosParticipacao'] ?? 30);
    return WeeklyChallenge(
      id: _toInt(json['id'] ?? 1),
      titulo: (json['titulo'] ?? json['tema'] ?? 'Desafio Gastronômico da Semana').toString(),
      descricao: (json['descricao'] ??
              'Prepare um prato autoral seguindo o tema da semana e envie a foto do resultado!')
          .toString(),
      ingredienteFoco: (json['ingrediente'] ??
              json['ingredienteFoco'] ??
              json['regras'] ??
              'Livre / Criativo')
          .toString(),
      regras: (json['regras'] ?? '').toString(),
      dicaChef: (json['dica'] ??
              json['dicaChef'] ??
              'Capriche no empratamento e na iluminação da foto do seu prato!')
          .toString(),
      hashtag: (json['hashtag'] ?? '#DesafioSabore').toString(),
      imagem: json['imagem']?.toString(),
      premio: (json['premio'] ?? '+$pts pts no Ranking PRO').toString(),
      pontosParticipacao: pts,
      dataInicio: json['dataInicio']?.toString(),
      dataFim: json['dataFim']?.toString(),
      diasRestantes: _toInt(json['diasRestantes'] ?? 5),
      totalParticipantes: _toInt(json['totalParticipantes'] ?? parts.length),
      ativo: json['ativo'] != false && json['status'] != 'ENCERRADO',
      jaParticipou: json['participou'] == true || json['jaParticipou'] == true,
      participacoes: parts,
    );
  }
}

class ChallengeParticipation {
  final int id;
  final int usuarioId;
  final String usuarioNome;
  final String? usuarioFoto;
  final String? usuarioMoldura;
  final bool usuarioIsPro;
  final String tituloReceita;
  final String descricao;
  final String aprendizado;
  final String? imagem;
  final String? criadoEm;

  const ChallengeParticipation({
    required this.id,
    required this.usuarioId,
    required this.usuarioNome,
    this.usuarioFoto,
    this.usuarioMoldura,
    this.usuarioIsPro = false,
    required this.tituloReceita,
    this.descricao = '',
    this.aprendizado = '',
    this.imagem,
    this.criadoEm,
  });

  factory ChallengeParticipation.fromJson(Map<String, dynamic> json) {
    final u = json['usuario'] is Map<String, dynamic>
        ? json['usuario'] as Map<String, dynamic>
        : null;
    final r = json['receita'] is Map<String, dynamic>
        ? json['receita'] as Map<String, dynamic>
        : null;
    final rawFoto = (json['fotoUsuario'] ??
            u?['foto'] ??
            u?['fotoPerfil'] ??
            json['usuarioFoto'])
        ?.toString();
    final rawImg = (json['foto'] ?? json['imagem'] ?? r?['imagem'])?.toString();
    return ChallengeParticipation(
      id: _toInt(json['id'] ?? 0),
      usuarioId: _toInt(json['usuarioId'] ?? u?['id'] ?? 0),
      usuarioNome: (json['nomeUsuario'] ??
              u?['nome'] ??
              json['usuarioNome'] ??
              'Chef Saboré')
          .toString(),
      usuarioFoto: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      usuarioMoldura: (json['molduraUsuario'] ?? u?['molduraAtiva'])?.toString(),
      usuarioIsPro: json['planoUsuario'] == 'PRO' || u?['plano'] == 'PRO',
      tituloReceita: (json['nomeReceita'] ??
              json['tituloReceita'] ??
              json['nomePrato'] ??
              r?['titulo'] ??
              json['titulo'] ??
              'Prato do Desafio')
          .toString(),
      descricao: (json['descricao'] ??
              json['descricaoPreparacao'] ??
              json['comentario'] ??
              r?['descricao'] ??
              '')
          .toString(),
      aprendizado: (json['aprendizado'] ?? '').toString(),
      imagem: (rawImg != null && rawImg.isNotEmpty && rawImg != 'null') ? rawImg : null,
      criadoEm: (json['data'] ?? json['criadoEm'] ?? json['createdAt'])?.toString(),
    );
  }
}

class SpecialEvent {
  final String id;
  final String slug;
  final String titulo;
  final String subtitulo;
  final String tema;
  final String descricao;
  final String regras;
  final String premio;
  final String? banner;
  final String? emblemaAsset;
  final String? emblemaTitulo;
  final String? molduraId;
  final int diasProPremio;
  final String status; // 'INSCRICOES', 'VOTACAO', 'ENCERRADO'
  final String? dataInicio;
  final String? dataFimInscricoes;
  final String? dataInicioVotacao;
  final String? dataFimVotacao;
  final String? dataDivulgacaoResultado;
  final int totalInscritos;
  final int totalVotos;
  final int? meuVotoEntradaId;
  final int? vencedorEntradaId;
  final bool resultadoConfirmado;
  final EventEntry? minhaInscricao;
  final List<EventEntry> inscricoes;

  const SpecialEvent({
    required this.id,
    this.slug = '',
    required this.titulo,
    this.subtitulo = '',
    this.tema = '',
    required this.descricao,
    this.regras = '',
    this.premio = 'Emblema Exclusivo + Moldura + PRO',
    this.banner,
    this.emblemaAsset,
    this.emblemaTitulo,
    this.molduraId,
    this.diasProPremio = 30,
    this.status = 'INSCRICOES',
    this.dataInicio,
    this.dataFimInscricoes,
    this.dataInicioVotacao,
    this.dataFimVotacao,
    this.dataDivulgacaoResultado,
    this.totalInscritos = 0,
    this.totalVotos = 0,
    this.meuVotoEntradaId,
    this.vencedorEntradaId,
    this.resultadoConfirmado = false,
    this.minhaInscricao,
    this.inscricoes = const [],
  });

  factory SpecialEvent.fromJson(Map<String, dynamic> json) {
    final meuVoto = json['meuVotoEntradaId'] != null ? _toInt(json['meuVotoEntradaId']) : null;
    List<EventEntry> entries = [];
    final rawInsc = json['entradas'] ?? json['inscricoes'] ?? json['participacoes'] ?? [];
    if (rawInsc is List) {
      entries = rawInsc
          .whereType<Map<String, dynamic>>()
          .map((e) => EventEntry.fromJson(e, meuVotoEntradaId: meuVoto))
          .toList();
    }

    EventEntry? myEntry;
    if (json['minhaInscricao'] is Map<String, dynamic>) {
      myEntry = EventEntry.fromJson(
        json['minhaInscricao'] as Map<String, dynamic>,
        meuVotoEntradaId: meuVoto,
      );
    }

    return SpecialEvent(
      id: (json['id'] ?? json['slug'] ?? '1').toString(),
      slug: (json['slug'] ?? '').toString(),
      titulo: (json['titulo'] ?? json['nome'] ?? 'Evento Especial Saboré').toString(),
      subtitulo: (json['subtitulo'] ?? json['periodo'] ?? '').toString(),
      tema: (json['tema'] ?? '').toString(),
      descricao: (json['descricao'] ?? '').toString(),
      regras: (json['regras'] ?? '').toString(),
      premio: (json['premioDescricao'] ??
              json['premio'] ??
              'Emblema Exclusivo + Moldura Comemorativa + 30 dias PRO')
          .toString(),
      banner: json['banner']?.toString(),
      emblemaAsset: (json['emblemaSimbolo'] ?? json['emblemaUrl'] ?? json['emblema'])?.toString(),
      emblemaTitulo: json['emblemaTitulo']?.toString(),
      molduraId: json['molduraId']?.toString(),
      diasProPremio: _toInt(json['diasProPremio'] ?? 30),
      status: (json['statusCalculado'] ?? json['status'] ?? 'INSCRICOES').toString().toUpperCase(),
      dataInicio: (json['dataInicioInscricao'] ?? json['dataInicio'])?.toString(),
      dataFimInscricoes: (json['dataFimInscricao'] ?? json['dataFimInscricoes'])?.toString(),
      dataInicioVotacao: json['dataInicioVotacao']?.toString(),
      dataFimVotacao: (json['dataFimVotacao'] ?? json['dataFim'])?.toString(),
      dataDivulgacaoResultado: json['dataDivulgacaoResultado']?.toString(),
      totalInscritos: _toInt(json['totalInscritos'] ?? entries.length),
      totalVotos: _toInt(json['totalVotos'] ?? 0),
      meuVotoEntradaId: meuVoto,
      vencedorEntradaId:
          json['vencedorEntradaId'] != null ? _toInt(json['vencedorEntradaId']) : null,
      resultadoConfirmado: json['resultadoConfirmado'] == true,
      minhaInscricao: myEntry,
      inscricoes: entries,
    );
  }
}

class EventEntry {
  final int id;
  final int receitaId;
  final String receitaTitulo;
  final String receitaDescricao;
  final String? receitaImagem;
  final int receitaTempo;
  final String receitaDificuldade;
  final Recipe? receitaCompleta;
  final int usuarioId;
  final String usuarioNome;
  final String? usuarioFoto;
  final String? usuarioMoldura;
  final bool usuarioIsPro;
  final int totalVotos;
  final bool jaVotei;
  final int? posicao;
  final String statusModeracao;
  final int denunciasCount;

  const EventEntry({
    required this.id,
    required this.receitaId,
    required this.receitaTitulo,
    this.receitaDescricao = '',
    this.receitaImagem,
    this.receitaTempo = 30,
    this.receitaDificuldade = 'Médio',
    this.receitaCompleta,
    required this.usuarioId,
    required this.usuarioNome,
    this.usuarioFoto,
    this.usuarioMoldura,
    this.usuarioIsPro = false,
    this.totalVotos = 0,
    this.jaVotei = false,
    this.posicao,
    this.statusModeracao = 'APROVADA',
    this.denunciasCount = 0,
  });

  factory EventEntry.fromJson(Map<String, dynamic> json, {int? meuVotoEntradaId}) {
    final r = json['receita'] is Map<String, dynamic>
        ? json['receita'] as Map<String, dynamic>
        : null;
    final u = json['usuario'] is Map<String, dynamic>
        ? json['usuario'] as Map<String, dynamic>
        : null;
    final entryId = _toInt(json['id'] ?? 0);
    final rawFoto = (u?['foto'] ?? u?['fotoPerfil'] ?? json['usuarioFoto'])?.toString();
    final rawRecImg = (r?['imagem'] ?? r?['image'] ?? json['imagem'])?.toString();

    Recipe? fullRecipe;
    if (r != null) {
      final merged = Map<String, dynamic>.from(r);
      if (u != null && merged['usuario'] == null) {
        merged['usuario'] = u;
      }
      fullRecipe = Recipe.fromJson(merged);
    }

    return EventEntry(
      id: entryId,
      receitaId: _toInt(json['receitaId'] ?? r?['id'] ?? 0),
      receitaTitulo:
          (r?['titulo'] ?? r?['title'] ?? json['receitaTitulo'] ?? json['titulo'] ?? 'Receita Inscrita')
              .toString(),
      receitaDescricao: (r?['descricao'] ?? r?['description'] ?? '').toString(),
      receitaImagem:
          (rawRecImg != null && rawRecImg.isNotEmpty && rawRecImg != 'null') ? rawRecImg : null,
      receitaTempo: _toInt(r?['tempoPreparo'] ?? 30),
      receitaDificuldade: (r?['dificuldade'] ?? 'Médio').toString(),
      receitaCompleta: fullRecipe,
      usuarioId: _toInt(json['usuarioId'] ?? u?['id'] ?? 0),
      usuarioNome: (u?['nome'] ?? json['usuarioNome'] ?? 'Chef Saboré').toString(),
      usuarioFoto: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      usuarioMoldura: (u?['molduraAtiva'] ?? json['usuarioMoldura'])?.toString(),
      usuarioIsPro: u?['plano'] == 'PRO',
      totalVotos: _toInt(
        json['votosCount'] ?? json['totalVotos'] ?? json['votos'] ?? json['_count']?['votos'] ?? 0,
      ),
      jaVotei: (meuVotoEntradaId != null && meuVotoEntradaId == entryId) ||
          json['jaVotei'] == true ||
          json['votado'] == true,
      posicao: (json['posicaoFinal'] ?? json['posicao']) != null
          ? _toInt(json['posicaoFinal'] ?? json['posicao'])
          : null,
      statusModeracao: (json['statusModeracao'] ?? 'APROVADA').toString(),
      denunciasCount: _toInt(json['denunciasCount'] ?? 0),
    );
  }
}

class ChefProfile {
  final int id;
  final String nome;
  final String email;
  final String? fotoPerfil;
  final String? molduraAtiva;
  final bool isPro;
  final int seguidoresCount;
  final int seguindoCount;
  final int totalReceitas;
  final int totalAvaliacoes;
  final bool seguindo;
  final bool seguindoVoce;
  final List<Recipe> receitasPublicas;
  final List<Map<String, dynamic>> conquistas;

  const ChefProfile({
    required this.id,
    required this.nome,
    this.email = '',
    this.fotoPerfil,
    this.molduraAtiva,
    this.isPro = false,
    this.seguidoresCount = 0,
    this.seguindoCount = 0,
    this.totalReceitas = 0,
    this.totalAvaliacoes = 0,
    this.seguindo = false,
    this.seguindoVoce = false,
    this.receitasPublicas = const [],
    this.conquistas = const [],
  });

  factory ChefProfile.fromJson(Map<String, dynamic> json) {
    List<Recipe> recs = [];
    final rawRecs = json['receitas'] ??
        (json['receitasPublicas'] is List ? json['receitasPublicas'] : null);
    if (rawRecs is List) {
      recs = rawRecs
          .whereType<Map<String, dynamic>>()
          .map((e) => Recipe.fromJson(e))
          .toList();
    }
    List<Map<String, dynamic>> conqs = [];
    if (json['conquistas'] is List) {
      conqs = (json['conquistas'] as List).whereType<Map<String, dynamic>>().toList();
    }
    final rawFoto = (json['foto'] ?? json['fotoPerfil'] ?? json['avatar'])?.toString();
    final recCount = _toInt(
      (json['receitasPublicas'] is int ? json['receitasPublicas'] : null) ??
          json['totalReceitas'] ??
          json['_count']?['receitas'] ??
          recs.length,
    );

    return ChefProfile(
      id: _toInt(json['id'] ?? 0),
      nome: (json['nome'] ?? 'Chef Saboré').toString(),
      email: (json['email'] ?? '').toString(),
      fotoPerfil: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      molduraAtiva: json['molduraAtiva']?.toString(),
      isPro: json['plano'] == 'PRO' || json['isPro'] == true,
      seguidoresCount: _toInt(
        json['seguidores'] ??
            json['seguidoresCount'] ??
            json['totalSeguidores'] ??
            json['_count']?['seguidores'] ??
            0,
      ),
      seguindoCount: _toInt(
        (json['seguindo'] is int ? json['seguindo'] : null) ??
            json['seguindoCount'] ??
            json['totalSeguindo'] ??
            json['_count']?['seguindo'] ??
            0,
      ),
      totalReceitas: recCount,
      totalAvaliacoes: _toInt(json['totalAvaliacoes'] ?? 0),
      seguindo: json['voceSegue'] == true ||
          (json['seguindo'] is bool && json['seguindo'] == true) ||
          json['isFollowing'] == true,
      seguindoVoce: json['seguindoVoce'] == true,
      receitasPublicas: recs,
      conquistas: conqs,
    );
  }
}

class RankingEntry {
  final int posicao;
  final int usuarioId;
  final String nome;
  final String? fotoPerfil;
  final String? molduraAtiva;
  final String plano;
  final int pontos;
  final int totalAtividades;
  final bool naZonaPro;

  const RankingEntry({
    required this.posicao,
    required this.usuarioId,
    required this.nome,
    this.fotoPerfil,
    this.molduraAtiva,
    this.plano = 'FREE',
    required this.pontos,
    this.totalAtividades = 0,
    this.naZonaPro = false,
  });

  factory RankingEntry.fromJson(Map<String, dynamic> json, int index) {
    final u = json['usuario'] is Map<String, dynamic>
        ? json['usuario'] as Map<String, dynamic>
        : null;
    final pos = _toInt(json['posicao'] ?? (index + 1));
    final rawFoto =
        (json['foto'] ?? json['fotoPerfil'] ?? u?['foto'] ?? u?['fotoPerfil'])?.toString();
    return RankingEntry(
      posicao: pos,
      usuarioId: _toInt(json['usuarioId'] ?? json['id'] ?? u?['id'] ?? 0),
      nome: (json['nome'] ?? u?['nome'] ?? 'Chef Saboré').toString(),
      fotoPerfil: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      molduraAtiva: (json['molduraAtiva'] ?? u?['molduraAtiva'])?.toString(),
      plano: (json['plano'] ?? u?['plano'] ?? 'FREE').toString(),
      pontos: _toInt(json['pontos'] ?? json['totalPontos'] ?? json['pontuacao'] ?? 0),
      totalAtividades: _toInt(
        json['totalAcoes'] ?? json['totalAtividades'] ?? json['atividades'] ?? 0,
      ),
      naZonaPro: json['naZonaPro'] == true || pos <= 5,
    );
  }
}

class EngagementActivity {
  final int id;
  final String tipo;
  final String descricao;
  final int pontos;
  final String criadoEm;

  const EngagementActivity({
    required this.id,
    required this.tipo,
    required this.descricao,
    required this.pontos,
    required this.criadoEm,
  });

  factory EngagementActivity.fromJson(Map<String, dynamic> json) {
    return EngagementActivity(
      id: _toInt(json['id'] ?? 0),
      tipo: (json['acao'] ?? json['tipo'] ?? 'ATIVIDADE').toString(),
      descricao: (json['acaoFormatada'] ??
              json['descricao'] ??
              json['detalhe'] ??
              json['acao'] ??
              json['tipo'] ??
              'Atividade na comunidade')
          .toString(),
      pontos: _toInt(json['pontos'] ?? 0),
      criadoEm: (json['data'] ?? json['criadoEm'] ?? json['createdAt'] ?? '').toString(),
    );
  }
}

class IaConsumption {
  final bool isPro;
  final String plano;
  final int chatUsados;
  final int chatLimite;
  final int chatRestantes;
  final int fotoUsados;
  final int fotoLimite;
  final int fotoRestantes;
  final int videoUsados;
  final int videoLimite;
  final int videoRestantes;
  final String proximaRenovacaoTexto;

  const IaConsumption({
    this.isPro = false,
    this.plano = 'FREE',
    this.chatUsados = 0,
    this.chatLimite = 5,
    this.chatRestantes = 5,
    this.fotoUsados = 0,
    this.fotoLimite = 2,
    this.fotoRestantes = 2,
    this.videoUsados = 0,
    this.videoLimite = 2,
    this.videoRestantes = 2,
    this.proximaRenovacaoTexto = '',
  });

  factory IaConsumption.fromJson(Map<String, dynamic> json) {
    final isPro = json['ilimitado'] == true ||
        json['isPro'] == true ||
        (json['plano'] ?? '').toString().toUpperCase() == 'PRO';

    final chatObj =
        json['chat'] is Map<String, dynamic> ? json['chat'] as Map<String, dynamic> : null;
    final fotoObj =
        json['foto'] is Map<String, dynamic> ? json['foto'] as Map<String, dynamic> : null;
    final videoObj =
        json['video'] is Map<String, dynamic> ? json['video'] as Map<String, dynamic> : null;

    final cLim = _toInt(
      json['limiteMensalChat'] ?? chatObj?['limite'] ?? json['limiteMensal'] ?? json['chatLimite'] ?? 5,
    );
    final cUse = _toInt(
      json['totalChatMes'] ?? chatObj?['usados'] ?? json['usadosNoMes'] ?? json['chatUsados'] ?? 0,
    );
    final cRest = _toInt(
      json['restantesChat'] ?? chatObj?['restantes'] ?? json['restantes'] ?? (cLim - cUse).clamp(0, 999),
    );

    final fLim = _toInt(
      json['limiteMensalImagem'] ?? fotoObj?['limite'] ?? json['fotoLimite'] ?? 2,
    );
    final fUse = _toInt(
      json['totalImagemMes'] ?? fotoObj?['usados'] ?? json['fotoUsados'] ?? 0,
    );
    final fRest = _toInt(
      json['restantesImagem'] ?? fotoObj?['restantes'] ?? json['fotoRestantes'] ?? (fLim - fUse).clamp(0, 999),
    );

    final vLim = _toInt(
      json['limiteMensalVideo'] ?? videoObj?['limite'] ?? json['videoLimite'] ?? 2,
    );
    final vUse = _toInt(
      json['totalVideoMes'] ?? videoObj?['usados'] ?? json['videoUsados'] ?? 0,
    );
    final vRest = _toInt(
      json['restantesVideo'] ?? videoObj?['restantes'] ?? json['videoRestantes'] ?? (vLim - vUse).clamp(0, 999),
    );

    final renov = json['proximaRenovacao'] is Map<String, dynamic>
        ? (json['proximaRenovacao']['texto'] ?? '').toString()
        : '';

    return IaConsumption(
      isPro: isPro,
      plano: isPro ? 'PRO' : 'FREE',
      chatUsados: cUse,
      chatLimite: cLim,
      chatRestantes: isPro ? 999 : cRest,
      fotoUsados: fUse,
      fotoLimite: fLim,
      fotoRestantes: isPro ? 999 : fRest,
      videoUsados: vUse,
      videoLimite: vLim,
      videoRestantes: isPro ? 999 : vRest,
      proximaRenovacaoTexto: renov,
    );
  }
}

class DetectedIngredient {
  final String nome;
  final int confianca;

  const DetectedIngredient({required this.nome, required this.confianca});

  factory DetectedIngredient.fromDynamic(dynamic raw) {
    if (raw is Map<String, dynamic>) {
      return DetectedIngredient(
        nome: (raw['name'] ?? raw['nome'] ?? raw['ingrediente'] ?? raw['item'] ?? 'Ingrediente')
            .toString(),
        confianca: _toInt(
          raw['percent'] ?? raw['confianca'] ?? raw['probabilidade'] ?? raw['confidence'] ?? 92,
        ).clamp(1, 100),
      );
    }
    return DetectedIngredient(nome: raw.toString(), confianca: 90);
  }
}

class PhotoAnalysisResult {
  final String pratoIdentificado;
  final String descricao;
  final List<DetectedIngredient> ingredientes;
  final String tempoEstimado;
  final String dificuldadeEstimada;
  final Recipe? receitaSugerida;

  const PhotoAnalysisResult({
    required this.pratoIdentificado,
    this.descricao = '',
    this.ingredientes = const [],
    this.tempoEstimado = '35 min',
    this.dificuldadeEstimada = 'Médio',
    this.receitaSugerida,
  });

  factory PhotoAnalysisResult.fromJson(Map<String, dynamic> json) {
    final data = json['analise'] is Map<String, dynamic>
        ? json['analise'] as Map<String, dynamic>
        : (json['dados'] is Map<String, dynamic>
            ? json['dados'] as Map<String, dynamic>
            : json);

    List<DetectedIngredient> ings = [];
    final rawIngs = data['detections'] ??
        data['ingredientes'] ??
        data['ingredientesDetectados'] ??
        [];
    if (rawIngs is List) {
      ings = rawIngs.map((e) => DetectedIngredient.fromDynamic(e)).toList();
    }

    Recipe? rec;
    if (json['receita'] is Map<String, dynamic>) {
      rec = Recipe.fromJson(json['receita'] as Map<String, dynamic>);
    } else if (data['modoPreparo'] != null || data['steps'] != null) {
      rec = Recipe.fromJson(data);
    }

    return PhotoAnalysisResult(
      pratoIdentificado: (data['dishName'] ??
              data['title'] ??
              data['pratoIdentificado'] ??
              data['prato'] ??
              data['titulo'] ??
              'Prato Identificado')
          .toString(),
      descricao: (data['title'] ?? data['descricao'] ?? data['resumo'] ?? '').toString(),
      ingredientes: ings,
      tempoEstimado: '${data['tempoPreparo'] ?? data['tempoEstimado'] ?? 35} min',
      dificuldadeEstimada: (data['dificuldade'] ?? 'Médio').toString(),
      receitaSugerida: rec,
    );
  }
}

class AppNotification {
  final String id;
  final String tipo; // 'SEGUIDOR', 'COMENTARIO', 'AVALIACAO', 'DESAFIO', 'PRO', 'CURTIDA'
  final String titulo;
  final String mensagem;
  final String criadaEm;
  final int? remetenteId;
  final String? remetenteNome;
  final String? remetenteFoto;
  final int? receitaId;
  final String? receitaTitulo;
  bool lida;

  AppNotification({
    required this.id,
    required this.tipo,
    this.titulo = '',
    required this.mensagem,
    required this.criadaEm,
    this.remetenteId,
    this.remetenteNome,
    this.remetenteFoto,
    this.receitaId,
    this.receitaTitulo,
    this.lida = false,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final rem = json['remetente'] is Map<String, dynamic>
        ? json['remetente'] as Map<String, dynamic>
        : (json['usuario'] is Map<String, dynamic>
            ? json['usuario'] as Map<String, dynamic>
            : null);
    final rec = json['receita'] is Map<String, dynamic>
        ? json['receita'] as Map<String, dynamic>
        : null;
    final rawFoto = (json['foto'] ??
            rem?['foto'] ??
            rem?['fotoPerfil'] ??
            json['remetenteFoto'])
        ?.toString();

    return AppNotification(
      id: (json['id'] ??
              '${json['tipo']}_${json['createdAt'] ?? json['criadaEm'] ?? DateTime.now().millisecondsSinceEpoch}')
          .toString(),
      tipo: (json['tipo'] ?? 'INTERACAO').toString().toUpperCase(),
      titulo: (json['titulo'] ?? '').toString(),
      mensagem: (json['texto'] ?? json['mensagem'] ?? 'Nova interação no seu perfil').toString(),
      criadaEm: (json['createdAt'] ?? json['criadaEm'] ?? json['data'] ?? '').toString(),
      remetenteId: rem?['id'] != null
          ? _toInt(rem!['id'])
          : (json['usuarioId'] != null
              ? _toInt(json['usuarioId'])
              : (json['remetenteId'] != null ? _toInt(json['remetenteId']) : null)),
      remetenteNome: rem?['nome']?.toString() ?? json['remetenteNome']?.toString(),
      remetenteFoto: (rawFoto != null && rawFoto.isNotEmpty && rawFoto != 'null') ? rawFoto : null,
      receitaId: rec?['id'] != null
          ? _toInt(rec!['id'])
          : (json['receitaId'] != null ? _toInt(json['receitaId']) : null),
      receitaTitulo: rec?['titulo']?.toString() ?? json['receitaTitulo']?.toString(),
      lida: json['lida'] == true,
    );
  }
}

class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final String timestamp;
  final Recipe? recipe;

  const ChatMessage({
    required this.id,
    required this.isUser,
    required this.text,
    required this.timestamp,
    this.recipe,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'isUser': isUser,
        'text': text,
        'timestamp': timestamp,
        if (recipe != null)
          'recipe': {
            'id': recipe!.id,
            'titulo': recipe!.titulo,
            'descricao': recipe!.descricao,
            'modoPreparo': recipe!.modoPreparo,
            'tempoPreparo': recipe!.tempoPreparo,
            'porcoes': recipe!.porcoes,
            'dificuldade': recipe!.dificuldade,
            'categoria': recipe!.categoria,
            'ingredientes': recipe!.ingredientes.map((i) => i.toJson()).toList(),
          },
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    Recipe? rec;
    if (json['recipe'] is Map<String, dynamic>) {
      rec = Recipe.fromJson(json['recipe'] as Map<String, dynamic>);
    }
    return ChatMessage(
      id: (json['id'] ?? '').toString(),
      isUser: json['isUser'] == true,
      text: (json['text'] ?? '').toString(),
      timestamp: (json['timestamp'] ?? '').toString(),
      recipe: rec,
    );
  }
}

int _toInt(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is double) return v.round();
  return int.tryParse(v.toString()) ?? 0;
}

double _toDouble(dynamic v) {
  if (v == null) return 0.0;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  return double.tryParse(v.toString()) ?? 0.0;
}
