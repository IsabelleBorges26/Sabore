const prisma = require("../data/prisma");
const fs = require("fs");
const path = require("path");
const { getSaoPauloDate, getMesReferencia, registrarPontos } = require("./engajamento.service");

// Desafios programados oficiais solicitados pelo Saboré
const DESAFIOS_PROGRAMADOS = [
  {
    id: 1,
    semanaChave: "2026-11-06_08",
    titulo: "Ingredientes que Você Tem em Casa",
    tema: "Despensa Criativa",
    hashtag: "#IngredientesQueTenhoEmCasa",
    descricao: "Abra sua geladeira e despensa e transforme ingredientes simples em uma receita deliciosa e surpreendente!",
    orientacoes: "1. Liste os ingredientes disponíveis que você já tem em casa.\n2. Crie uma receita criativa sem precisar comprar nada novo.\n3. Publique a receita com a hashtag oficial #IngredientesQueTenhoEmCasa.\n4. Ganhe exatamente +30 pontos no Ranking Mensal!",
    imagem: "/assets/community/desafio-despensa.jpg",
    inicioEm: "2026-11-06T00:00:00.000-03:00",
    fimEm: "2026-11-08T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 2,
    semanaChave: "2026-11-09_15",
    titulo: "Um Prato de Dar Água na Boca",
    tema: "Apresentação & Sabor",
    hashtag: "#PratoDeDarAguaNaBoca",
    descricao: "Capriche na apresentação e no sabor! Prepare um prato de encher os olhos e despertar apetite imediato na comunidade.",
    orientacoes: "1. Escolha sua receita favorita de maior impacto visual e sabor.\n2. Capriche na montagem, cores e foto da receita pronta.\n3. Publique com a hashtag #PratoDeDarAguaNaBoca e conquiste 30 pontos!",
    imagem: "/assets/community/desafio-apresentacao.jpg",
    inicioEm: "2026-11-09T00:00:00.000-03:00",
    fimEm: "2026-11-15T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 3,
    semanaChave: "2026-11-16_22",
    titulo: "Sabores pelo Mundo",
    tema: "Gastronomia Internacional",
    hashtag: "#SaboresPeloMundo",
    descricao: "Embarque em uma viagem gastronômica: prepare um prato típico ou inspirado na culinária de outro país.",
    orientacoes: "1. Escolha uma cozinha internacional (italiana, mexicana, japonesa, mediterrânea, etc.).\n2. Prepare e conte um pouco da história ou segredo do prato.\n3. Publique com a hashtag #SaboresPeloMundo.",
    imagem: "/assets/community/desafio-mundo.jpg",
    inicioEm: "2026-11-16T00:00:00.000-03:00",
    fimEm: "2026-11-22T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 4,
    semanaChave: "2026-11-23_29",
    titulo: "Doce Tentação",
    tema: "Confeitaria & Sobremesas",
    hashtag: "#DoceTentacao",
    descricao: "Sobremesas, tortas, bolos, mousses ou doces artesanais irresistíveis. Mostre sua doçura na cozinha!",
    orientacoes: "1. Prepare uma sobremesa caprichada e saborosa.\n2. Fotografe com destaque para texturas e coberturas.\n3. Publique com a hashtag #DoceTentacao e receba 30 pontos no ranking.",
    imagem: "/assets/community/desafio-doces.jpg",
    inicioEm: "2026-11-23T00:00:00.000-03:00",
    fimEm: "2026-11-29T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 5,
    semanaChave: "2026-11-30_12-06",
    titulo: "Nada se Desperdiça",
    tema: "Cozinha Sustentável",
    hashtag: "#NadaSeDesperdica",
    descricao: "Aproveitamento integral de alimentos: use cascas, talos, sobras planejadas e mostre que na cozinha tudo se aproveita.",
    orientacoes: "1. Use criatividade para transformar ingredientes que iriam para o descarte.\n2. Compartilhe sua dica sustentável na descrição do preparo.\n3. Publique com a hashtag #NadaSeDesperdica.",
    imagem: "/assets/community/desafio-zero-desperdicio.jpg",
    inicioEm: "2026-11-30T00:00:00.000-03:00",
    fimEm: "2026-12-06T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 6,
    semanaChave: "2026-12-07_13",
    titulo: "Desafio do Chef",
    tema: "Técnica & Precisão",
    hashtag: "#DesafioDoChef",
    descricao: "Desafie suas habilidades gastronômicas! Pratique uma técnica especial, molho autoral ou montagem refinada de restaurante.",
    orientacoes: "1. Escolha uma técnica culinária que você sempre quis dominar.\n2. Execute com precisão e documente o processo.\n3. Publique com a hashtag #DesafioDoChef.",
    imagem: "/assets/community/desafio-chef.jpg",
    inicioEm: "2026-12-07T00:00:00.000-03:00",
    fimEm: "2026-12-13T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 7,
    semanaChave: "2026-12-14_20",
    titulo: "O Sabor do Natal",
    tema: "Tradição Natalina",
    hashtag: "#SaborDoNatal",
    descricao: "O clima natalino chegou! Prepare um prato, biscoito, sobremesa ou receita com o aconchego e afeto do Natal.",
    orientacoes: "1. Escolha um prato tradicional ou inovador de Natal.\n2. Capriche nos temperos festivos e na atmosfera natalina.\n3. Publique com a hashtag #SaborDoNatal.",
    imagem: "/assets/community/desafio-natal.jpg",
    inicioEm: "2026-12-14T00:00:00.000-03:00",
    fimEm: "2026-12-20T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 8,
    semanaChave: "2026-12-21_27",
    titulo: "A Ceia dos Campeões",
    tema: "Ceia de Natal",
    hashtag: "#CeiaDosCampeoes",
    descricao: "Compartilhe a receita estrela da sua ceia de Natal: assados suculentos, acompanhamentos especiais ou farofas ricas.",
    orientacoes: "1. Prepare o destaque da sua ceia familiar.\n2. Mostre o ponto perfeito e a montagem na mesa.\n3. Publique com a hashtag #CeiaDosCampeoes.",
    imagem: "/assets/community/desafio-ceia.jpg",
    inicioEm: "2026-12-21T00:00:00.000-03:00",
    fimEm: "2026-12-27T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  },
  {
    id: 9,
    semanaChave: "2026-12-28_31",
    titulo: "Sua Melhor Receita de 2026",
    tema: "Retrospectiva & Celebração",
    hashtag: "#MinhaMelhorReceita2026",
    descricao: "Encerre o ano com sua obra-prima gastronômica! Aquela receita da qual você mais se orgulhou em 2026.",
    orientacoes: "1. Escolha a sua receita mais elogiada e marcante do ano.\n2. Publique com a hashtag #MinhaMelhorReceita2026.\n3. Celebre com a comunidade Saboré e ganhe seus últimos 30 pontos de 2026!",
    imagem: "/assets/community/desafio-retrospectiva.jpg",
    inicioEm: "2026-12-28T00:00:00.000-03:00",
    fimEm: "2026-12-31T23:59:59.999-03:00",
    pontosRecompensa: 30,
    ativo: true
  }
];

// Armazenamento local persistente de segurança (garante que tudo funcione mesmo em instabilidade de rede externa)
const LOCAL_STORE_PATH = path.resolve(__dirname, "..", "data", "desafios_store.json");

function carregarStoreLocal() {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
    }
  } catch (err) {
    console.warn("[DesafiosStore] Aviso ao ler store local:", err.message);
  }
  return {
    desafiosCustomizados: [],
    participacoes: [] // { usuarioId, desafioId, receitaId, pontosConcedidos, createdAt }
  };
}

