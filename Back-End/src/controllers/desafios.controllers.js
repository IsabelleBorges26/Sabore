const prisma = require('../data/prisma');

const statusValidos = new Set(['RASCUNHO', 'INSCRICOES', 'ENVIO', 'VOTACAO', 'ENCERRADO']);

const buscarAtivo = () => prisma.desafio.findFirst({
  where: { status: { in: ['INSCRICOES', 'ENVIO', 'VOTACAO'] } },
  orderBy: { encerraEm: 'asc' }
});

const faseAtual = (desafio, agora = new Date()) => {
  if (desafio.status === 'ENCERRADO') return 'ENCERRADO';
  if (desafio.votacaoIniciaEm && agora >= desafio.votacaoIniciaEm && (!desafio.votacaoEncerraEm || agora <= desafio.votacaoEncerraEm)) return 'VOTACAO';
  if (desafio.votacaoEncerraEm && agora > desafio.votacaoEncerraEm) return 'ENCERRADO';
  return desafio.status;
};

const contarVotos = async (desafioId) => prisma.desafioEntrada.findMany({
  where: { desafioId },
  include: {
    usuario: { select: { id: true, nome: true, foto: true } },
    receita: { select: { id: true, titulo: true, descricao: true, imagem: true } },
    _count: { select: { votos: true } }
  }
});

