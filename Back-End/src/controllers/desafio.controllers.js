const {
  obterDesafioAtual,
  publicarParticipacao,
  verificarParticipacaoUsuario,
  listarDesafiosAnteriores
} = require("../services/desafio.service");

// GET /desafios/atual — Retorna o desafio da semana atual
const obterAtual = async (req, res) => {
  try {
    const desafio = await obterDesafioAtual();

    // Se usuário estiver autenticado, verifica se já participou
    let participacaoUsuario = null;
    if (req.usuario?.id) {
      participacaoUsuario = await verificarParticipacaoUsuario(req.usuario.id, desafio.id);
    }

    res.status(200).json({
      desafio: {
        id: desafio.id,
        semanaChave: desafio.semanaChave,
        titulo: desafio.titulo,
        descricao: desafio.descricao,
        tema: desafio.tema,
        orientacoes: desafio.orientacoes,
        pontosRecompensa: desafio.pontosRecompensa,
        ativo: desafio.ativo,
        inicioEm: desafio.inicioEm,
        fimEm: desafio.fimEm,
        totalParticipacoes: desafio.participacoes?.length || 0,
        participacoes: (desafio.participacoes || []).slice(0, 10)
      },
      participacaoUsuario
    });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao carregar desafio da semana.", detalhe: error.message });
  }
};

// POST /desafios/publicar — Publica participação e concede pontos
const publicar = async (req, res) => {
  const usuarioId = req.usuario.id;
  const { desafioId, nomeReceita, descricaoPreparacao, foto } = req.body;

  if (!desafioId || !nomeReceita || !descricaoPreparacao) {
    return res.status(400).json({
      erro: "Dados incompletos.",
      detalhe: "desafioId, nomeReceita e descricaoPreparacao são obrigatórios."
    });
  }

  try {
    const resultado = await publicarParticipacao(
      usuarioId,
      parseInt(desafioId),
      { nomeReceita, descricaoPreparacao, foto }
    );
    res.status(201).json(resultado);
  } catch (error) {
    const statusCode = error.message.includes("já publicou") ? 409 : 400;
    res.status(statusCode).json({ erro: error.message });
  }
};

// GET /desafios/historico — Desafios anteriores
const historico = async (req, res) => {
  try {
    const desafios = await listarDesafiosAnteriores(12);
    res.status(200).json(desafios);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao carregar histórico de desafios.", detalhe: error.message });
  }
};

module.exports = { obterAtual, publicar, historico };
