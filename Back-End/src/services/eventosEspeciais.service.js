const prisma = require("../data/prisma");
const fs = require("fs");
const path = require("path");
const { getSaoPauloDate } = require("./engajamento.service");

// Eventos especiais iniciais oficiais
const EVENTOS_INICIAIS = [
  {
    id: 1,
    titulo: "Natal Saboré 2026",
    descricao: "Compartilhe sua melhor receita natalina e concorra ao emblema exclusivo do evento.",
    hashtag: "#NatalSabore2026",
    bannerUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
    comecaEm: "2026-12-01T00:00:00.000-03:00",
    encerraEm: "2026-12-25T23:59:59.999-03:00",
    inscricoesIniciaEm: "2026-12-01T00:00:00.000-03:00",
    inscricoesEncerraEm: "2026-12-22T23:59:59.999-03:00",
    votacaoIniciaEm: "2026-12-23T00:00:00.000-03:00",
    votacaoEncerraEm: "2026-12-25T23:59:59.999-03:00",
    resultadoDivulgadoEm: "2026-12-26T00:00:00.000-03:00",
    emblema: "Espírito Natalino 2026",
    emblemaImg: "/assets/Emblemas/espirito-natalino-2026.png",
    regras: "Inscreva uma receita oficial. Você pode trocá-la enquanto as inscrições estiverem abertas; na votação, ela fica bloqueada. Cada pessoa vota uma vez e não pode votar na própria receita. A mais votada vence. Em caso de empate, vale a inscrição aprovada primeiro.",
    status: "INSCRICOES",
    resultadoConfirmado: false,
    vencedor: null
  },
  {
    id: 2,
    titulo: "Réveillon Saboré 2027",
    descricao: "Celebre a virada com sua receita especial e concorra ao emblema da comunidade.",
    hashtag: "#ReveillonSabore2027",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    comecaEm: "2026-12-26T00:00:00.000-03:00",
    encerraEm: "2027-01-01T23:59:59.999-03:00",
    inscricoesIniciaEm: "2026-12-26T00:00:00.000-03:00",
    inscricoesEncerraEm: "2026-12-29T23:59:59.999-03:00",
    votacaoIniciaEm: "2026-12-30T00:00:00.000-03:00",
    votacaoEncerraEm: "2027-01-01T23:59:59.999-03:00",
    resultadoDivulgadoEm: "2027-01-02T00:00:00.000-03:00",
    emblema: "Sabor da Virada 2027",
    emblemaImg: "/assets/Emblemas/sabor-da-virada-2027.png",
    regras: "Inscreva uma receita oficial. Você pode trocá-la enquanto as inscrições estiverem abertas; na votação, ela fica bloqueada. Cada pessoa vota uma vez e não pode votar na própria receita. A mais votada vence. Em caso de empate, vale a inscrição aprovada primeiro.",
    status: "RASCUNHO",
    resultadoConfirmado: false,
    vencedor: null
  }
];

const LOCAL_STORE_PATH = path.resolve(__dirname, "..", "data", "eventos_store.json");

function carregarStoreEventos() {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
    }
  } catch (err) {
    console.warn("[EventosStore] Aviso ao ler store:", err.message);
  }
  return {
    eventos: EVENTOS_INICIAIS,
    entradas: [], // { id, eventoId, usuarioId, receitaId, status: 'APROVADA', createdAt }
    votos: [],    // { id, eventoId, entradaId, usuarioId, createdAt }
    denuncias: [],// { id, eventoId, entradaId, usuarioId, motivo, createdAt }
    auditoria: [] // { id, adminId, acao, alvoTipo, alvoId, detalhes, createdAt }
  };
}

