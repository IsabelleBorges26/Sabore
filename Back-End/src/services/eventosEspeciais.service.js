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
  },
  {
    id: 3,
    titulo: "Evento Piloto Saboré — Competição e Votação",
    descricao: "Evento temporário para testar publicações, inscrições de receitas, votação comunitária e apresentação do resultado.",
    hashtag: "#PilotoSabore2026",
    bannerUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
    comecaEm: "2026-11-18T00:00:00.000-03:00",
    encerraEm: "2026-11-30T23:59:59.999-03:00",
    inscricoesIniciaEm: "2026-11-18T00:00:00.000-03:00",
    inscricoesEncerraEm: "2026-11-17T23:59:59.999-03:00",
    votacaoIniciaEm: "2026-11-18T00:00:00.000-03:00",
    votacaoEncerraEm: "2026-11-18T15:35:00.000-03:00",
    resultadoDivulgadoEm: "2026-11-18T15:35:01.000-03:00",
    emblema: "Piloto Saboré 2026",
    emblemaImg: "/assets/Emblemas/EMBLEMA.jpg",
    regras: "Crie uma receita exclusiva para o evento. Ela aparece apenas no feed das receitas concorrentes. Você pode substituí-la durante as inscrições. Na votação, cada participante vota uma vez e não pode votar na própria receita. A mais votada vence; em caso de empate, vale a inscrição aprovada primeiro.",
    status: "INSCRICOES",
    resultadoConfirmado: false,
    vencedor: null,
    temporario: true,
    tema: "piloto"
  }
];

const LOCAL_STORE_PATH = path.resolve(__dirname, "..", "data", "eventos_store.json");

