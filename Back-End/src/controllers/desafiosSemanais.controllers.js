const {
  listarTodosDesafios,
  obterDesafioSemanalAtivo,
  verificarParticipacaoDesafio,
  contarParticipantes,
  listarParticipacoesAdmin,
  salvarStoreLocal,
  carregarStoreLocal
} = require("../services/desafiosSemanais.service");

// GET /desafios/semanal/atual (ou /desafios/atual)
const obterAtual = async (req, res) => {
  try {
    const desafio = obterDesafioSemanalAtivo();
    if (!desafio) {
      return res.status(404).json({ erro: "Nenhum desafio semanal ativo no momento." });
    }

    const usuarioId = req.usuario?.id || null;
    const [participacaoUsuario, totalParticipantes] = await Promise.all([
      usuarioId ? verificarParticipacaoDesafio(usuarioId, desafio.id) : null,
      contarParticipantes(desafio.id)
    ]);

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      desafio: {
        id: desafio.id,
        semanaChave: desafio.semanaChave,
        titulo: desafio.titulo,
        descricao: desafio.descricao,
        tema: desafio.tema,
        hashtag: desafio.hashtag,
        imagem: desafio.imagem,
        orientacoes: desafio.orientacoes,
        pontosRecompensa: desafio.pontosRecompensa || 30,
        inicioEm: desafio.inicioEm,
        fimEm: desafio.fimEm,
        statusTempo: desafio.statusTempo,
        totalParticipacoes: totalParticipantes
      },
      participacaoUsuario: participacaoUsuario ? {
        id: participacaoUsuario.id,
        nomeReceita: participacaoUsuario.nomeReceita,
        foto: participacaoUsuario.foto,
        pontosConcedidos: participacaoUsuario.pontosConcedidos || 30,
        createdAt: participacaoUsuario.createdAt
      } : null,
      jaConcluido: Boolean(participacaoUsuario),
      pontosConquistados: participacaoUsuario ? (participacaoUsuario.pontosConcedidos || 30) : 0
    });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao obter desafio semanal.", detalhe: err.message });
  }
};

// GET /desafios/semanal/programados — Lista todos os desafios programados
const listarProgramados = async (req, res) => {
  try {
    const desafios = listarTodosDesafios();
    res.status(200).json(desafios);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar desafios.", detalhe: err.message });
  }
};

// POST /desafios/semanal/participar — Registra intenção de participar
const participar = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const desafio = obterDesafioSemanalAtivo();
    if (!desafio || desafio.statusTempo !== "ATIVO") {
      return res.status(400).json({ erro: "Não há desafio ativo para participar no momento." });
    }

    const participacao = await verificarParticipacaoDesafio(usuarioId, desafio.id);
    res.status(200).json({
      inscrito: true,
      desafioId: desafio.id,
      hashtag: desafio.hashtag,
      jaConcluido: Boolean(participacao),
      mensagem: participacao
        ? "Você já concluiu este desafio e garantiu seus 30 pontos!"
        : `Publique uma receita com a hashtag ${desafio.hashtag} para ganhar +30 pontos no Ranking Mensal.`
    });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao registrar participação.", detalhe: err.message });
  }
};

// Admin: Criar / Editar Desafio Semanal
const salvarDesafioAdmin = async (req, res) => {
  try {
    const { id, titulo, descricao, tema, hashtag, orientacoes, imagem, inicioEm, fimEm } = req.body;
    if (!titulo || !hashtag || !inicioEm || !fimEm) {
      return res.status(400).json({ erro: "Título, hashtag, data de início e fim são obrigatórios." });
    }

    const store = carregarStoreLocal();
    const cleanHashtag = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
    let item = null;

    if (id) {
      const idx = store.desafiosCustomizados.findIndex(d => d.id === Number(id));
      if (idx >= 0) {
        store.desafiosCustomizados[idx] = {
          ...store.desafiosCustomizados[idx],
          titulo, descricao, tema, hashtag: cleanHashtag, orientacoes, imagem, inicioEm, fimEm
        };
        item = store.desafiosCustomizados[idx];
      }
    }

    if (!item) {
      item = {
        id: Date.now(),
        semanaChave: `custom_${Date.now()}`,
        titulo, descricao, tema: tema || "Geral",
        hashtag: cleanHashtag,
        orientacoes: orientacoes || "Prepare sua receita com a hashtag oficial e participe!",
        imagem: imagem || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80",
        inicioEm, fimEm,
        pontosRecompensa: 30,
        ativo: true
      };
      store.desafiosCustomizados.push(item);
    }

    salvarStoreLocal(store);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao salvar desafio semanal.", detalhe: err.message });
  }
};

// Admin: Encerrar Desafio Semanal antecipadamente
const encerrarDesafioAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const store = carregarStoreLocal();
    const desafio = store.desafiosCustomizados.find(d => d.id === id);
    if (desafio) {
      desafio.ativo = false;
      desafio.fimEm = new Date().toISOString();
      salvarStoreLocal(store);
    }
    res.status(200).json({ sucesso: true, mensagem: "Desafio encerrado com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: "Erro ao encerrar desafio.", detalhe: err.message });
  }
};

// Admin: Listar Participações e Pontos Concedidos
const listarParticipacoes = async (req, res) => {
  try {
    const desafioId = req.query.desafioId || null;
    const lista = await listarParticipacoesAdmin(desafioId);
    res.status(200).json(lista);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao listar participações de desafios.", detalhe: err.message });
  }
};

module.exports = {
  obterAtual,
  listarProgramados,
  participar,
  salvarDesafioAdmin,
  encerrarDesafioAdmin,
  listarParticipacoes
};