const listarAtivo = async (req, res) => {
  try {
    const desafio = await buscarAtivo();
    if (!desafio) return res.status(404).json({ erro: 'Nenhum desafio ativo.' });
    const challengeKey = String(desafio.id);
    const [participantes, entradas, inscricao, meuVoto] = await Promise.all([
      prisma.desafioParticipacao.count({ where: { desafioChave: challengeKey } }),
      contarVotos(desafio.id),
      req.usuario ? prisma.desafioParticipacao.findUnique({ where: { desafioChave_usuarioId: { desafioChave: challengeKey, usuarioId: req.usuario.id } } }) : null,
      req.usuario ? prisma.desafioVoto.findUnique({ where: { desafioId_usuarioId: { desafioId: desafio.id, usuarioId: req.usuario.id } } }) : null
    ]);
    const fase = faseAtual(desafio);
    res.set('Cache-Control', 'no-store');
    res.json({
      ...desafio,
      databaseId: desafio.id,
      title: desafio.titulo,
      description: desafio.descricao,
      participantes,
      inscrito: Boolean(inscricao),
      meuVoto: meuVoto?.entradaId || null,
      fase,
      entradas: entradas.map((entry) => ({
        id: entry.id,
        receita: entry.receita,
        autor: entry.usuario,
        votos: entry._count.votos,
        meuVoto: meuVoto?.entradaId === entry.id
      })).sort((a, b) => b.votos - a.votos)
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar desafio.', detalhe: error.message });
  }
};

const participar = async (req, res) => {
  try {
    const desafio = await buscarAtivo();
    if (!desafio) return res.status(404).json({ erro: 'Nenhum desafio ativo.' });
    if (faseAtual(desafio) === 'VOTACAO' || faseAtual(desafio) === 'ENCERRADO') return res.status(409).json({ erro: 'As inscrições deste desafio foram encerradas.' });
    const desafioChave = String(desafio.id);
    await prisma.desafioParticipacao.upsert({
      where: { desafioChave_usuarioId: { desafioChave, usuarioId: req.usuario.id } },
      update: {},
      create: { desafioChave, usuarioId: req.usuario.id }
    });
    res.json({ inscrito: true, participantes: await prisma.desafioParticipacao.count({ where: { desafioChave } }) });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao participar do desafio.', detalhe: error.message });
  }
};

const enviarEntrada = async (req, res) => {
  try {
    const desafio = await buscarAtivo();
    const receitaId = Number(req.body.receitaId);
    if (!desafio || !Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: 'Desafio ou receita inválida.' });
    if (faseAtual(desafio) === 'VOTACAO' || faseAtual(desafio) === 'ENCERRADO') return res.status(409).json({ erro: 'O período de envio terminou.' });
    const desafioChave = String(desafio.id);
    const inscricao = await prisma.desafioParticipacao.findUnique({ where: { desafioChave_usuarioId: { desafioChave, usuarioId: req.usuario.id } } });
    if (!inscricao) return res.status(403).json({ erro: 'Inscreva-se antes de enviar uma receita.' });
    const receita = await prisma.receita.findFirst({
      where: { id: receitaId, usuarioId: req.usuario.id, publica: true, rascunho: false },
      include: { hashtags: { include: { hashtag: true } } }
    });
    if (!receita) return res.status(404).json({ erro: 'Receita pública não encontrada.' });
    const tags = receita.hashtags.map((item) => item.hashtag.nome.toLowerCase().replace(/^#/, ''));
    if (!tags.includes(desafio.hashtag.toLowerCase().replace(/^#/, ''))) return res.status(400).json({ erro: `Inclua a hashtag oficial ${desafio.hashtag} na publicação.` });
    const entrada = await prisma.desafioEntrada.upsert({
      where: { receitaId },
      update: {},
      create: { desafioId: desafio.id, usuarioId: req.usuario.id, receitaId }
    });
    res.status(201).json(entrada);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao enviar entrada.', detalhe: error.message });
  }
};

const votar = async (req, res) => {
  try {
    const desafio = await buscarAtivo();
    const entradaId = Number(req.body.entradaId);
    if (!desafio || faseAtual(desafio) !== 'VOTACAO') return res.status(403).json({ erro: 'A votação não está aberta.' });
    if (desafio.votacaoEncerraEm && new Date() > desafio.votacaoEncerraEm) return res.status(403).json({ erro: 'A votação foi encerrada.' });
    const desafioChave = String(desafio.id);
    const inscrito = await prisma.desafioParticipacao.findUnique({ where: { desafioChave_usuarioId: { desafioChave, usuarioId: req.usuario.id } } });
    if (!inscrito) return res.status(403).json({ erro: 'Somente participantes inscritos podem votar.' });
    const votoExistente = await prisma.desafioVoto.findUnique({ where: { desafioId_usuarioId: { desafioId: desafio.id, usuarioId: req.usuario.id } } });
    if (votoExistente) return res.status(409).json({ erro: 'VocÃª jÃ¡ votou neste desafio.' });
    const entrada = await prisma.desafioEntrada.findFirst({ where: { id: entradaId, desafioId: desafio.id } });
    if (!entrada) return res.status(404).json({ erro: 'Entrada não encontrada.' });
    if (entrada.usuarioId === req.usuario.id) return res.status(403).json({ erro: 'Você não pode votar na própria receita.' });
    const voto = await prisma.desafioVoto.upsert({
      where: { desafioId_usuarioId: { desafioId: desafio.id, usuarioId: req.usuario.id } },
      update: { entradaId },
      create: { desafioId: desafio.id, entradaId, usuarioId: req.usuario.id }
    });
    res.json(voto);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registrar voto.', detalhe: error.message });
  }
};

const criar = async (req, res) => {
  const { titulo, descricao, hashtag, tipo, comecaEm, encerraEm, votacaoIniciaEm, votacaoEncerraEm, premioProMeses = 0, emblema, molduraPerfil } = req.body;
  const inicio = new Date(comecaEm);
  const fim = new Date(encerraEm);
  if (!titulo?.trim() || !descricao?.trim() || !hashtag?.trim() || !['HASHTAG', 'CRIATIVIDADE', 'META'].includes(tipo) || Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
    return res.status(400).json({ erro: 'Informe título, descrição, hashtag, tipo e um período válido.' });
  }
  try {
    const desafio = await prisma.desafio.create({ data: {
      titulo: titulo.trim(), descricao: descricao.trim(), hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
      tipo, status: 'INSCRICOES', comecaEm: inicio, encerraEm: fim,
      votacaoIniciaEm: votacaoIniciaEm ? new Date(votacaoIniciaEm) : null,
      votacaoEncerraEm: votacaoEncerraEm ? new Date(votacaoEncerraEm) : null,
      premioProMeses: Math.max(0, Math.min(12, Number(premioProMeses) || 0)),
      emblema: emblema || 'Campeão da Comunidade', molduraPerfil: molduraPerfil || 'desafio-vencedor', criadoPorId: req.usuario.id
    } });
    res.status(201).json(desafio);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar desafio.', detalhe: error.message });
  }
};

const atualizarStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!Number.isSafeInteger(id) || !statusValidos.has(status)) return res.status(400).json({ erro: 'Desafio ou etapa inválida.' });
  try {
    const desafio = await prisma.desafio.update({ where: { id }, data: { status } });
    res.json(desafio);
  } catch (error) { res.status(500).json({ erro: 'Erro ao atualizar etapa.', detalhe: error.message }); }
};

const finalizar = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const desafio = await tx.desafio.findUnique({ where: { id } });
      if (!desafio) throw new Error('Desafio não encontrado.');
      const ranking = await tx.desafioEntrada.findMany({
        where: { desafioId: id },
        include: { _count: { select: { votos: true } } },
        orderBy: { votos: { _count: 'desc' } }
      });
      const vencedor = ranking[0];
      if (!vencedor) {
        await tx.desafio.update({ where: { id }, data: { status: 'ENCERRADO' } });
        return { desafioId: id, vencedor: null, ranking: [] };
      }
      const user = await tx.usuario.findUnique({ where: { id: vencedor.usuarioId }, select: { id: true, nome: true } });
      await tx.conquistaUsuario.create({ data: {
        usuarioId: user.id, desafioId: id, titulo: desafio.emblema || `Vencedor: ${desafio.titulo}`,
        emblema: desafio.emblema || 'fa-solid fa-trophy', molduraPerfil: desafio.molduraPerfil || 'desafio-vencedor'
      } });
      if (desafio.premioProMeses > 0) {
        const inicioEm = new Date();
        const expiraEm = new Date(inicioEm);
        expiraEm.setMonth(expiraEm.getMonth() + desafio.premioProMeses);
        const mesVigencia = `desafio-${id}-${user.id}`;
        await tx.concessaoPro.create({ data: {
          usuarioId: user.id, mesReferencia: `desafio-${id}`, mesVigencia, posicao: 1,
          pontos: vencedor._count.votos, inicioEm, expiraEm, ativo: true
        } });
        await tx.usuario.update({ where: { id: user.id }, data: { plano: 'PRO' } });
      }
      await tx.desafio.update({ where: { id }, data: { status: 'ENCERRADO' } });
      return { desafioId: id, vencedor: user, ranking: ranking.map((entry) => ({ entradaId: entry.id, usuarioId: entry.usuarioId, votos: entry._count.votos })) };
    });
    res.json(resultado);
  } catch (error) { res.status(500).json({ erro: 'Erro ao encerrar desafio.', detalhe: error.message }); }
};

const listarConquistas = async (req, res) => {
  const requestedId = Number(req.params.usuarioId);
  const usuarioId = Number.isSafeInteger(requestedId) && requestedId > 0 ? requestedId : req.usuario.id;
  try {
    const conquistas = await prisma.conquistaUsuario.findMany({ where: { usuarioId }, orderBy: { concedidaEm: 'desc' } });
    res.json(conquistas);
  } catch (error) { res.status(500).json({ erro: 'Erro ao carregar conquistas.', detalhe: error.message }); }
};

module.exports = { listarAtivo, participar, enviarEntrada, votar, criar, atualizarStatus, finalizar, listarConquistas };