function salvarStoreEventos(data) {
  try {
    const dir = path.dirname(LOCAL_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[EventosStore] Erro ao salvar store:", err.message);
  }
}

/**
 * Determina a fase em tempo real de um evento no fuso America/Sao_Paulo
 */
function calcularFaseEvento(evento, dataRef = new Date()) {
  const agora = getSaoPauloDate(dataRef).getTime();
  const comeca = new Date(evento.comecaEm).getTime();
  const inscricoesFim = new Date(evento.inscricoesEncerraEm || evento.encerraEm).getTime();
  const votacaoInicio = evento.votacaoIniciaEm ? new Date(evento.votacaoIniciaEm).getTime() : null;
  const votacaoFim = evento.votacaoEncerraEm ? new Date(evento.votacaoEncerraEm).getTime() : null;

  if (evento.resultadoConfirmado || (votacaoFim && agora > votacaoFim)) {
    return "ENCERRADO";
  }
  if (votacaoInicio && votacaoFim && agora >= votacaoInicio && agora <= votacaoFim) {
    return "VOTACAO";
  }
  if (agora >= comeca && agora <= inscricoesFim) {
    return "INSCRICOES";
  }
  if (agora < comeca) {
    return "EM_BREVE";
  }
  return "ENCERRADO";
}

/**
 * Lista todos os eventos especiais com contagens e fase atual
 */
function listarEventos(usuarioId = null) {
  const store = carregarStoreEventos();
  const eventos = store.eventos.map(ev => {
    const fase = calcularFaseEvento(ev);
    const entradasAprovadas = store.entradas.filter(e => e.eventoId === ev.id && e.status === "APROVADA");
    const totalVotos = store.votos.filter(v => v.eventoId === ev.id).length;
    const minhaEntrada = usuarioId ? store.entradas.find(e => e.eventoId === ev.id && Number(e.usuarioId) === Number(usuarioId)) : null;
    const meuVoto = usuarioId ? store.votos.find(v => v.eventoId === ev.id && Number(v.usuarioId) === Number(usuarioId)) : null;

    return {
      ...ev,
      inicioEm: ev.comecaEm,
      fimEm: ev.encerraEm,
      inscricoesInicioEm: ev.inscricoesIniciaEm,
      inscricoesFimEm: ev.inscricoesEncerraEm,
      votacaoInicioEm: ev.votacaoIniciaEm,
      votacaoFimEm: ev.votacaoEncerraEm,
      emblemaId: ev.emblema,
      fase,
      participantesCount: entradasAprovadas.length,
      totalVotos,
      jaInscrito: Boolean(minhaEntrada),
      minhaEntradaId: minhaEntrada?.id || null,
      meuVotoEntradaId: meuVoto?.entradaId || null
    };
  });
  return eventos;
}

/**
 * Obtém detalhes completos de um evento, incluindo galeria de votação
 */
async function obterEventoPorId(eventoId, usuarioId = null) {
  const store = carregarStoreEventos();
  const idNum = Number(eventoId);
  const evento = store.eventos.find(e => e.id === idNum);
  if (!evento) return null;

  const fase = calcularFaseEvento(evento);
  const entradas = store.entradas.filter(e => e.eventoId === idNum && e.status === "APROVADA");

  // Busca dados das receitas inscritas e autores
  const galeria = [];
  for (const ent of entradas) {
    let receita = null;
    let autor = null;

    // Tenta carregar dados ricos da receita via Prisma se online
    try {
      receita = await prisma.receita.findUnique({
        where: { id: Number(ent.receitaId) },
        include: {
          usuario: { select: { id: true, nome: true, foto: true, plano: true } },
          ingredientes: { include: { ingrediente: true } }
        }
      });
      if (receita) autor = receita.usuario;
    } catch (e) {}

    // Fallback de dados da receita
    if (!receita) {
      receita = {
        id: ent.receitaId,
        titulo: ent.titulo || "Receita Inscrita",
        descricao: ent.descricao || "",
        imagem: ent.imagem || null,
        tempoPreparo: ent.tempoPreparo || 45,
        modoPreparo: ent.modoPreparo || "Modo de preparo não informado."
      };
      autor = ent.autor || { id: ent.usuarioId, nome: "Cozinheiro Saboré", plano: "FREE" };
    }

    const votosDaEntrada = store.votos.filter(v => v.entradaId === ent.id).length;

    galeria.push({
      id: ent.id,
      receitaId: ent.receitaId,
      titulo: receita.titulo,
      descricao: receita.descricao,
      imagem: receita.imagem,
      tempoPreparo: receita.tempoPreparo,
      modoPreparo: receita.modoPreparo,
      ingredientes: receita.ingredientes || [],
      autor: {
        id: autor.id,
        nome: autor.nome,
        foto: autor.foto,
        plano: autor.plano,
      },
      votos: votosDaEntrada,
      inscritoEm: ent.createdAt
    });
  }

  // Ordena a galeria pelos votos decrescentes e critério de desempate (mais antiga primeiro)
  galeria.sort((a, b) => b.votos - a.votos || new Date(a.inscritoEm) - new Date(b.inscritoEm));

  const minhaEntrada = usuarioId ? store.entradas.find(e => e.eventoId === idNum && Number(e.usuarioId) === Number(usuarioId)) : null;
  const meuVoto = usuarioId ? store.votos.find(v => v.eventoId === idNum && Number(v.usuarioId) === Number(usuarioId)) : null;

  return {
    ...evento,
    inicioEm: evento.comecaEm,
    fimEm: evento.encerraEm,
    inscricoesInicioEm: evento.inscricoesIniciaEm,
    inscricoesFimEm: evento.inscricoesEncerraEm,
    votacaoInicioEm: evento.votacaoIniciaEm,
    votacaoFimEm: evento.votacaoEncerraEm,
    emblemaId: evento.emblema,
    fase,
    galeria,
    participantesCount: galeria.length,
    totalVotos: store.votos.filter(v => v.eventoId === idNum).length,
    minhaEntrada: minhaEntrada ? {
      id: minhaEntrada.id,
      receitaId: minhaEntrada.receitaId,
      status: minhaEntrada.status
    } : null,
    meuVoto: meuVoto ? {
      entradaId: meuVoto.entradaId,
      votadoEm: meuVoto.createdAt
    } : null
  };
}

/**
 * Participação nos Eventos — MODELO B
 * O usuário pode publicar várias receitas com a hashtag, mas apenas UMA será sua inscrição oficial.
 * Pode substituir a inscrição oficial enquanto as inscrições estiverem abertas e a votação não começou.
 * Durante a votação, alterações e substituições são bloqueadas.
 */
async function inscreverReceitaOficial(eventoId, usuarioId, receitaId, dadosReceita = {}) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const uId = Number(usuarioId);
  const rId = Number(receitaId);

  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  const fase = calcularFaseEvento(evento);
  if (fase === "EM_BREVE") {
    throw new Error("As inscrições para este evento ainda não começaram.");
  }
  if (fase === "VOTACAO" || fase === "ENCERRADO") {
    throw new Error("O período de inscrições está encerrado. Não é permitido alterar ou enviar novas inscrições.");
  }

  // Busca dados da receita
  let receitaInfo = dadosReceita;
  if (!receitaInfo.titulo) {
    try {
      const dbRec = await prisma.receita.findUnique({
        where: { id: rId },
        include: { usuario: true }
      });
      if (dbRec) {
        if (dbRec.usuarioId !== uId) {
          throw new Error("Você só pode inscrever receitas de sua própria autoria.");
        }
        receitaInfo = {
          titulo: dbRec.titulo,
          descricao: dbRec.descricao,
          imagem: dbRec.imagem,
          tempoPreparo: dbRec.tempoPreparo,
          modoPreparo: dbRec.modoPreparo,
          autor: { id: dbRec.usuario.id, nome: dbRec.usuario.nome, foto: dbRec.usuario.foto, plano: dbRec.usuario.plano }
        };
      }
    } catch (e) {
      if (e.message.includes("autoria")) throw e;
    }
  }

  // Modelo B: Procura se o usuário já possui inscrição oficial neste evento
  const entradaExistenteIdx = store.entradas.findIndex(
    e => e.eventoId === evId && Number(e.usuarioId) === uId
  );

  let entradaFinal = null;

  if (entradaExistenteIdx >= 0) {
    // Substitui a inscrição oficial anterior (permitido durante período de inscrições)
    const entradaAntiga = store.entradas[entradaExistenteIdx];
    store.entradas[entradaExistenteIdx] = {
      ...entradaAntiga,
      receitaId: rId,
      titulo: receitaInfo.titulo || entradaAntiga.titulo,
      descricao: receitaInfo.descricao || entradaAntiga.descricao,
      imagem: receitaInfo.imagem || entradaAntiga.imagem,
      tempoPreparo: receitaInfo.tempoPreparo || entradaAntiga.tempoPreparo,
      modoPreparo: receitaInfo.modoPreparo || entradaAntiga.modoPreparo,
      autor: receitaInfo.autor || entradaAntiga.autor,
      status: "APROVADA",
      atualizadoEm: new Date().toISOString()
    };
    entradaFinal = store.entradas[entradaExistenteIdx];
  } else {
    // Nova inscrição oficial única
    const novaEntrada = {
      id: Date.now(),
      eventoId: evId,
      usuarioId: uId,
      receitaId: rId,
      titulo: receitaInfo.titulo || "Receita Oficial do Evento",
      descricao: receitaInfo.descricao || "",
      imagem: receitaInfo.imagem || null,
      tempoPreparo: receitaInfo.tempoPreparo || 40,
      modoPreparo: receitaInfo.modoPreparo || "",
      autor: receitaInfo.autor || { id: uId, nome: "Cozinheiro Saboré", plano: "FREE" },
      status: "APROVADA",
      createdAt: new Date().toISOString()
    };
    store.entradas.push(novaEntrada);
    entradaFinal = novaEntrada;
  }

  salvarStoreEventos(store);

  // Também grava no banco relacional via Prisma se conectado
  try {
    await prisma.desafioEntrada.upsert({
      where: { receitaId: rId },
      update: { desafioId: evId, usuarioId: uId },
      create: { desafioId: evId, usuarioId: uId, receitaId: rId }
    }).catch(() => {});
  } catch (err) {}

  return {
    sucesso: true,
    mensagem: entradaExistenteIdx >= 0
      ? "Sua inscrição oficial foi substituída com sucesso!"
      : "Inscrição confirmada! Sua receita já está no evento.",
    entrada: entradaFinal
  };
}