function carregarStoreEventos() {
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const store = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
      if (!Array.isArray(store.participantes)) store.participantes = [];
      const pilot = store.eventos?.find(evento => evento.id === 3 && evento.temporario);
      if (pilot) pilot.regras = EVENTOS_INICIAIS[2].regras;
      return store;
    }
  } catch (err) {
    console.warn("[EventosStore] Aviso ao ler store:", err.message);
  }
  return {
    eventos: EVENTOS_INICIAIS,
    participantes: [], // { eventoId, usuarioId, createdAt }
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
    const participantesEvento = ev.temporario
      ? store.participantes.filter(p => p.eventoId === ev.id)
      : [];
    const participando = usuarioId
      ? participantesEvento.some(p => Number(p.usuarioId) === Number(usuarioId))
      : false;

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
      participantesCount: ev.temporario ? participantesEvento.length : entradasAprovadas.length,
      receitasCount: entradasAprovadas.length,
      totalVotos,
      jaInscrito: Boolean(minhaEntrada),
      participando: ev.temporario ? participando : Boolean(minhaEntrada),
      acessoLiberado: !ev.temporario || participando,
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
  const participantesEvento = evento.temporario
    ? store.participantes.filter(p => p.eventoId === idNum)
    : [];
  const participando = usuarioId
    ? participantesEvento.some(p => Number(p.usuarioId) === Number(usuarioId))
    : false;

  if (evento.temporario && !participando) {
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
      galeria: [],
      participantesCount: participantesEvento.length,
      receitasCount: entradas.length,
      totalVotos: store.votos.filter(v => v.eventoId === idNum).length,
      minhaEntrada: null,
      meuVoto: null,
      participando: false,
      acessoLiberado: false
    };
  }

  // Busca dados das receitas inscritas e autores
  const galeria = [];
  for (const ent of entradas) {
    let receita = null;
    let autor = null;

    // Receitas criadas no piloto vivem apenas no evento.
    try {
      if (ent.exclusivaEvento) throw new Error("Receita exclusiva do evento");
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
        modoPreparo: ent.modoPreparo || "Modo de preparo não informado.",
        ingredientes: ent.ingredientes || []
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
      fotos: Array.isArray(ent.fotos) && ent.fotos.length ? ent.fotos : [receita.imagem].filter(Boolean),
      video: ent.video || null,
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
      comentarios: (store.comentarios || []).filter(c => c.eventoId === idNum && c.entradaId === ent.id),
      salvosCount: (store.salvos || []).filter(s => s.eventoId === idNum && s.entradaId === ent.id).length,
      salvoPorMim: Boolean(usuarioId && (store.salvos || []).some(s => s.eventoId === idNum && s.entradaId === ent.id && Number(s.usuarioId) === Number(usuarioId))),
      avaliacoesCount: (store.avaliacoes || []).filter(a => a.eventoId === idNum && a.entradaId === ent.id).length,
      avaliacaoMedia: (() => { const items = (store.avaliacoes || []).filter(a => a.eventoId === idNum && a.entradaId === ent.id); return items.length ? Math.round(items.reduce((total, a) => total + a.nota, 0) / items.length * 10) / 10 : null; })(),
      minhaAvaliacao: (store.avaliacoes || []).find(a => a.eventoId === idNum && a.entradaId === ent.id && Number(a.usuarioId) === Number(usuarioId))?.nota || null,
      inscritoEm: ent.createdAt
    });
  }

  // Ordena a galeria pelos votos decrescentes e critério de desempate (mais antiga primeiro)
  galeria.sort((a, b) => b.votos - a.votos || new Date(a.inscritoEm) - new Date(b.inscritoEm));

  // Se o evento estiver encerrado ou resultado confirmado, anexa resultado detalhado
  let resultadoFinal = evento.vencedor ? {
    tituloReceita: evento.vencedor.receitaTitulo,
    nomeAutor: evento.vencedor.autorNome,
    totalVotos: evento.vencedor.votos,
    usuarioId: evento.vencedor.usuarioId,
    receitaId: evento.vencedor.receitaId,
    emblema: evento.emblema,
    emblemaImg: evento.emblemaImg,
    pontos: 15
  } : null;

  if (!resultadoFinal && (fase === "ENCERRADO" || evento.resultadoConfirmado) && galeria.length > 0) {
    const campea = galeria[0];
    resultadoFinal = {
      tituloReceita: campea.titulo,
      nomeAutor: campea.autor?.nome || "Cozinheiro Saboré",
      totalVotos: campea.votos,
      usuarioId: campea.autor?.id,
      receitaId: campea.receitaId,
      emblema: evento.emblema,
      emblemaImg: evento.emblemaImg,
      pontos: 15
    };

    // Auto-concessão permanente caso ainda não tenha sido concedida
    if (!evento.vencedor) {
      evento.vencedor = {
        usuarioId: campea.autor?.id,
        receitaId: campea.receitaId,
        receitaTitulo: campea.titulo,
        autorNome: campea.autor?.nome || "Cozinheiro Saboré",
        votos: campea.votos,
        confirmadoEm: new Date().toISOString()
      };
      evento.resultadoConfirmado = true;
      try {
        const { concederConquistaVencedor } = require("./conquistas.service");
        concederConquistaVencedor(Number(campea.autor?.id), {
          desafioId: evId,
          titulo: evento.emblema,
          emblema: evento.emblemaImg
        }).catch(() => {});
      } catch (e) {}

      try {
        const { registrarPontos } = require("./engajamento.service");
        registrarPontos({
          usuarioId: Number(campea.autor?.id),
          tipo: "EVENTO_VENCEDOR",
          pontos: 15,
          chaveUnica: `EVENTO_${idNum}_VENCEDOR_${campea.autor?.id}`,
          descricao: `Vencedor do evento especial: ${evento.titulo}`
        }).catch(() => {});
      } catch (e) {}

      salvarStoreEventos(store);
    }
  }

  const minhaEntrada = usuarioId ? store.entradas.find(e => e.eventoId === idNum && Number(e.usuarioId) === Number(usuarioId)) : null;
  const meuVoto = usuarioId ? store.votos.find(v => v.eventoId === idNum && Number(v.usuarioId) === Number(usuarioId)) : null;

  return {
    ...evento,
    resultado: resultadoFinal,
    inicioEm: evento.comecaEm,
    fimEm: evento.encerraEm,
    inscricoesInicioEm: evento.inscricoesIniciaEm,
    inscricoesFimEm: evento.inscricoesEncerraEm,
    votacaoInicioEm: evento.votacaoIniciaEm,
    votacaoFimEm: evento.votacaoEncerraEm,
    emblemaId: evento.emblema,
    fase,
    galeria,
    participantesCount: evento.temporario ? participantesEvento.length : galeria.length,
    receitasCount: galeria.length,
    totalVotos: store.votos.filter(v => v.eventoId === idNum).length,
    participando: evento.temporario ? participando : true,
    acessoLiberado: true,
    minhaEntrada: minhaEntrada ? {
      id: minhaEntrada.id,
      receitaId: minhaEntrada.receitaId,
      titulo: minhaEntrada.titulo,
      imagem: minhaEntrada.imagem,
      fotos: minhaEntrada.fotos || [],
      tempoPreparo: minhaEntrada.tempoPreparo,
      status: minhaEntrada.status,
      votos: store.votos.filter(v => v.entradaId === minhaEntrada.id).length
    } : null,
    meuVoto: meuVoto ? {
      entradaId: meuVoto.entradaId,
      votadoEm: meuVoto.createdAt
    } : null
  };
}

