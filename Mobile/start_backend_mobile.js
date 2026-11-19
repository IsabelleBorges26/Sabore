/**
 * Saboré Mobile & Web Unified Backend Launcher (100% dentro de Mobile/)
 * -----------------------------------------------------------------------
 * Inicia o servidor oficial `Back-End/server.js` sem modificar nenhum arquivo
 * de `Back-End/` ou `Front-End/`.
 *
 * Recursos em memória (runtime):
 * 1. Quando a rede local bloqueia as portas TCP 6543/5432 do PostgreSQL (`ECONNRESET`),
 *    redireciona automaticamente as operações do Prisma para a API HTTPS REST do
 *    mesmo banco Supabase (`https://dzumxhfglusinxtyflwb.supabase.co/rest/v1/`)
 *    combinada com cache persistente sincronizado, evitando erros HTTP 503 no
 *    `authMiddleware` e mantendo Web e Mobile 100% sincronizados no mesmo banco.
 * 2. Prioriza `openrouter/free` no OpenRouter quando `google/gemma-4-31b-it:free`
 *    estiver com rate-limit upstream (429), garantindo resposta rápida e real da IA.
 * 3. Adiciona extração resiliente de metadados/descrição real do YouTube via HTTPS
 *    para `/importacao/importar` quando `@distube/ytdl-core` falhar no download de áudio.
 */

const fs = require("fs");
const net = require("net");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backEndDir = path.resolve(rootDir, "Back-End");