function salvarStoreLocal(data) {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[DesafiosStore] Erro ao salvar store local:", err.message);
  }
}

/**
 * Retorna todos os desafios cadastrados (programados + personalizados)
 */
function listarTodosDesafios() {
  const store = carregarStoreLocal();
  const todos = [...DESAFIOS_PROGRAMADOS];
  for (const c of store.desafiosCustomizados) {
    const idx = todos.findIndex(d => d.id === c.id);
    if (idx >= 0) todos[idx] = { ...todos[idx], ...c };
    else todos.push(c);
  }
  return todos;
}

/**
 * Retorna o desafio semanal atualmente ativo de acordo com a data no fuso America/Sao_Paulo
 * Regra: Não exibir desafios encerrados como se estivessem ativos.
 */
function obterDesafioSemanalAtivo(dataAtual = new Date()) {
  const sp = getSaoPauloDate(dataAtual);
  const nowTs = sp.getTime();
  const todos = listarTodosDesafios();

  // 1. Tenta encontrar o desafio no qual o momento atual está dentro do intervalo [inicioEm, fimEm]
  const ativo = todos.find(d => {
    if (!d.ativo) return false;
    const inicioTs = new Date(d.inicioEm).getTime();
    const fimTs = new Date(d.fimEm).getTime();
    return nowTs >= inicioTs && nowTs <= fimTs;
  });

  if (ativo) {
    return { ...ativo, statusTempo: "ATIVO" };
  }

  // 2. Se nenhum está ativo no instante exato, busca o próximo agendado mais próximo no futuro
  const futuros = todos
    .filter(d => d.ativo && new Date(d.inicioEm).getTime() > nowTs)
    .sort((a, b) => new Date(a.inicioEm).getTime() - new Date(b.inicioEm).getTime());

  if (futuros.length > 0) {
    return { ...futuros[0], statusTempo: "EM_BREVE" };
  }

  // Se todos já passaram, retorna o último encerrado com status apropriado
  const passados = todos
    .filter(d => d.ativo)
    .sort((a, b) => new Date(b.fimEm).getTime() - new Date(a.fimEm).getTime());

  return passados[0] ? { ...passados[0], statusTempo: "ENCERRADO" } : null;
}