const normalizarReceita = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function validarEntradaPiloto(store, eventoId, usuarioId) {
  const evId = Number(eventoId);
  const uId = Number(usuarioId);
  const evento = store.eventos.find(e => e.id === evId);
  if (!evento || !evento.temporario) throw new Error("Evento piloto não encontrado.");
  if (!store.participantes.some(p => p.eventoId === evId && Number(p.usuarioId) === uId)) throw new Error("Participe do evento primeiro.");
  return { evId, uId, evento };
}

function criarReceitaPiloto(eventoId, usuario, dados) {
  const store = carregarStoreEventos();
  const { evId, uId, evento } = validarEntradaPiloto(store, eventoId, usuario.id);
  if (calcularFaseEvento(evento) !== "INSCRICOES") throw new Error("As inscrições não estão abertas.");
  const titulo = String(dados.titulo || "").trim().slice(0, 100);
  const descricao = String(dados.descricao || "").trim().slice(0, 400);
  const ingredientes = String(dados.ingredientes || "").split(/\r?\n/).map(item => item.trim()).filter(Boolean).slice(0, 40);
  const passos = String(dados.modoPreparo || "").split(/\r?\n/).map(item => item.trim()).filter(Boolean).slice(0, 30);
  const tempoPreparo = Number(dados.tempoPreparo);
  if (titulo.length < 4 || !ingredientes.length || !passos.length || !Number.isInteger(tempoPreparo) || tempoPreparo < 1 || tempoPreparo > 1440) throw new Error("Preencha título, tempo, ingredientes e modo de preparo.");
  if (ingredientes.some(item => item.length > 160) || passos.some(item => item.length > 500)) throw new Error("Um ingrediente ou passo é longo demais.");
  const fotos = dados.fotos;
  if (!Array.isArray(fotos) || fotos.length < 1 || fotos.length > 5 || fotos.some(foto => typeof foto !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(foto) || foto.length > 700000)) throw new Error("Adicione de 1 a 5 fotos válidas da receita.");
  const video = dados.video || null;
  if (video && (typeof video !== "string" || !/^data:video\/(mp4|webm);base64,[A-Za-z0-9+/=]+$/.test(video) || video.length > 5600000)) throw new Error("O vídeo deve ser MP4 ou WebM de até 4 MB.");
  const tituloNormalizado = normalizarReceita(titulo);
  const conteudoNormalizado = normalizarReceita(`${ingredientes.join(" ")} ${passos.join(" ")}`);
  const duplicada = store.entradas.find(entry => entry.eventoId === evId && entry.status === "APROVADA" && Number(entry.usuarioId) !== uId && (normalizarReceita(entry.titulo) === tituloNormalizado || (entry.conteudoNormalizado && entry.conteudoNormalizado === conteudoNormalizado)));
  if (duplicada) throw new Error("Uma receita com este título ou preparo já está inscrita. Publique uma receita original.");
  const anterior = store.entradas.find(entry => entry.eventoId === evId && Number(entry.usuarioId) === uId);
  if (anterior) {
    const votosAnteriores = (store.votos || []).filter(v => v.entradaId === anterior.id).length;
    if (votosAnteriores > 0) {
      throw new Error("Sua receita já possui votos computados nesta competição e não pode mais ser substituída.");
    }
  }
  const id = anterior?.id || Date.now();
  const entrada = {
    id, eventoId: evId, usuarioId: uId, receitaId: -id, exclusivaEvento: true,
    titulo, descricao, ingredientes, modoPreparo: passos.join("\n"), tempoPreparo,
    imagem: fotos[0], fotos, video, conteudoNormalizado,
    autor: { id: uId, nome: usuario.nome || "Participante", plano: usuario.plano || "FREE" },
    status: "APROVADA", createdAt: new Date().toISOString(), atualizadoEm: new Date().toISOString()
  };
  if (anterior) {
    store.entradas[store.entradas.indexOf(anterior)] = entrada;
    store.comentarios = (store.comentarios || []).filter(item => item.entradaId !== id);
    store.salvos = (store.salvos || []).filter(item => item.entradaId !== id);
    store.avaliacoes = (store.avaliacoes || []).filter(item => item.entradaId !== id);
  } else store.entradas.push(entrada);
  salvarStoreEventos(store);
  return { sucesso: true, entradaId: id, mensagem: anterior ? "Sua receita foi substituída no evento." : "Receita inscrita no evento." };
}