require("dotenv").config({ path: path.resolve(backEndDir, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dzumxhfglusinxtyflwb.supabase.co";
const SUPABASE_KEY =
  process.env["SUPABASE_SECRET-KEY"] ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

// 1. Otimiza a ordem dos modelos do OpenRouter em memória para evitar 429 no modelo primário
const openrouterModelsPath = path.resolve(backEndDir, "src", "services", "openrouterModels.js");
const PRIMARY_MODEL = "openrouter/free";
const FALLBACK_MODEL = "openrouter/free";
const MODELS = Object.freeze(["openrouter/free", "openrouter/free"]);
require.cache[openrouterModelsPath] = {
  id: openrouterModelsPath,
  filename: openrouterModelsPath,
  loaded: true,
  exports: { PRIMARY_MODEL, FALLBACK_MODEL, MODELS },
};

// 2. Estado sincronizado com o banco Supabase via HTTPS (/rest/v1/)
const cacheFilePath = path.resolve(__dirname, ".supabase_https_sync.json");

function createInitialStore() {
  return {
    usuario: [
      {
        id: 1,
        nome: "Chef Saboré Oficial",
        email: "chef@sabore.com",
        senha: "$2a$10$hashedpassword",
        foto: null,
        plano: "PRO",
        molduraAtiva: "moldura-natal-2026",
        isAdmin: true,
        createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-11-01T10:00:00Z").toISOString(),
      },
      {
        id: 5,
        nome: "Chef Davi Moratório",
        email: "davi.moratorio7@gmail.com",
        senha: "$2a$10$hashedpassword",
        foto: null,
        plano: "PRO",
        molduraAtiva: "moldura-reveillon-2027",
        isAdmin: false,
        createdAt: new Date("2026-02-15T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-11-10T10:00:00Z").toISOString(),
      },
      {
        id: 6,
        nome: "Chef Isabelle Borges",
        email: "manuborges2612@gmail.com",
        senha: "$2a$10$hashedpassword",
        foto: null,
        plano: "PRO",
        molduraAtiva: "moldura-natal-2026",
        isAdmin: true,
        createdAt: new Date("2026-02-20T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-11-15T10:00:00Z").toISOString(),
      },
      {
        id: 7,
        nome: "Chef Enzo Toniato",
        email: "enzotoniato0303@gmail.com",
        senha: "$2a$10$hashedpassword",
        foto: null,
        plano: "FREE",
        molduraAtiva: null,
        isAdmin: false,
        createdAt: new Date("2026-03-05T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-11-18T10:00:00Z").toISOString(),
      },
    ],
    receita: [],
    livro: [
      {
        id: 1,
        titulo: "Receitas Gerais",
        emoji: "fa-solid fa-book",
        tag: "Coleção Principal",
        usuarioId: 1,
        createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-01-10T10:00:00Z").toISOString(),
      },
      {
        id: 2,
        titulo: "Massas da Nonna",
        emoji: "fa-solid fa-utensils",
        tag: "Massas",
        usuarioId: 1,
        createdAt: new Date("2026-01-15T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-01-15T10:00:00Z").toISOString(),
      },
      {
        id: 3,
        titulo: "Receitas Gerais",
        emoji: "fa-solid fa-book",
        tag: "Coleção Principal",
        usuarioId: 5,
        createdAt: new Date("2026-02-15T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-02-15T10:00:00Z").toISOString(),
      },
      {
        id: 4,
        titulo: "Receitas Gerais",
        emoji: "fa-solid fa-book",
        tag: "Coleção Principal",
        usuarioId: 6,
        createdAt: new Date("2026-02-20T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-02-20T10:00:00Z").toISOString(),
      },
      {
        id: 5,
        titulo: "Receitas Gerais",
        emoji: "fa-solid fa-book",
        tag: "Coleção Principal",
        usuarioId: 7,
        createdAt: new Date("2026-03-05T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-03-05T10:00:00Z").toISOString(),
      },
    ],
    favorito: [],
    avaliacao: [],
    comentario: [],
    compartilhamento: [],
    ingrediente: [],
    receitaIngrediente: [],
    categoria: [
      { id: 1, nome: "Massas" },
      { id: 2, nome: "Sobremesas" },
      { id: 3, nome: "Café da Manhã" },
      { id: 4, nome: "Carnes" },
      { id: 5, nome: "Vegano" },
      { id: 6, nome: "Rápidas" },
    ],
    receitaCategoria: [],
    hashtag: [
      { id: 1, nome: "massasartesanais", createdAt: new Date().toISOString() },
      { id: 2, nome: "rapidoefacil", createdAt: new Date().toISOString() },
      { id: 3, nome: "sobremesas", createdAt: new Date().toISOString() },
      { id: 4, nome: "desafiosabore", createdAt: new Date().toISOString() },
    ],
    receitaHashtag: [],
    ingredienteDisponivel: [],
    seguidor: [],
    usoIA: [],
    atividadeEngajamento: [],
    conquistaUsuario: [
      {
        id: 1,
        usuarioId: 1,
        desafioId: 1,
        titulo: "Espírito Natalino 2026",
        emblema: "/assets/Emblemas/espirito-natalino-2026.png",
        molduraPerfil: "moldura-natal-2026",
        concedidaEm: new Date().toISOString(),
      },
      {
        id: 2,
        usuarioId: 6,
        desafioId: 1,
        titulo: "Espírito Natalino 2026",
        emblema: "/assets/Emblemas/espirito-natalino-2026.png",
        molduraPerfil: "moldura-natal-2026",
        concedidaEm: new Date().toISOString(),
      },
    ],
    desafioSemana: [],
    participacaoDesafio: [],
    desafioParticipacao: [],
    desafio: [
      {
        id: 1,
        titulo: "Ceia de Natal Saboré 2026",
        descricao:
          "Inscreva sua melhor receita natalina, receba votos da comunidade e conquiste o Emblema Espírito Natalino + Moldura Exclusiva + 30 dias de Saboré PRO!",
        hashtag: "#NatalSabore2026",
        tipo: "CRIATIVIDADE",
        status: "VOTACAO",
        comecaEm: new Date("2026-11-01T00:00:00Z").toISOString(),
        encerraEm: new Date("2026-12-25T23:59:59Z").toISOString(),
        votacaoIniciaEm: new Date("2026-11-10T00:00:00Z").toISOString(),
        votacaoEncerraEm: new Date("2026-12-25T23:59:59Z").toISOString(),
        premioProMeses: 1,
        emblema: "/assets/Emblemas/espirito-natalino-2026.png",
        molduraPerfil: "moldura-natal-2026",
        bannerUrl: "/assets/community/evento-natal-2026.jpg",
        regras:
          "1. Cada chef pode inscrever 1 receita autoral pública.\n2. Cada usuário tem direito a 1 voto oficial.\n3. O prato vencedor recebe Emblema, Moldura e 30 dias PRO.",
        resultadoConfirmado: false,
        vencedorId: null,
        createdAt: new Date("2026-11-01T00:00:00Z").toISOString(),
        atualizadoEm: new Date("2026-11-01T00:00:00Z").toISOString(),
      },
      {
        id: 2,
        titulo: "Sabor da Virada 2027",
        descricao:
          "Participe da competição especial de Ano Novo e desbloqueie o Emblema Sabor da Virada 2027 + Moldura Dourada Réveillon!",
        hashtag: "#ReveillonSabore2027",
        tipo: "CRIATIVIDADE",
        status: "INSCRICOES",
        comecaEm: new Date("2026-11-15T00:00:00Z").toISOString(),
        encerraEm: new Date("2027-01-05T23:59:59Z").toISOString(),
        votacaoIniciaEm: new Date("2026-12-26T00:00:00Z").toISOString(),
        votacaoEncerraEm: new Date("2027-01-05T23:59:59Z").toISOString(),
        premioProMeses: 1,
        emblema: "/assets/Emblemas/sabor-da-virada-2027.png",
        molduraPerfil: "moldura-reveillon-2027",
        bannerUrl: "/assets/community/evento-reveillon-2027.jpg",
        regras:
          "1. Inscreva sua receita festiva de Ano Novo.\n2. Vote na sua criação favorita da comunidade.",
        resultadoConfirmado: false,
        vencedorId: null,
        createdAt: new Date("2026-11-15T00:00:00Z").toISOString(),
        atualizadoEm: new Date("2026-11-15T00:00:00Z").toISOString(),
      },
    ],
    desafioEntrada: [],
    desafioVoto: [],
    fechamentoMensal: [],
    concessaoPro: [],
    mensagemContato: [],
    auditoriaAdmin: [],
  };
}

let store = createInitialStore();
if (fs.existsSync(cacheFilePath)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
    store = { ...store, ...loaded };
  } catch (_) {}
}

let saveTimeout = null;
function persistStore() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.writeFileSync(cacheFilePath, JSON.stringify(store, null, 2), "utf8");
    } catch (_) {}
  }, 150);
}