/**
 * VOTAÇÃO COMUNITÁRIA EXCLUSIVA PARA EVENTOS ESPECIAIS
 * Regras:
 * - Qualquer usuário autenticado pode votar (FREE ou PRO).
 * - Cada usuário tem 1 voto por evento.
 * - Usuário não pode votar na própria receita.
 * - O voto confirmado não pode ser alterado.
 * - Votos só podem ser registrados durante o período oficial.
 */
async function registrarVotoComunitario(eventoId, usuarioId, entradaId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const uId = Number(usuarioId);
  const entId = Number(entradaId);

  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  const fase = calcularFaseEvento(evento);
  if (fase !== "VOTACAO") {
    if (fase === "INSCRICOES" || fase === "EM_BREVE") {
      throw new Error("A votação para este evento ainda não foi iniciada.");
    }
    throw new Error("A votação para este evento já foi encerrada.");
  }

  // Verifica se a entrada existe e é aprovada
  const entrada = store.entradas.find(e => e.id === entId && e.eventoId === evId);
  if (!entrada || entrada.status !== "APROVADA") {
    throw new Error("Receita inscrita não encontrada ou não aprovada.");
  }

  // Bloqueio: Não pode votar na própria inscrição
  if (Number(entrada.usuarioId) === uId) {
    throw new Error("Você não pode votar na sua própria receita inscrita.");
  }

  // Bloqueio: Cada usuário tem apenas um voto por evento. Voto confirmado não pode ser alterado.
  const jaVotou = store.votos.find(v => v.eventoId === evId && Number(v.usuarioId) === uId);
  if (jaVotou) {
    throw new Error("Você já votou neste evento. O voto é único e não pode ser alterado.");
  }

  // Registra o voto de forma atômica
  const novoVoto = {
    id: Date.now(),
    eventoId: evId,
    entradaId: entId,
    usuarioId: uId,
    createdAt: new Date().toISOString()
  };
  store.votos.push(novoVoto);
  salvarStoreEventos(store);

  // Tenta registrar no banco via Prisma
  try {
    await prisma.desafioVoto.create({
      data: {
        desafioId: evId,
        entradaId: entId,
        usuarioId: uId
      }
    }).catch(() => {});
  } catch (e) {}

  const totalVotosEntrada = store.votos.filter(v => v.entradaId === entId).length;

  return {
    sucesso: true,
    mensagem: "Seu voto foi registrado! Obrigado por participar.",
    votoId: novoVoto.id,
    totalVotosEntrada
  };
}