function interagirReceitaPiloto(eventoId, entradaId, usuario, tipo, dados = {}) {
  const store = carregarStoreEventos();
  const { evId, uId } = validarEntradaPiloto(store, eventoId, usuario.id);
  const entrada = store.entradas.find(e => e.id === Number(entradaId) && e.eventoId === evId && e.status === "APROVADA");
  if (!entrada) throw new Error("Receita não encontrada neste evento.");
  if (tipo === "comentario") {
    const texto = String(dados.texto || "").trim();
    if (texto.length < 2 || texto.length > 500) throw new Error("Escreva um comentário de 2 a 500 caracteres.");
    store.comentarios ||= [];
    store.comentarios.push({ id: Date.now(), eventoId: evId, entradaId: entrada.id, usuarioId: uId, autor: usuario.nome || "Participante", texto, createdAt: new Date().toISOString() });
  } else if (tipo === "salvar") {
    store.salvos ||= [];
    const index = store.salvos.findIndex(s => s.eventoId === evId && s.entradaId === entrada.id && Number(s.usuarioId) === uId);
    let salvo = false;
    if (index >= 0) {
      store.salvos.splice(index, 1);
      salvo = false;
    } else {
      store.salvos.push({ eventoId: evId, entradaId: entrada.id, usuarioId: uId, salvoEm: new Date().toISOString() });
      salvo = true;
    }
    salvarStoreEventos(store);
    return {
      sucesso: true,
      salvo,
      mensagem: salvo ? "Receita salva! Ela está disponível nas receitas salvas deste evento e nos seus favoritos." : "Receita removida dos salvos."
    };
  } else if (tipo === "avaliar") {
    const nota = Number(dados.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new Error("A nota deve ser de 1 a 5.");
    if (Number(entrada.usuarioId) === uId) throw new Error("Você não pode avaliar sua própria receita.");
    store.avaliacoes ||= [];
    const anterior = store.avaliacoes.find(a => a.eventoId === evId && a.entradaId === entrada.id && Number(a.usuarioId) === uId);
    if (anterior) anterior.nota = nota;
    else store.avaliacoes.push({ eventoId: evId, entradaId: entrada.id, usuarioId: uId, nota });
  } else throw new Error("Interação inválida.");
  salvarStoreEventos(store);
  return { sucesso: true };
}

function participarEvento(eventoId, usuarioId) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const uId = Number(usuarioId);
  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");
  if (!evento.temporario) throw new Error("Este evento ainda usa o fluxo de inscrição atual.");

  const fase = calcularFaseEvento(evento);
  if (fase === "EM_BREVE") throw new Error("A participação neste evento ainda não começou.");
  if (fase === "ENCERRADO") throw new Error("Este evento já foi encerrado.");

  let jaParticipava = store.participantes.some(
    p => p.eventoId === evId && Number(p.usuarioId) === uId
  );
  if (!jaParticipava) {
    store.participantes.push({ eventoId: evId, usuarioId: uId, createdAt: new Date().toISOString() });
    salvarStoreEventos(store);
  }

  return {
    sucesso: true,
    jaParticipava,
    participantesCount: store.participantes.filter(p => p.eventoId === evId).length
  };
}