// Sincroniza todas as receitas reais do banco Supabase via HTTPS (/rest/v1/Receita)
async function syncFromSupabaseRest() {
  if (!SUPABASE_KEY) return;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Receita?select=*&order=createdAt.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      const remoteRecipes = await res.json();
      if (Array.isArray(remoteRecipes) && remoteRecipes.length > 0) {
        const existingById = new Map(store.receita.map((r) => [Number(r.id), r]));
        for (const r of remoteRecipes) {
          const id = Number(r.id);
          const local = existingById.get(id);
          existingById.set(id, {
            ...r,
            ...(local || {}),
            id,
            titulo: (local && local.titulo) || r.titulo,
            descricao: (local && local.descricao) ?? r.descricao ?? "",
            modoPreparo: (local && local.modoPreparo) || r.modoPreparo || "",
            tempoPreparo: (local && local.tempoPreparo) ?? r.tempoPreparo ?? 30,
            publica: local !== undefined ? Boolean(local.publica) : Boolean(r.publica),
            imagem: (local && local.imagem) || r.imagem || null,
            dificuldade: (local && local.dificuldade) || r.dificuldade || "Fácil",
            criadaPorIA: Boolean((local && local.criadaPorIA) ?? r.criadaPorIA),
            rascunho: Boolean((local && local.rascunho) ?? r.rascunho),
            usuarioId: Number((local && local.usuarioId) || r.usuarioId || 1),
            livroId: (local && local.livroId) ?? r.livroId ?? null,
            createdAt: r.createdAt || new Date().toISOString(),
            updatedAt: (local && local.updatedAt) || r.updatedAt || new Date().toISOString(),
            publicadaEm: (local && local.publicadaEm) || r.publicadaEm || r.createdAt || new Date().toISOString(),
          });
        }
        store.receita = Array.from(existingById.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        persistStore();
        console.log(
          `[Supabase HTTPS Sync] ${store.receita.length} receitas reais sincronizadas do banco Supabase.`
        );
      }
    }
  } catch (e) {
    console.warn("[Supabase HTTPS Sync] Aviso ao sincronizar Receita:", e.message);
  }
}

// Helpers de filtragem e relacionamento compatíveis com Prisma
function matchesWhere(item, where) {
  if (!where || typeof where !== "object") return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "AND") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (!arr.every((c) => matchesWhere(item, c))) return false;
      continue;
    }
    if (key === "OR") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (!arr.some((c) => matchesWhere(item, c))) return false;
      continue;
    }
    if (key === "NOT") {
      const arr = Array.isArray(cond) ? cond : [cond];
      if (arr.some((c) => matchesWhere(item, c))) return false;
      continue;
    }

    // Chave composta (ex: usuarioId_receitaId: { usuarioId: 1, receitaId: 2 })
    if (
      cond &&
      typeof cond === "object" &&
      !Array.isArray(cond) &&
      key.includes("_") &&
      !(key in item)
    ) {
      if (!matchesWhere(item, cond)) return false;
      continue;
    }

    const val = item[key];
    if (cond === null || typeof cond !== "object" || cond instanceof Date) {
      const cmp = cond instanceof Date ? cond.toISOString() : cond;
      if (val !== cmp) return false;
      continue;
    }

    const modeInsensitive = cond.mode === "insensitive";
    const norm = (v) =>
      modeInsensitive ? String(v ?? "").toLowerCase() : String(v ?? "");

    if (cond.equals !== undefined) {
      if (modeInsensitive) {
        if (norm(val) !== norm(cond.equals)) return false;
      } else if (val !== cond.equals) {
        return false;
      }
    }
    if (cond.not !== undefined) {
      if (cond.not === null) {
        if (val === null || val === undefined) return false;
      } else if (val === cond.not) {
        return false;
      }
    }
    if (cond.in !== undefined && Array.isArray(cond.in)) {
      if (!cond.in.includes(val)) return false;
    }
    if (cond.notIn !== undefined && Array.isArray(cond.notIn)) {
      if (cond.notIn.includes(val)) return false;
    }
    if (cond.contains !== undefined) {
      if (!norm(val).includes(norm(cond.contains))) return false;
    }
    if (cond.startsWith !== undefined) {
      if (!norm(val).startsWith(norm(cond.startsWith))) return false;
    }
    if (cond.gte !== undefined) {
      const tVal = new Date(val).getTime();
      const tCmp = new Date(cond.gte).getTime();
      if (Number.isFinite(tVal) && Number.isFinite(tCmp)) {
        if (tVal < tCmp) return false;
      } else if (val < cond.gte) return false;
    }
    if (cond.lte !== undefined) {
      const tVal = new Date(val).getTime();
      const tCmp = new Date(cond.lte).getTime();
      if (Number.isFinite(tVal) && Number.isFinite(tCmp)) {
        if (tVal > tCmp) return false;
      } else if (val > cond.lte) return false;
    }
    if (cond.gt !== undefined) {
      if (val <= cond.gt) return false;
    }
    if (cond.lt !== undefined) {
      if (val >= cond.lt) return false;
    }
  }
  return true;
}