/**
 * Denúncia comunitária de uma entrada inscrita
 */
function registrarDenuncia(eventoId, usuarioId, entradaId, motivo) {
  const store = carregarStoreEventos();
  const novaDenuncia = {
    id: Date.now(),
    eventoId: Number(eventoId),
    entradaId: Number(entradaId),
    usuarioId: Number(usuarioId),
    motivo: String(motivo || "Conteúdo impróprio ou não original").trim(),
    createdAt: new Date().toISOString(),
    status: "PENDENTE"
  };
  store.denuncias.push(novaDenuncia);
  salvarStoreEventos(store);
  return { sucesso: true, mensagem: "Denúncia enviada para análise da moderação." };
}

/**
 * Encerramento & Apuração com Desempate
 * Em caso de empate, utiliza a inscrição oficial aprovada mais antiga.
 */
function apurarVencedorEvento(eventoId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  const entradas = store.entradas.filter(e => e.eventoId === evId && e.status === "APROVADA");
  if (entradas.length === 0) return null;

  // Calcula votos para cada entrada
  const pontuadas = entradas.map(ent => ({
    ...ent,
    votos: store.votos.filter(v => v.entradaId === ent.id).length
  }));

  // Ordena por votos desc, depois por createdAt asc (mais antiga vence em caso de empate)
  pontuadas.sort((a, b) => b.votos - a.votos || new Date(a.createdAt) - new Date(b.createdAt));

  return pontuadas[0];
}