/**
 * Participação nos Eventos — MODELO B
 * O usuário pode publicar várias receitas com a hashtag, mas apenas UMA será sua inscrição oficial.
 * Pode substituir a inscrição oficial enquanto as inscrições estiverem abertas e a votação não começou.
 * Durante a votação, alterações e substituições são bloqueadas.
 */
async function inscreverReceitaOficial(eventoId, usuarioId, receitaId, dadosReceita = {}, fotos = [], video = null) {
  const store = carregarStoreEventos();
  const evId = Number(eventoId);
  const uId = Number(usuarioId);
  const rId = Number(receitaId);
  const fotosValidas = Array.isArray(fotos) ? fotos.slice(0, 5).filter(foto => typeof foto === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(foto) && foto.length < 700000) : [];
  const videoValido = (typeof video === 'string' && /^data:video\/(mp4|webm|quicktime);base64,/.test(video) && video.length < 28000000) ? video : null;

  const evento = store.eventos.find(e => e.id === evId);
  if (!evento) throw new Error("Evento não encontrado.");

  if (evento.temporario && !store.participantes.some(
    p => p.eventoId === evId && Number(p.usuarioId) === uId
  )) {
    throw new Error("Participe do evento antes de inscrever sua receita.");
  }

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
    // Substitui a inscrição oficial anterior (permitido durante período de inscrições se não houver votos)
    const entradaAntiga = store.entradas[entradaExistenteIdx];
    const votosAnteriores = (store.votos || []).filter(v => v.entradaId === entradaAntiga.id).length;
    if (votosAnteriores > 0) {
      throw new Error("Sua receita já começou a receber votos na competição e não pode mais ser substituída.");
    }
    store.entradas[entradaExistenteIdx] = {
      ...entradaAntiga,
      receitaId: rId,
      titulo: receitaInfo.titulo || entradaAntiga.titulo,
      descricao: receitaInfo.descricao || "",
      imagem: (fotosValidas.length ? fotosValidas[0] : null) || receitaInfo.imagem || entradaAntiga.imagem,
      fotos: fotosValidas.length ? fotosValidas : (entradaAntiga.fotos || [receitaInfo.imagem].filter(Boolean)),
      video: videoValido !== null ? videoValido : (entradaAntiga.video || null),
      tempoPreparo: receitaInfo.tempoPreparo || entradaAntiga.tempoPreparo,
      modoPreparo: receitaInfo.modoPreparo || entradaAntiga.modoPreparo,
      ingredientes: receitaInfo.ingredientes || entradaAntiga.ingredientes || [],
      autor: receitaInfo.autor || entradaAntiga.autor,
      status: "APROVADA",
      atualizadoEm: new Date().toISOString()
    };
    store.comentarios = (store.comentarios || []).filter(item => item.entradaId !== entradaAntiga.id);
    store.salvos = (store.salvos || []).filter(item => item.entradaId !== entradaAntiga.id);
    store.avaliacoes = (store.avaliacoes || []).filter(item => item.entradaId !== entradaAntiga.id);
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
      imagem: (fotosValidas.length ? fotosValidas[0] : null) || receitaInfo.imagem || null,
      fotos: fotosValidas.length ? fotosValidas : [receitaInfo.imagem].filter(Boolean),
      video: videoValido || null,
      tempoPreparo: receitaInfo.tempoPreparo || 40,
      modoPreparo: receitaInfo.modoPreparo || "",
      ingredientes: receitaInfo.ingredientes || [],
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

  if (evento.temporario && !store.participantes.some(
    p => p.eventoId === evId && Number(p.usuarioId) === uId
  )) {
    throw new Error("Participe do evento antes de votar.");
  }

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
  participarEvento,
  inscreverReceitaOficial,
  registrarVotoComunitario,
  registrarDenuncia,
  apurarVencedorEvento,
  confirmarResultadoEvento,
  moderarEntrada,
  salvarEventoAdmin,
  listarEntradasAdmin,
  encerrarVotacaoAdmin,
  criarReceitaPiloto,
  interagirReceitaPiloto
};