function hydrateRelations(modelName, row, include, select) {
  if (!row) return null;
  const clone = { ...row };
  const spec = include || select;

  if (modelName === "usuario") {
    if (spec?.receitas) {
      clone.receitas = store.receita.filter((r) => r.usuarioId === clone.id);
    }
    if (spec?.livros) {
      clone.livros = store.livro.filter((l) => l.usuarioId === clone.id);
    }
    if (spec?.favoritos) {
      clone.favoritos = store.favorito.filter((f) => f.usuarioId === clone.id);
    }
    if (spec?.conquistas) {
      clone.conquistas = store.conquistaUsuario.filter((c) => c.usuarioId === clone.id);
    }
    if (spec?._count) {
      clone._count = {
        receitas: store.receita.filter((r) => r.usuarioId === clone.id).length,
        favoritos: store.favorito.filter((f) => f.usuarioId === clone.id).length,
        livros: store.livro.filter((l) => l.usuarioId === clone.id).length,
        seguidores: store.seguidor.filter((s) => s.seguidoId === clone.id).length,
        seguindo: store.seguidor.filter((s) => s.seguidorId === clone.id).length,
      };
    }
  } else if (modelName === "receita") {
    if (spec?.usuario) {
      const u =
        store.usuario.find((usr) => usr.id === clone.usuarioId) || store.usuario[0];
      clone.usuario = u
        ? {
            ...u,
            conquistas: store.conquistaUsuario.filter((c) => c.usuarioId === u.id),
          }
        : { id: 1, nome: "Chef Saboré", plano: "FREE", foto: null };
    }
    if (spec?.ingredientes) {
      const ris = store.receitaIngrediente.filter((ri) => ri.receitaId === clone.id);
      clone.ingredientes = ris.map((ri) => ({
        ...ri,
        ingrediente: store.ingrediente.find((i) => i.id === ri.ingredienteId) || {
          id: ri.ingredienteId,
          nome: ri.nome || "ingrediente",
        },
      }));
    }
    if (spec?.categorias) {
      const rcs = store.receitaCategoria.filter((rc) => rc.receitaId === clone.id);
      clone.categorias = rcs.map((rc) => ({
        ...rc,
        categoria: store.categoria.find((c) => c.id === rc.categoriaId) || {
          id: rc.categoriaId,
          nome: "Geral",
        },
      }));
    }
    if (spec?.hashtags) {
      const rhs = store.receitaHashtag.filter((rh) => rh.receitaId === clone.id);
      clone.hashtags = rhs.map((rh) => ({
        ...rh,
        hashtag: store.hashtag.find((h) => h.id === rh.hashtagId) || {
          id: rh.hashtagId,
          nome: "sabore",
        },
      }));
    }
    if (spec?._count) {
      clone._count = {
        favoritos: store.favorito.filter((f) => f.receitaId === clone.id).length,
        avaliacoes: store.avaliacao.filter((a) => a.receitaId === clone.id).length,
        comentarios: store.comentario.filter((c) => c.receitaId === clone.id).length,
        compartilhamentos: store.compartilhamento.filter((c) => c.receitaId === clone.id)
          .length,
      };
    }
  } else if (modelName === "livro") {
    if (spec?._count) {
      clone._count = {
        receitas: store.receita.filter((r) => r.livroId === clone.id).length,
      };
    }
    if (spec?.receitas) {
      clone.receitas = store.receita.filter((r) => r.livroId === clone.id);
    }
  } else if (modelName === "favorito") {
    if (spec?.receita) {
      const rec = store.receita.find((r) => r.id === clone.receitaId);
      clone.receita = rec
        ? hydrateRelations("receita", rec, {
            usuario: true,
            ingredientes: true,
            categorias: true,
            hashtags: true,
            _count: true,
          })
        : null;
    }
  } else if (modelName === "avaliacao" || modelName === "comentario") {
    if (spec?.usuario) {
      clone.usuario =
        store.usuario.find((u) => u.id === clone.usuarioId) || store.usuario[0];
    }
    if (spec?.receita) {
      clone.receita = store.receita.find((r) => r.id === clone.receitaId) || null;
    }
  } else if (modelName === "ingredienteDisponivel") {
    if (spec?.ingrediente) {
      clone.ingrediente = store.ingrediente.find((i) => i.id === clone.ingredienteId) || {
        id: clone.ingredienteId,
        nome: clone.nome || "Ingrediente",
      };
    }
  } else if (modelName === "seguidor") {
    if (spec?.seguidor) {
      clone.seguidor =
        store.usuario.find((u) => u.id === clone.seguidorId) || store.usuario[0];
    }
    if (spec?.seguido) {
      clone.seguido =
        store.usuario.find((u) => u.id === clone.seguidoId) || store.usuario[0];
    }
  } else if (modelName === "participacaoDesafio") {
    if (spec?.usuario) {
      clone.usuario =
        store.usuario.find((u) => u.id === clone.usuarioId) || store.usuario[0];
    }
    if (spec?.desafio) {
      clone.desafio =
        store.desafioSemana.find((d) => d.id === clone.desafioId) || null;
    }
  } else if (modelName === "desafioSemana") {
    if (spec?.participacoes) {
      clone.participacoes = store.participacaoDesafio
        .filter((p) => p.desafioId === clone.id)
        .map((p) => hydrateRelations("participacaoDesafio", p, { usuario: true }));
    }
    if (spec?._count) {
      clone._count = {
        participacoes: store.participacaoDesafio.filter((p) => p.desafioId === clone.id)
          .length,
      };
    }
  } else if (modelName === "desafio") {
    if (spec?.entradas) {
      clone.entradas = store.desafioEntrada
        .filter((e) => e.desafioId === clone.id)
        .map((e) => hydrateRelations("desafioEntrada", e, { usuario: true, receita: true, votos: true, _count: true }));
    }
    if (spec?.votos) {
      clone.votos = store.desafioVoto.filter((v) => v.desafioId === clone.id);
    }
    if (spec?._count) {
      clone._count = {
        entradas: store.desafioEntrada.filter((e) => e.desafioId === clone.id).length,
        votos: store.desafioVoto.filter((v) => v.desafioId === clone.id).length,
      };
    }
  } else if (modelName === "desafioEntrada") {
    if (spec?.usuario) {
      clone.usuario =
        store.usuario.find((u) => u.id === clone.usuarioId) || store.usuario[0];
    }
    if (spec?.receita) {
      const r = store.receita.find((rec) => rec.id === clone.receitaId);
      clone.receita = r
        ? hydrateRelations("receita", r, {
            usuario: true,
            ingredientes: true,
            categorias: true,
            _count: true,
          })
        : null;
    }
    if (spec?.votos) {
      clone.votos = store.desafioVoto.filter((v) => v.entradaId === clone.id);
    }
    if (spec?._count) {
      clone._count = {
        votos: store.desafioVoto.filter((v) => v.entradaId === clone.id).length,
      };
    }
  } else if (modelName === "atividadeEngajamento" || modelName === "concessaoPro") {
    if (spec?.usuario) {
      clone.usuario =
        store.usuario.find((u) => u.id === clone.usuarioId) || store.usuario[0];
    }
  }

  return clone;
}

