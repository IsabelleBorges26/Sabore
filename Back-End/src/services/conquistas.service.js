const prisma = require("../data/prisma");
const fs = require("fs");
const path = require("path");

const STORE_PATH = path.resolve(__dirname, "..", "data", "conquistas_store.json");

function carregarStoreConquistas() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    }
  } catch (err) {
    console.warn("[ConquistasStore] Erro ao ler store:", err.message);
  }
  return {
    conquistas: [], // { id, usuarioId, titulo, emblema, molduraPerfil, molduraNome, concedidaEm }
    moldurasAtivas: {} // { [usuarioId]: molduraPerfil }
  };
}

function salvarStoreConquistas(data) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[ConquistasStore] Erro ao salvar store:", err.message);
  }
}

/**
 * Catálogo das molduras comemorativas oficiais
 */
const MOLDURAS_CATALOGO = {
  "moldura-natal-2026": {
    id: "moldura-natal-2026",
    nome: "Moldura Natal 2026",
    descricao: "Recompensa exclusiva concedida ao vencedor do concurso Natal Saboré 2026.",
    evento: "Natal Saboré 2026",
    emblemaImg: "/assets/Emblemas/espirito-natalino-2026.png",
    previewSvg: "natal"
  },
  "moldura-reveillon-2027": {
    id: "moldura-reveillon-2027",
    nome: "Moldura Réveillon 2027",
    descricao: "Recompensa exclusiva concedida ao vencedor do concurso Réveillon Saboré 2027.",
    evento: "Réveillon Saboré 2027",
    emblemaImg: "/assets/Emblemas/sabor-da-virada-2027.png",
    previewSvg: "reveillon"
  }
};

/**
 * Lista as conquistas (emblemas) do usuário
 */
async function obterConquistasUsuario(usuarioId) {
  const uid = Number(usuarioId);
  const lista = [];

  // 1. Tenta buscar no banco relacional via Prisma
  try {
    const dbConquistas = await prisma.conquistaUsuario.findMany({
      where: { usuarioId: uid },
      orderBy: { concedidaEm: "desc" }
    });
    if (dbConquistas && dbConquistas.length > 0) {
      lista.push(...dbConquistas);
    }
  } catch (e) {}

  // 2. Busca no store local de garantia
  const store = carregarStoreConquistas();
  const locais = store.conquistas.filter(c => Number(c.usuarioId) === uid);
  for (const c of locais) {
    if (!lista.some(item => item.titulo === c.titulo)) {
      lista.push(c);
    }
  }

  return lista;
}

/**
 * Retorna a moldura atualmente equipada pelo usuário
 */
function obterMolduraAtiva(usuarioId) {
  const store = carregarStoreConquistas();
  return store.moldurasAtivas[Number(usuarioId)] || null;
}

/**
 * Lista as molduras desbloqueadas pelo usuário e qual está equipada
 */
async function obterMoldurasUsuario(usuarioId) {
  const uid = Number(usuarioId);
  const conquistas = await obterConquistasUsuario(uid);
  const molduraAtiva = obterMolduraAtiva(uid);

  // Extrai as molduras únicas a partir das conquistas desbloqueadas
  const moldurasDesbloqueadas = [];
  const vistas = new Set();

  for (const c of conquistas) {
    if (c.molduraPerfil && !vistas.has(c.molduraPerfil)) {
      vistas.add(c.molduraPerfil);
      const cat = MOLDURAS_CATALOGO[c.molduraPerfil] || {
        id: c.molduraPerfil,
        nome: c.molduraNome || c.molduraPerfil,
        descricao: `Moldura comemorativa desbloqueada na conquista "${c.titulo}".`,
        evento: c.titulo
      };
      moldurasDesbloqueadas.push({
        ...cat,
        desbloqueadaEm: c.concedidaEm,
        equipada: molduraAtiva === c.molduraPerfil
      });
    }
  }

  return {
    molduraAtiva,
    molduras: moldurasDesbloqueadas
  };
}

/**
 * Equipa ou desequipa uma moldura no avatar do usuário
 * Regra: Somente uma moldura pode estar equipada por vez.
 * Usuário só pode equipar molduras que desbloqueou.
 */
async function equiparMoldura(usuarioId, molduraId) {
  const uid = Number(usuarioId);
  const store = carregarStoreConquistas();

  if (!molduraId) {
    // Desequipar moldura
    delete store.moldurasAtivas[uid];
    salvarStoreConquistas(store);

    try {
      await prisma.usuario.update({
        where: { id: uid },
        data: { molduraAtiva: null }
      }).catch(() => {});
    } catch (e) {}

    return { sucesso: true, molduraAtiva: null, mensagem: "Moldura removida do avatar." };
  }

  // Verifica se o usuário tem a moldura desbloqueada
  const conquistas = await obterConquistasUsuario(uid);
  const possui = conquistas.some(c => c.molduraPerfil === molduraId);

  if (!possui) {
    throw new Error("Você ainda não desbloqueou esta moldura. Venca um Evento Especial para conquistá-la!");
  }

  // Equipa a moldura única
  store.moldurasAtivas[uid] = molduraId;
  salvarStoreConquistas(store);

  try {
    await prisma.usuario.update({
      where: { id: uid },
      data: { molduraAtiva: molduraId }
    }).catch(() => {});
  } catch (e) {}

  return {
    sucesso: true,
    molduraAtiva: molduraId,
    mensagem: `Moldura equipada com sucesso!`
  };
}

/**
 * Concede conquista e moldura (usado após confirmação de vitória em eventos)
 * Impede que a mesma conquista seja concedida duas vezes.
 */
async function concederConquistaVencedor(usuarioId, { desafioId, titulo, emblema, molduraPerfil, molduraNome }) {
  const uid = Number(usuarioId);
  const store = carregarStoreConquistas();

  const jaTem = store.conquistas.some(c => Number(c.usuarioId) === uid && c.titulo === titulo);
  if (jaTem) {
    return { jaConcedida: true };
  }

  const nova = {
    id: Date.now(),
    usuarioId: uid,
    desafioId: desafioId ? Number(desafioId) : null,
    titulo,
    emblema: emblema || "/assets/conquistas/padrao.png",
    molduraPerfil: molduraPerfil || null,
    molduraNome: molduraNome || null,
    concedidaEm: new Date().toISOString()
  };

  store.conquistas.push(nova);
  salvarStoreConquistas(store);

  // Tenta persistir no Prisma
  try {
    await prisma.conquistaUsuario.create({
      data: {
        usuarioId: uid,
        desafioId: desafioId ? Number(desafioId) : null,
        titulo,
        emblema: nova.emblema,
        molduraPerfil: nova.molduraPerfil,
        concedidaEm: new Date()
      }
    }).catch(() => {});
  } catch (e) {}

  return { jaConcedida: false, conquista: nova };
}

module.exports = {
  MOLDURAS_CATALOGO,
  obterConquistasUsuario,
  obterMoldurasUsuario,
  obterMolduraAtiva,
  equiparMoldura,
  concederConquistaVencedor
};
