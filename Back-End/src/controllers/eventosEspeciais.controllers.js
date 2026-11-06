const {
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
  encerrarVotacaoAdmin,
  carregarStoreEventos
} = require("../services/eventosEspeciais.service");

// GET /desafios/eventos
const listar = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id || null;
    const eventos = listarEventos(usuarioId);
    res.set("Cache-Control", "no-store");
    res.status(200).json(eventos);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar eventos especiais.", detalhe: err.message });
  }
};

// GET /desafios/eventos/:id
const detalhar = async (req, res) => {
  try {
    const id = req.params.id;
    const usuarioId = req.usuario?.id || null;
    const evento = await obterEventoPorId(id, usuarioId);
    if (!evento) {
      return res.status(404).json({ erro: "Evento especial não encontrado." });
    }
    res.set("Cache-Control", "no-store");
    res.status(200).json(evento);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar detalhes do evento.", detalhe: err.message });
  }
};

// POST /desafios/eventos/:id/participar (Inscrição Oficial — Modelo B)
const inscrever = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const usuarioId = req.usuario.id;
    const { receitaId, dadosReceita } = req.body;

    if (!receitaId) {
      return res.status(400).json({ erro: "Selecione uma receita válida para sua inscrição oficial." });
    }

    const resultado = await inscreverReceitaOficial(eventoId, usuarioId, receitaId, dadosReceita);
    res.status(201).json(resultado);
  } catch (err) {
    const status = err.message.includes("encerrado") || err.message.includes("começaram") || err.message.includes("autoria") ? 403 : 400;
    res.status(status).json({ erro: err.message });
  }
};

// POST /desafios/eventos/:id/votar (Votação Comunitária)
const votar = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const usuarioId = req.usuario.id;
    const { entradaId } = req.body;

    if (!entradaId) {
      return res.status(400).json({ erro: "Selecione uma receita da galeria para votar." });
    }

    const resultado = await registrarVotoComunitario(eventoId, usuarioId, entradaId);
    res.status(200).json(resultado);
  } catch (err) {
    const status = err.message.includes("já votou") ? 409 : (err.message.includes("própria") || err.message.includes("encerrada") ? 403 : 400);
    res.status(status).json({ erro: err.message });
  }
};

// POST /desafios/eventos/:id/denunciar
const denunciar = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const usuarioId = req.usuario.id;
    const { entradaId, motivo } = req.body;

    const resultado = registrarDenuncia(eventoId, usuarioId, entradaId, motivo);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao registrar denúncia.", detalhe: err.message });
  }
};

// Admin: Criar / Editar Evento
const salvarEvento = async (req, res) => {
  try {
    const dados = { ...req.body, id: req.params.id ? Number(req.params.id) : req.body.id };
    if (!dados.titulo || !dados.hashtag || !dados.comecaEm || !dados.encerraEm) {
      return res.status(400).json({ erro: "Título, hashtag e período do evento são obrigatórios." });
    }
    const evento = salvarEventoAdmin(dados, req.usuario.id);
    res.status(200).json(evento);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar evento especial.", detalhe: err.message });
  }
};

// Admin: Moderar Inscrição (Aprovar / Rejeitar)
const moderar = async (req, res) => {
  try {
    const { id: eventoId, entradaId } = req.params;
    const { status, motivo } = req.body;
    const resultado = moderarEntrada(eventoId, entradaId, status, motivo, req.usuario.id);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao moderar inscrição.", detalhe: err.message });
  }
};

// Admin: Confirmar Resultado Oficial e conceder premiação
const confirmarResultado = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const resultado = await confirmarResultadoEvento(eventoId, req.usuario.id);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao confirmar resultado do evento.", detalhe: err.message });
  }
};

// Admin: Listar Auditoria e Denúncias
const auditoria = async (req, res) => {
  try {
    const store = carregarStoreEventos();
    res.status(200).json({
      auditoria: store.auditoria || [],
      denuncias: store.denuncias || []
    });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao carregar registros de auditoria.", detalhe: err.message });
  }
};

// Admin: Listar todas as inscrições para moderação
const listarEntradas = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const entradas = await listarEntradasAdmin(eventoId);
    res.status(200).json(entradas);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar inscrições para moderação.", detalhe: err.message });
  }
};

// Admin: Encerrar votação antecipadamente
const encerrarVotacao = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const resultado = encerrarVotacaoAdmin(eventoId, req.usuario.id);
    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao encerrar votação do evento.", detalhe: err.message });
  }
};

module.exports = {
  listar,
  detalhar,
  inscrever,
  votar,
  denunciar,
  salvarEvento,
  moderar,
  confirmarResultado,
  auditoria,
  listarEntradas,
  encerrarVotacao
};