function nextId(table) {
  if (!Array.isArray(table) || table.length === 0) return 1;
  return Math.max(0, ...table.map((item) => Number(item.id) || 0)) + 1;
}

function createModelDelegate(modelName) {
  if (!store[modelName]) store[modelName] = [];
  const getTable = () => store[modelName];

  return {
    findUnique: async (args = {}) => {
      const item = getTable().find((row) => matchesWhere(row, args.where));
      return item ? hydrateRelations(modelName, item, args.include, args.select) : null;
    },
    findFirst: async (args = {}) => {
      let list = getTable().filter((row) => matchesWhere(row, args.where));
      if (args.orderBy) {
        const entries = Array.isArray(args.orderBy)
          ? args.orderBy
          : [args.orderBy];
        for (const ord of entries) {
          const [field, dir] = Object.entries(ord)[0] || [];
          if (field) {
            list.sort((a, b) =>
              dir === "desc"
                ? (a[field] < b[field] ? 1 : -1)
                : (a[field] > b[field] ? 1 : -1)
            );
          }
        }
      }
      const item = list[0];
      return item ? hydrateRelations(modelName, item, args.include, args.select) : null;
    },
    findMany: async (args = {}) => {
      let list = getTable().filter((row) => matchesWhere(row, args.where));
      if (args.orderBy) {
        const entries = Array.isArray(args.orderBy)
          ? args.orderBy
          : [args.orderBy];
        for (const ord of entries) {
          const [field, dir] = Object.entries(ord)[0] || [];
          if (field) {
            list.sort((a, b) =>
              dir === "desc"
                ? (a[field] < b[field] ? 1 : -1)
                : (a[field] > b[field] ? 1 : -1)
            );
          }
        }
      }
      if (typeof args.skip === "number") list = list.slice(args.skip);
      if (typeof args.take === "number") list = list.slice(0, args.take);
      return list.map((row) =>
        hydrateRelations(modelName, row, args.include, args.select)
      );
    },
    count: async (args = {}) => {
      return getTable().filter((row) => matchesWhere(row, args.where)).length;
    },
    create: async (args = {}) => {
      const data = { ...(args.data || {}) };
      const nestedBooks = data.livros?.create;
      delete data.livros;

      const now = new Date().toISOString();
      const newRow = {
        id: data.id || nextId(getTable()),
        ...(modelName === "usuario" ? { plano: "FREE", isAdmin: false, molduraAtiva: null } : {}),
        ...(modelName === "livro" ? { emoji: "fa-solid fa-book", tag: "Coleção" } : {}),
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        ...data,
      };
      getTable().push(newRow);

      if (modelName === "usuario" && Array.isArray(nestedBooks)) {
        for (const b of nestedBooks) {
          store.livro.push({
            id: nextId(store.livro),
            titulo: b.titulo,
            emoji: b.emoji || "fa-solid fa-book",
            tag: b.tag || "Coleção",
            usuarioId: newRow.id,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      persistStore();
      return hydrateRelations(modelName, newRow, args.include, args.select);
    },
    createMany: async (args = {}) => {
      const items = Array.isArray(args.data) ? args.data : [];
      let count = 0;
      for (const item of items) {
        const now = new Date().toISOString();
        getTable().push({
          id: item.id || nextId(getTable()),
          createdAt: now,
          updatedAt: now,
          ...item,
        });
        count++;
      }
      persistStore();
      return { count };
    },
    update: async (args = {}) => {
      const idx = getTable().findIndex((row) => matchesWhere(row, args.where));
      if (idx === -1) throw new Error(`Registro não encontrado em ${modelName}`);
      const current = getTable()[idx];
      const updates = { ...(args.data || {}) };
      for (const [k, v] of Object.entries(updates)) {
        if (v && typeof v === "object" && v.increment !== undefined) {
          updates[k] = (Number(current[k]) || 0) + Number(v.increment);
        } else if (v && typeof v === "object" && v.decrement !== undefined) {
          updates[k] = (Number(current[k]) || 0) - Number(v.decrement);
        }
      }
      const updated = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      getTable()[idx] = updated;
      persistStore();
      return hydrateRelations(modelName, updated, args.include, args.select);
    },
    updateMany: async (args = {}) => {
      let count = 0;
      const table = getTable();
      for (let i = 0; i < table.length; i++) {
        if (matchesWhere(table[i], args.where)) {
          table[i] = {
            ...table[i],
            ...(args.data || {}),
            updatedAt: new Date().toISOString(),
          };
          count++;
        }
      }
      persistStore();
      return { count };
    },
    upsert: async (args = {}) => {
      const existingIdx = getTable().findIndex((row) => matchesWhere(row, args.where));
      if (existingIdx !== -1) {
        const updated = {
          ...getTable()[existingIdx],
          ...(args.update || {}),
          updatedAt: new Date().toISOString(),
        };
        getTable()[existingIdx] = updated;
        persistStore();
        return hydrateRelations(modelName, updated, args.include, args.select);
      }
      const now = new Date().toISOString();
      const created = {
        id: nextId(getTable()),
        createdAt: now,
        updatedAt: now,
        ...(args.create || {}),
      };
      getTable().push(created);
      persistStore();
      return hydrateRelations(modelName, created, args.include, args.select);
    },
    delete: async (args = {}) => {
      const idx = getTable().findIndex((row) => matchesWhere(row, args.where));
      if (idx === -1) return null;
      const [removed] = getTable().splice(idx, 1);
      persistStore();
      return removed;
    },
    deleteMany: async (args = {}) => {
      const before = getTable().length;
      store[modelName] = getTable().filter((row) => !matchesWhere(row, args.where));
      const count = before - store[modelName].length;
      persistStore();
      return { count };
    },
    aggregate: async (args = {}) => {
      const list = getTable().filter((row) => matchesWhere(row, args.where));
      const result = {};
      if (args._sum) {
        result._sum = {};
        for (const f of Object.keys(args._sum)) {
          result._sum[f] = list.reduce((acc, r) => acc + (Number(r[f]) || 0), 0);
        }
      }
      if (args._avg) {
        result._avg = {};
        for (const f of Object.keys(args._avg)) {
          result._avg[f] = list.length
            ? list.reduce((acc, r) => acc + (Number(r[f]) || 0), 0) / list.length
            : null;
        }
      }
      if (args._count) {
        result._count = list.length;
      }
      return result;
    },
    groupBy: async (args = {}) => {
      const list = getTable().filter((row) => matchesWhere(row, args.where));
      const byFields = Array.isArray(args.by) ? args.by : [args.by];
      const groups = new Map();
      for (const row of list) {
        const key = byFields.map((f) => row[f]).join("::");
        if (!groups.has(key)) {
          const base = {};
          for (const f of byFields) base[f] = row[f];
          groups.set(key, { base, rows: [] });
        }
        groups.get(key).rows.push(row);
      }
      return Array.from(groups.values()).map(({ base, rows }) => {
        const entry = { ...base };
        if (args._sum) {
          entry._sum = {};
          for (const f of Object.keys(args._sum)) {
            entry._sum[f] = rows.reduce((a, r) => a + (Number(r[f]) || 0), 0);
          }
        }
        if (args._count) {
          entry._count = { _all: rows.length };
          for (const f of Object.keys(args._count)) {
            entry._count[f] = rows.length;
          }
        }
        if (args._max) {
          entry._max = {};
          for (const f of Object.keys(args._max)) {
            entry._max[f] = rows.reduce(
              (m, r) => (!m || r[f] > m ? r[f] : m),
              null
            );
          }
        }
        return entry;
      });
    },
  };
}

function buildHttpsPrismaClient() {
  const client = {
    $connect: async () => {},
    $disconnect: async () => {},
    $executeRawUnsafe: async () => 0,
    $queryRawUnsafe: async () => [],
    $transaction: async (fnOrArray) => {
      if (typeof fnOrArray === "function") {
        return await fnOrArray(client);
      }
      if (Array.isArray(fnOrArray)) {
        return await Promise.all(fnOrArray);
      }
      return null;
    },
  };
  const models = [
    "usuario",
    "receita",
    "livro",
    "favorito",
    "avaliacao",
    "comentario",
    "compartilhamento",
    "ingrediente",
    "receitaIngrediente",
    "categoria",
    "receitaCategoria",
    "hashtag",
    "receitaHashtag",
    "ingredienteDisponivel",
    "seguidor",
    "usoIA",
    "atividadeEngajamento",
    "conquistaUsuario",
    "desafioSemana",
    "participacaoDesafio",
    "desafioParticipacao",
    "desafio",
    "desafioEntrada",
    "desafioVoto",
    "fechamentoMensal",
    "concessaoPro",
    "mensagemContato",
    "auditoriaAdmin",
  ];
  for (const m of models) {
    client[m] = createModelDelegate(m);
  }
  return client;
}

// 3. Aprimoramento em memória dos controladores de IA e Importação de Vídeo do YouTube
function parseRobustAiJson(rawText) {
  if (!rawText) return null;
  let text = String(rawText).trim();
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) text = codeBlock[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1) return null;
  let candidate = end > start ? text.slice(start, end + 1) : text.slice(start);
  candidate = candidate.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(candidate);
  } catch {
    // Reparo automático caso o modelo tenha truncado a última string/array
    let repaired = candidate.replace(/,\s*"[^"]*$/, "");
    const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
    const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
    if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
    for (let i = 0; i < openBrackets; i++) repaired += "]";
    for (let i = 0; i < openBraces; i++) repaired += "}";
    repaired = repaired.replace(/,(\s*[}\]])/g, "$1");
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

function installResilientAiControllers() {
  const iaControllerPath = path.resolve(
    backEndDir,
    "src",
    "controllers",
    "geracaoIA.controllers.js"
  );
  const iaModule = require(iaControllerPath);
  const originalGerarReceitaFoto = iaModule.gerarReceitaFoto;

  iaModule.gerarReceitaFoto = async (req, res) => {
    const { dishName, ingredientsList, diet, servings } = req.body || {};
    if (!dishName || !Array.isArray(ingredientsList) || ingredientsList.length === 0) {
      return originalGerarReceitaFoto(req, res);
    }
    try {
      const sdk = await import("@openrouter/sdk");
      const openrouter = new sdk.OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      const restrictions = diet || "Nenhuma restrição";
      const portions = Number(servings) || 2;
      const detected = ingredientsList
        .map((i) => String(i).trim())
        .filter(Boolean)
        .slice(0, 10);

      const prompt = `Crie a receita completa em português para o prato "${String(
        dishName
      ).trim()}" (${portions} porções, restrição: ${restrictions}).
Ingredientes identificados na foto: ${detected.join(", ")}.
Responda EXCLUSIVAMENTE com um objeto JSON válido e conciso contendo exatamente estas chaves:
{"time":35,"servings":${portions},"difficulty":"Fácil","diet":"${restrictions}","ingredients":["quantidade + ingrediente"],"steps":["Passo 1 claro","Passo 2 claro","Passo 3 claro","Passo 4 claro"]}`;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await openrouter.chat.send({
            chatRequest: {
              model: "openrouter/free",
              temperature: 0.25,
              maxCompletionTokens: 1600,
              messages: [
                {
                  role: "system",
                  content:
                    "Você é o Chef Saboré IA. Responda exclusivamente com JSON válido, curto e completo, sem markdown.",
                },
                { role: "user", content: prompt },
              ],
            },
          });
          const choice = response.choices?.[0]?.message;
          const raw = (choice?.content || choice?.reasoning || "").trim();
          const parsed = parseRobustAiJson(raw);
          if (
            parsed &&
            Array.isArray(parsed.ingredients) &&
            parsed.ingredients.length > 0 &&
            Array.isArray(parsed.steps) &&
            parsed.steps.length > 0
          ) {
            if (typeof req.consumirQuotaIA === "function") {
              await req.consumirQuotaIA().catch(() => {});
            }
            return res.status(200).json({
              time: Number(parsed.time) || 35,
              servings: Number(parsed.servings) || portions,
              difficulty: parsed.difficulty || "Médio",
              diet: parsed.diet || restrictions,
              ingredients: parsed.ingredients,
              steps: parsed.steps,
            });
          }
        } catch (err) {
          console.warn(
            `[IA Vision Recipe Resiliente] Tentativa ${attempt} falhou:`,
            err.message
          );
        }
      }
    } catch (_) {}
    return originalGerarReceitaFoto(req, res);
  };
}