/**
 * Consulta se um usuário já participou/concluiu um desafio específico
 */
async function verificarParticipacaoDesafio(usuarioId, desafioId) {
  if (!usuarioId || !desafioId) return null;

  // 1. Tenta consultar via Prisma se o banco estiver online
  try {
    const p = await prisma.participacaoDesafio.findUnique({
      where: { usuarioId_desafioId: { usuarioId: Number(usuarioId), desafioId: Number(desafioId) } },
      include: { receita: { select: { id: true, titulo: true, imagem: true } } }
    });
    if (p) return p;
  } catch (dbErr) {
    // Falha de conexão tratada silenciosamente pelo fallback
  }

  // 2. Consulta no store local de fallback
  const store = carregarStoreLocal();
  const found = store.participacoes.find(
    item => Number(item.usuarioId) === Number(usuarioId) && Number(item.desafioId) === Number(desafioId)
  );
  return found || null;
}

/**
 * Conta o total de participantes únicos de um desafio
 */
async function contarParticipantes(desafioId) {
  let count = 0;
  try {
    count = await prisma.participacaoDesafio.count({
      where: { desafioId: Number(desafioId) }
    });
    if (count > 0) return count;
  } catch (e) {}

  const store = carregarStoreLocal();
  const participantes = new Set(
    store.participacoes
      .filter(p => Number(p.desafioId) === Number(desafioId))
      .map(p => p.usuarioId)
  );
  return Math.max(count, participantes.size);
}

/**
 * Registra a conclusão do desafio semanal pelo usuário ao publicar uma receita com a hashtag.
 * Regra obrigatória: A publicação deve conceder EXATAMENTE 30 pontos no total, e não 30 + 10.
 * O usuário pode publicar outras receitas com a mesma hashtag, mas ganhará os 30 pontos apenas uma vez por desafio.
 */