/**
 * Confirmação administrativa de resultado e concessão de premiação exclusiva
 * Regras:
 * - Apenas o vencedor recebe o emblema permanente e o destaque do evento.
 * - Impede concessão duplicada.
 * - Auditoria completa registrada.
 */
async function confirmarResultadoEvento(eventoId, adminId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  const vencedorEntrada = apurarVencedorEvento(evId);
  if (!vencedorEntrada) {
    throw new Error("Não há receitas inscritas aprovadas para apurar vencedor.");
  }

  // Atualiza status do evento
  evento.resultadoConfirmado = true;
  evento.status = "ENCERRADO";
  evento.vencedor = {
    usuarioId: vencedorEntrada.usuarioId,
    receitaId: vencedorEntrada.receitaId,
    receitaTitulo: vencedorEntrada.titulo,
    autorNome: vencedorEntrada.autor?.nome || "Cozinheiro Vencedor",
    votos: vencedorEntrada.votos,
    confirmadoEm: new Date().toISOString()
  };

  // Concede somente o emblema ao vencedor (idempotente)
  const tituloConquista = evento.emblema;
  const usuarioVencedorId = Number(vencedorEntrada.usuarioId);

  // 1. Concede via serviço de conquistas (atualiza store local e banco de forma atômica)
  try {
    const { concederConquistaVencedor } = require("./conquistas.service");
    await concederConquistaVencedor(usuarioVencedorId, {
      desafioId: evId,
      titulo: tituloConquista,
      emblema: evento.emblemaImg
    });
  } catch (errConq) {
    console.warn("[Conquistas] Aviso ao conceder conquista:", errConq.message);
  }

  // 2. Tenta gravar no banco Prisma direto para redundância
  try {
    const jaTemConquista = await prisma.conquistaUsuario.findFirst({
      where: { usuarioId: usuarioVencedorId, titulo: tituloConquista }
    });
    if (!jaTemConquista) {
      await prisma.conquistaUsuario.create({
        data: {
          usuarioId: usuarioVencedorId,
          titulo: tituloConquista,
          emblema: evento.emblemaImg,
          concedidaEm: new Date()
        }
      });
    }
  } catch (dbErr) {}

  // 2. Registra na auditoria
  const logAuditoria = {
    id: Date.now(),
    adminId: Number(adminId || 1),
    acao: "CONFIRMAR_RESULTADO_EVENTO",
    alvoTipo: "EVENTO",
    alvoId: evId,
    detalhes: {
      eventoTitulo: evento.titulo,
      vencedorUsuarioId: usuarioVencedorId,
      receitaTitulo: vencedorEntrada.titulo,
      votos: vencedorEntrada.votos,
      emblemaConcedido: evento.emblema,
      destaqueConcedido: true
    },
    createdAt: new Date().toISOString()
  };
  store.auditoria.push(logAuditoria);

  salvarStoreEventos(store);

  return {
    sucesso: true,
    mensagem: `Resultado confirmado! ${vencedorEntrada.autor?.nome || "O vencedor"} recebeu o emblema "${evento.emblema}" e o destaque do evento.`,
    vencedor: evento.vencedor
  };
}