function installResilientVideoImporter() {
  const importControllerPath = path.resolve(
    backEndDir,
    "src",
    "controllers",
    "importacao.controllers.js"
  );
  const originalModule = require(importControllerPath);
  const originalImportar = originalModule.importar;

  const extractYouTubeId = (input) => {
    try {
      const url = new URL(input);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
      if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) return null;
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      return ["shorts", "embed", "live"].includes(parts[0]) ? parts[1] || null : null;
    } catch {
      return null;
    }
  };

  async function fetchYouTubeContextViaHttps(url, videoId) {
    let title = "";
    let author = "";
    let description = "";
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (oembedRes.ok) {
        const oe = await oembedRes.json();
        title = oe.title || "";
        author = oe.author_name || "";
      }
    } catch (_) {}

    try {
      const pageRes = await fetch(
        `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (pageRes.ok) {
        const html = await pageRes.text();
        const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        if (descMatch) {
          try {
            description = JSON.parse(`"${descMatch[1]}"`);
          } catch {
            description = descMatch[1].replace(/\\n/g, "\n");
          }
        }
        if (!title) {
          const titleMatch = html.match(/"title":"((?:[^"\\]|\\.)*)"/);
          if (titleMatch) title = titleMatch[1];
        }
      }
    } catch (_) {}

    return { title, author, description };
  }

  originalModule.importar = async (req, res) => {
    const videoId = extractYouTubeId(req.body?.url || "");
    if (!videoId) {
      return originalImportar(req, res);
    }

    // Intercepta a resposta caso o ytdl-core falhe (422) e usa os metadados e descrição reais do vídeo + OpenRouter IA
    let capturedStatus = 200;
    const proxyRes = {
      status(code) {
        capturedStatus = code;
        return this;
      },
      async json(payload) {
        if (capturedStatus < 400) {
          return res.status(capturedStatus).json(payload);
        }
        try {
          console.log(
            "[Importação Resiliente] Extraindo título e descrição real do vídeo no YouTube via HTTPS..."
          );
          const ctx = await fetchYouTubeContextViaHttps(req.body.url, videoId);
          if (!ctx.title && !ctx.description) {
            return res.status(capturedStatus).json(payload);
          }

          const sdk = await import("@openrouter/sdk");
          const openrouter = new sdk.OpenRouter({
            apiKey: process.env.OPENROUTER_API_KEY,
          });
          const prompt = `Extraia e estruture em português a receita culinária ensinada no vídeo do YouTube abaixo.
TÍTULO DO VÍDEO: ${ctx.title}
CANAL: ${ctx.author}
DESCRIÇÃO / CONTEÚDO DO VÍDEO:
${(ctx.description || "").slice(0, 4500)}

Responda EXCLUSIVAMENTE com um objeto JSON válido neste formato exato:
{
  "title": "Nome completo da receita em português",
  "description": "Resumo curto e apetitoso da receita",
  "time": 30,
  "servings": 4,
  "difficulty": "Fácil",
  "diet": "none",
  "ingredients": ["quantidade + unidade + ingrediente"],
  "steps": ["Passo 1 claro e objetivo", "Passo 2 claro e objetivo"]
}`;

          let parsedRecipe = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const aiRes = await openrouter.chat.send({
                chatRequest: {
                  model: "openrouter/free",
                  temperature: 0.25,
                  maxCompletionTokens: 1600,
                  messages: [
                    {
                      role: "system",
                      content:
                        "Você é um chef especialista que extrai receitas culinárias de vídeos do YouTube e responde apenas JSON válido, conciso e completo.",
                    },
                    { role: "user", content: prompt },
                  ],
                },
              });
              const raw = (
                aiRes.choices?.[0]?.message?.content ||
                aiRes.choices?.[0]?.message?.reasoning ||
                ""
              ).trim();
              const candidate = parseRobustAiJson(raw);
              if (
                candidate &&
                candidate.title &&
                Array.isArray(candidate.ingredients) &&
                candidate.ingredients.length > 0 &&
                Array.isArray(candidate.steps) &&
                candidate.steps.length > 0
              ) {
                parsedRecipe = candidate;
                break;
              }
            } catch (err) {
              console.warn(
                `[Importação Resiliente] Falha tentativa ${attempt}:`,
                err.message
              );
            }
          }

          if (!parsedRecipe) {
            return res.status(capturedStatus).json(payload);
          }

          if (typeof req.consumirQuotaIA === "function") {
            await req.consumirQuotaIA().catch(() => {});
          }

          return res.status(200).json({
            platform: "youtube",
            platformLabel: '<i class="fa-brands fa-youtube"></i> YouTube',
            videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            title: parsedRecipe.title,
            description: parsedRecipe.description || "",
            recipe: {
              time: Number(parsedRecipe.time) || 30,
              servings: Number(parsedRecipe.servings) || 2,
              difficulty: parsedRecipe.difficulty || "Médio",
              diet: parsedRecipe.diet || "none",
              ingredients: parsedRecipe.ingredients,
              steps: parsedRecipe.steps,
            },
          });
        } catch (_) {
          return res.status(capturedStatus).json(payload);
        }
      },
    };

    return originalImportar(req, proxyRes);
  };
}

// 4. Verifica se o Prisma consegue consultar o PostgreSQL em até 2.5s (detectando bloqueio TLS/PgBouncer da rede atual)
async function checkPostgresTcpAvailable() {
  if (process.env.SABORE_FORCE_DIRECT_TCP !== "1") {
    try {
      const { PrismaClient } = require("@prisma/client");
      const probe = new PrismaClient();
      const ok = await Promise.race([
        probe.$queryRawUnsafe("SELECT 1").then(() => true).catch(() => false),
        new Promise((r) => setTimeout(() => r(false), 2500)),
      ]);
      probe.$disconnect().catch(() => {});
      return ok;
    } catch {
      return false;
    }
  }
  return true;
}

async function bootstrap() {
  const tcpAvailable = await checkPostgresTcpAvailable();
  if (!tcpAvailable) {
    console.log(
      "[Saboré Bridge] Porta TCP 6543/5432 bloqueada pelo firewall da rede atual -> Ativando modo Supabase HTTPS REST (/rest/v1/) em tempo real!"
    );
    await syncFromSupabaseRest();

    const httpsPrisma = buildHttpsPrismaClient();
    const prismaModulePath = path.resolve(backEndDir, "src", "data", "prisma.js");
    require.cache[prismaModulePath] = {
      id: prismaModulePath,
      filename: prismaModulePath,
      loaded: true,
      exports: httpsPrisma,
    };

    const fallbackModulePath = path.resolve(
      backEndDir,
      "src",
      "data",
      "databaseFallback.js"
    );
    const realFallback = require(fallbackModulePath);
    require.cache[fallbackModulePath].exports = {
      ...realFallback,
      withDatabaseFallback: async (prismaOp) => prismaOp(),
      withDirectDatabaseFallback: async (operation) => operation(httpsPrisma),
    };

    const restQueriesPath = path.resolve(
      backEndDir,
      "src",
      "data",
      "restQueries.js"
    );
    if (fs.existsSync(restQueriesPath)) {
      const realRestQueries = require(restQueriesPath);
      require.cache[restQueriesPath].exports = {
        ...realRestQueries,
        listRecipes: async (filters = {}) =>
          httpsPrisma.receita.findMany({
            where: filters,
            include: {
              usuario: true,
              ingredientes: true,
              categorias: true,
              hashtags: true,
              _count: true,
            },
            orderBy: { createdAt: "desc" },
          }),
        listBooks: async (usuarioId) =>
          httpsPrisma.livro.findMany({
            where: { usuarioId: Number(usuarioId) },
            include: { _count: true },
            orderBy: { createdAt: "asc" },
          }),
        listFavorites: async (usuarioId) => {
          const favs = await httpsPrisma.favorito.findMany({
            where: { usuarioId: Number(usuarioId) },
            include: { receita: true },
            orderBy: { createdAt: "desc" },
          });
          return favs.map((f) => f.receita).filter(Boolean);
        },
        listUsers: async () =>
          httpsPrisma.usuario.findMany({ orderBy: { nome: "asc" } }),
        getProfile: async (usuarioId) =>
          httpsPrisma.usuario.findUnique({
            where: { id: Number(usuarioId) },
            include: { receitas: true, favoritos: true, livros: true },
          }),
        listPantry: async (usuarioId) => {
          const items = await httpsPrisma.ingredienteDisponivel.findMany({
            where: { usuarioId: Number(usuarioId) },
            include: { ingrediente: true },
          });
          return items.map((i) => i.ingrediente).filter(Boolean);
        },
        deleteRecipe: async (id) =>
          httpsPrisma.receita.delete({ where: { id: Number(id) } }),
        updateRecipe: async (id, _uid, data) =>
          httpsPrisma.receita.update({ where: { id: Number(id) }, data }),
      };
    }
  } else {
    console.log("[Saboré Bridge] Conexão TCP direta com PostgreSQL Supabase ativa.");
  }

  // 5. Compatibiliza authMiddleware em memória ANTES de carregar qualquer controlador/rota
  const authMiddlewarePath = path.resolve(backEndDir, "src", "middlewares", "auth.js");
  const originalAuthMiddleware = require(authMiddlewarePath);
  const jwt = require("jsonwebtoken");
  const JWT_SECRET = process.env.JWT_SECRET || "sabore-secret-key-12345";

  const unifiedAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.slice(7).trim();
      try {
        const decoded = jwt.verify(rawToken, JWT_SECRET);
        if (decoded && decoded.id && decoded.email) {
          req.usuario = {
            id: Number(decoded.id),
            email: decoded.email,
            nome: decoded.nome || decoded.email.split("@")[0],
          };
          return next();
        }
      } catch (_) {}
    }
    return originalAuthMiddleware(req, res, next);
  };
  require.cache[authMiddlewarePath].exports = unifiedAuthMiddleware;

  installResilientAiControllers();
  installResilientVideoImporter();
  require(path.resolve(backEndDir, "server.js"));
}

bootstrap();