async function processarConclusaoDesafioPorReceita(usuarioId, receita) {
  if (!usuarioId || !receita || !receita.id) return { concluiuDesafio: false };

  const desafioAtivo = obterDesafioSemanalAtivo();
  if (!desafioAtivo || desafioAtivo.statusTempo !== "ATIVO") {
    return { concluiuDesafio: false };
  }

  // Verifica se a receita tem a hashtag oficial do desafio ativo
  const cleanChallengeTag = desafioAtivo.hashtag.replace(/^#/, "").toLowerCase();
  
  // Extrai tags da receita (tanto do array hashtags quanto do texto)
  const recipeTags = new Set();
  if (Array.isArray(receita.hashtags)) {
    receita.hashtags.forEach(h => {
      const name = typeof h === "string" ? h : h.hashtag?.nome || h.nome;
      if (name) recipeTags.add(name.replace(/^#/, "").toLowerCase());
    });
  }
  if (receita.categorias && Array.isArray(receita.categorias)) {
    receita.categorias.forEach(c => {
      const name = c.categoria?.nome || c.nome;
      if (name) recipeTags.add(name.replace(/^#/, "").toLowerCase());
    });
  }
  const textContent = `${receita.titulo || ""} ${receita.descricao || ""}`.toLowerCase();
  if (textContent.includes(`#${cleanChallengeTag}`) || textContent.includes(cleanChallengeTag)) {
    recipeTags.add(cleanChallengeTag);
  }

  const temHashtagOficial = recipeTags.has(cleanChallengeTag);
  if (!temHashtagOficial) {
    return { concluiuDesafio: false };
  }

  // Verifica se o usuário já participou/ganhou os pontos deste desafio
  const jaConcluiu = await verificarParticipacaoDesafio(usuarioId, desafioAtivo.id);
  if (jaConcluiu) {
    // Já pontuou anteriormente: não ganha pontos extras, mas a publicação segue normal (+10 pts padrão)
    return {
      concluiuDesafio: false,
      jaPontuouAnteriormente: true,
      mensagem: "Hashtag do desafio reconhecida, mas você já conquistou os 30 pontos deste desafio anteriormente."
    };
  }

  // Registra a participação do desafio
  const chaveUnica = `DESAFIO_SEMANAL_${desafioAtivo.id}_USR_${usuarioId}`;
  const pontosConcedidos = desafioAtivo.pontosRecompensa || 30;

  // 1. Tenta gravar no Prisma
  try {
    await prisma.participacaoDesafio.create({
      data: {
        usuarioId: Number(usuarioId),
        desafioId: Number(desafioAtivo.id),
        nomeReceita: receita.titulo || "Receita do Desafio",
        descricaoPreparacao: receita.descricao || "Preparada para o Desafio da Semana",
        foto: receita.imagem || null,
        pontosConcedidos,
        pontosRegistradosEm: new Date()
      }
    }).catch(() => {});
  } catch (err) {}

  // 2. Grava no store local de garantia
  const store = carregarStoreLocal();
  store.participacoes.push({
    usuarioId: Number(usuarioId),
    desafioId: Number(desafioAtivo.id),
    receitaId: Number(receita.id),
    nomeReceita: receita.titulo || "Receita do Desafio",
    foto: receita.imagem || null,
    pontosConcedidos,
    createdAt: new Date().toISOString()
  });
  salvarStoreLocal(store);

  // 3. Concede os 30 pontos no Ranking Mensal via serviço de engajamento
  await registrarPontos({
    usuarioId: Number(usuarioId),
    tipo: "DESAFIO_SEMANA",
    pontos: pontosConcedidos,
    chaveUnica,
    referenciaId: desafioAtivo.id,
    descricao: `Desafio Semanal concluído: "${desafioAtivo.titulo}" — Receita: "${receita.titulo}"`
  });

  return {
    concluiuDesafio: true,
    desafioId: desafioAtivo.id,
    desafioTitulo: desafioAtivo.titulo,
    pontosConcedidos,
    mensagem: `+${pontosConcedidos} pontos conquistados! Parabéns por concluir o Desafio Semanal.`
  };
}

/**
 * Lista todas as participações em desafios semanais para auditoria do painel admin
 */
async function listarParticipacoesAdmin(desafioId = null) {
  const store = carregarStoreLocal();
  const todosDesafios = listarTodosDesafios();
  const mapaDesafios = new Map(todosDesafios.map(d => [Number(d.id), d]));

  const lista = [];

  // 1. Tenta buscar no Prisma
  try {
    const whereClause = desafioId ? { desafioId: Number(desafioId) } : {};
    const dbList = await prisma.participacaoDesafio.findMany({
      where: whereClause,
      include: {
        usuario: { select: { id: true, nome: true, email: true, plano: true } },
        receita: { select: { id: true, titulo: true, imagem: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    if (dbList && dbList.length > 0) {
      for (const item of dbList) {
        const d = mapaDesafios.get(Number(item.desafioId));
        lista.push({
          id: item.id,
          usuarioId: item.usuarioId,
          usuarioNome: item.usuario?.nome || "Cozinheiro",
          usuarioEmail: item.usuario?.email || "",
          usuarioPlano: item.usuario?.plano || "FREE",
          desafioId: item.desafioId,
          desafioTitulo: d?.titulo || `Desafio #${item.desafioId}`,
          desafioHashtag: d?.hashtag || "",
          receitaId: item.receitaId,
          receitaTitulo: item.receita?.titulo || item.nomeReceita || "Receita",
          receitaFoto: item.receita?.imagem || item.foto || null,
          pontosConcedidos: item.pontosConcedidos || 30,
          status: "VALIDADA",
          createdAt: item.createdAt
        });
      }
    }
  } catch (e) {}

  // 2. Mescla do store local
  for (const p of store.participacoes) {
    if (desafioId && Number(p.desafioId) !== Number(desafioId)) continue;
    const jaTem = lista.some(item => Number(item.usuarioId) === Number(p.usuarioId) && Number(item.desafioId) === Number(p.desafioId));
    if (!jaTem) {
      const d = mapaDesafios.get(Number(p.desafioId));
      let uNome = "Cozinheiro";
      let uEmail = "";
      let uPlano = "FREE";
      try {
        const u = await prisma.usuario.findUnique({ where: { id: Number(p.usuarioId) }, select: { nome: true, email: true, plano: true } });
        if (u) { uNome = u.nome; uEmail = u.email; uPlano = u.plano; }
      } catch (e) {}

      lista.push({
        id: p.id || `loc_${p.usuarioId}_${p.desafioId}`,
        usuarioId: p.usuarioId,
        usuarioNome: uNome,
        usuarioEmail: uEmail,
        usuarioPlano: uPlano,
        desafioId: p.desafioId,
        desafioTitulo: d?.titulo || `Desafio #${p.desafioId}`,
        desafioHashtag: d?.hashtag || "",
        receitaId: p.receitaId || null,
        receitaTitulo: p.nomeReceita || "Receita",
        receitaFoto: p.foto || null,
        pontosConcedidos: p.pontosConcedidos || 30,
        status: p.status || "VALIDADA",
        createdAt: p.createdAt
      });
    }
  }

  return lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  DESAFIOS_PROGRAMADOS,
  listarTodosDesafios,
  obterDesafioSemanalAtivo,
  verificarParticipacaoDesafio,
  contarParticipantes,
  processarConclusaoDesafioPorReceita,
  listarParticipacoesAdmin,
  carregarStoreLocal,
  salvarStoreLocal
};