/**
 * Moderação de Inscrições: Aprovar ou Rejeitar receita com auditoria
 */
function moderarEntrada(eventoId, entradaId, novoStatus, motivo, adminId) {
  const store = carregarStoreEventos();
  const ent = store.entradas.find(e => e.id === Number(entradaId) && e.eventoId === Number(eventoId));
  if (!ent) throw new Error("Inscrição não encontrada.");

  const statusAnterior = ent.status;
  ent.status = novoStatus === "REJEITADA" ? "REJEITADA" : "APROVADA";
  ent.motivoRejeicao = motivo || null;
  ent.moderadoPor = Number(adminId || 1);
  ent.moderadoEm = new Date().toISOString();

  // Registra auditoria
  store.auditoria.push({
    id: Date.now(),
    adminId: Number(adminId || 1),
    acao: "MODERAR_INSCRICAO",
    alvoTipo: "INSCRICAO",
    alvoId: Number(entradaId),
    detalhes: {
      eventoId: Number(eventoId),
      receitaId: ent.receitaId,
      statusAnterior,
      novoStatus: ent.status,
      motivo
    },
    createdAt: new Date().toISOString()
  });

  salvarStoreEventos(store);
  return { sucesso: true, entrada: ent };
}

/**
 * Criação e Edição de Eventos pelo Painel Administrativo
 */
function salvarEventoAdmin(dados, adminId) {
  const store = carregarStoreEventos();
  const id = Number(dados.id);

  if (id) {
    const idx = store.eventos.findIndex(e => e.id === id);
    if (idx >= 0) {
      store.eventos[idx] = { ...store.eventos[idx], ...dados, atualizadoEm: new Date().toISOString() };
      store.auditoria.push({
        id: Date.now(),
        adminId: Number(adminId || 1),
        acao: "EDITAR_EVENTO",
        alvoTipo: "EVENTO",
        alvoId: id,
        detalhes: dados,
        createdAt: new Date().toISOString()
      });
      salvarStoreEventos(store);
      return store.eventos[idx];
    }
  }

  const novoEvento = {
    id: Date.now(),
    titulo: dados.titulo,
    descricao: dados.descricao,
    hashtag: dados.hashtag.startsWith("#") ? dados.hashtag : `#${dados.hashtag}`,
    bannerUrl: dados.bannerUrl || "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1200&q=80",
    comecaEm: dados.comecaEm,
    encerraEm: dados.encerraEm,
    inscricoesIniciaEm: dados.inscricoesIniciaEm || dados.comecaEm,
    inscricoesEncerraEm: dados.inscricoesEncerraEm || dados.encerraEm,
    votacaoIniciaEm: dados.votacaoIniciaEm,
    votacaoEncerraEm: dados.votacaoEncerraEm,
    resultadoDivulgadoEm: dados.resultadoDivulgadoEm,
    emblema: dados.emblema || "Campeão da Comunidade",
    emblemaImg: dados.emblemaImg || "/assets/conquistas/padrao.png",
    regras: dados.regras || "Regras oficiais do evento Saboré.",
    status: "INSCRICOES",
    resultadoConfirmado: false,
    vencedor: null,
    createdAt: new Date().toISOString()
  };

  store.eventos.push(novoEvento);
  store.auditoria.push({
    id: Date.now(),
    adminId: Number(adminId || 1),
    acao: "CRIAR_EVENTO",
    alvoTipo: "EVENTO",
    alvoId: novoEvento.id,
    detalhes: novoEvento,
    createdAt: new Date().toISOString()
  });

  salvarStoreEventos(store);
  return novoEvento;
}

/**
 * Lista todas as inscrições para administração (Aprovadas, Pendentes, Rejeitadas)
 */
async function listarEntradasAdmin(eventoId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const entradas = store.entradas.filter(e => e.eventoId === evId);

  const resultado = [];
  for (const ent of entradas) {
    let receita = null;
    let autor = null;

    try {
      receita = await prisma.receita.findUnique({
        where: { id: Number(ent.receitaId) },
        include: {
          usuario: { select: { id: true, nome: true, email: true, plano: true } }
        }
      });
      if (receita) autor = receita.usuario;
    } catch (e) {}

    const votos = store.votos.filter(v => v.entradaId === ent.id).length;
    const denuncias = store.denuncias.filter(d => d.entradaId === ent.id).length;

    resultado.push({
      id: ent.id,
      receitaId: ent.receitaId,
      titulo: receita?.titulo || ent.titulo || "Receita Inscrita",
      imagem: receita?.imagem || ent.imagem || null,
      autor: autor || ent.autor || { id: ent.usuarioId, nome: "Usuário", plano: "FREE" },
      status: ent.status || "APROVADA",
      motivoRejeicao: ent.motivoRejeicao || null,
      votos,
      denuncias,
      createdAt: ent.createdAt
    });
  }

  // Ordena por votos desc, depois data de inscrição
  resultado.sort((a, b) => b.votos - a.votos || new Date(a.createdAt) - new Date(b.createdAt));
  return resultado;
}

/**
 * Encerra a votação de um evento antecipadamente pelo admin
 */
function encerrarVotacaoAdmin(eventoId, adminId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  const agoraIso = new Date().toISOString();
  evento.votacaoEncerraEm = agoraIso;
  evento.status = "ENCERRADO";

  store.auditoria.push({
    id: Date.now(),
    adminId: Number(adminId || 1),
    acao: "ENCERRAR_VOTACAO_EVENTO",
    alvoTipo: "EVENTO",
    alvoId: evId,
    detalhes: { eventoTitulo: evento.titulo, encerradoEm: agoraIso },
    createdAt: agoraIso
  });

  salvarStoreEventos(store);
  return { sucesso: true, mensagem: `Votação do evento "${evento.titulo}" encerrada com sucesso.` };
}

module.exports = {
  EVENTOS_INICIAIS,
  carregarStoreEventos,
  salvarStoreEventos,
  calcularFaseEvento,
  listarEventos,
  obterEventoPorId,
  inscreverReceitaOficial,
  registrarVotoComunitario,
  registrarDenuncia,
  apurarVencedorEvento,
  confirmarResultadoEvento,
  moderarEntrada,
  salvarEventoAdmin,
  listarEntradasAdmin,
  encerrarVotacaoAdmin
};
