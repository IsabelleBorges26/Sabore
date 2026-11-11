const prisma = require("../data/prisma");
const { withDirectDatabaseFallback } = require("../data/databaseFallback");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registrarAcessoDiario, registrarPerfilCompleto } = require("../services/engajamento.service");

const JWT_SECRET = process.env.JWT_SECRET || "sabore-secret-key-12345";

const defaultBooks = [
    { titulo: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot', tag: 'Coleção' },
    { titulo: 'Fitness', emoji: 'fa-solid fa-leaf', tag: 'Coleção' },
    { titulo: 'Sobremesas', emoji: 'fa-solid fa-cake-candles', tag: 'Coleção' },
    { titulo: 'Favoritas', emoji: 'fa-solid fa-heart', tag: 'Coleção' },
    { titulo: 'Receitas Rápidas', emoji: 'fa-solid fa-bolt', tag: 'Coleção' }
];

const criarLivrosPadrao = async (usuarioId) => {
    for (const book of defaultBooks) {
        await prisma.livro.create({
            data: {
                titulo: book.titulo,
                emoji: book.emoji,
                tag: book.tag,
                usuarioId
            }
        });
    }
};

const cadastrar = async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }
    try {
        const existe = await prisma.usuario.findUnique({
            where: { email }
        });
        if (existe) {
            return res.status(400).json({ erro: "Este e-mail já está em uso." });
        }
        const senhaHash = bcrypt.hashSync(senha, 10);
        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: senhaHash
            }
        });
        await criarLivrosPadrao(usuario.id);

        await registrarAcessoDiario(usuario.id).catch(() => {});

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nome: usuario.nome },
            JWT_SECRET,
            { expiresIn: "30d" }
        );
        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano,
                foto: usuario.foto,
                isAdmin: usuario.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao cadastrar usuário.", detalhe: error.message });
    }
};

const login = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });
    }
    try {
        const usuario = await withDirectDatabaseFallback((db) => db.usuario.findUnique({
            where: { email }
        }), "efetuar login");
        if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos." });
        }

        await registrarAcessoDiario(usuario.id).catch(() => {});

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nome: usuario.nome },
            JWT_SECRET,
            { expiresIn: "30d" }
        );
        res.status(200).json({
            mensagem: "Login efetuado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano,
                foto: usuario.foto,
                isAdmin: usuario.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao efetuar login.", detalhe: error.message });
    }
};

const loginGoogle = async (req, res) => {
    const { email, nome, foto } = req.body;
    if (!email) {
        return res.status(400).json({ erro: "E-mail do Google é obrigatório." });
    }
    try {
        let usuario = await prisma.usuario.findUnique({
            where: { email }
        });
        if (!usuario) {
            const senhaHash = bcrypt.hashSync(Math.random().toString(36).substring(2, 10), 10);
            usuario = await prisma.usuario.create({
                data: {
                    nome: nome || email.split("@")[0],
                    email,
                    senha: senhaHash,
                    foto: foto || null
                }
            });
            await criarLivrosPadrao(usuario.id);
        } else if (foto && !usuario.foto) {
            usuario = await prisma.usuario.update({
                where: { id: usuario.id },
                data: { foto }
            });
        }

        await registrarAcessoDiario(usuario.id).catch(() => {});

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nome: usuario.nome },
            JWT_SECRET,
            { expiresIn: "30d" }
        );
        res.status(200).json({
            mensagem: "Login com Google efetuado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                plano: usuario.plano,
                foto: usuario.foto,
                isAdmin: usuario.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao efetuar login com Google.", detalhe: error.message });
    }
};

const perfil = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        await registrarAcessoDiario(usuarioId).catch(() => {});

        const usuario = await withDirectDatabaseFallback((db) => db.usuario.findUnique({
            where: { id: usuarioId },
            include: {
                _count: {
                    select: {
                        receitas: true,
                        favoritos: true,
                        livros: true
                    }
                },
                receitas: {
                    select: {
                        criadaPorIA: true
                    }
                }
            }
        }), "carregar perfil");
        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        const aiGeneratedCount = usuario.receitas.filter(r => r.criadaPorIA).length;

        let engajamentoInfo = {
            pontosMes: 0,
            posicaoRanking: 1,
            totalParticipantes: 1,
            naZonaPro: false,
            pontosParaTop5: 0
        };

        try {
            const { getMesReferencia, obterRankingMensal } = require("../services/engajamento.service");
            const mesAtual = getMesReferencia();

            const [pontosAgregados, rankingData] = await withDirectDatabaseFallback((db) => Promise.all([
                db.atividadeEngajamento.aggregate({
                    where: { usuarioId, mesReferencia: mesAtual },
                    _sum: { pontos: true }
                }),
                obterRankingMensal(mesAtual, db)
            ]), "carregar engajamento");

            const pontosMes = pontosAgregados._sum.pontos || 0;
            const infoRanking = rankingData.ranking.find(r => r.usuarioId === usuarioId);
            const posicaoRanking = infoRanking ? infoRanking.posicao : rankingData.totalParticipantes;
            const top5 = rankingData.ranking.slice(0, 5);
            const quintoColocado = top5[4] || top5[top5.length - 1];
            const pontosParaTop5 = quintoColocado && quintoColocado.pontos > pontosMes
                ? (quintoColocado.pontos - pontosMes) + 1
                : 0;

            engajamentoInfo = {
                pontosMes,
                posicaoRanking,
                totalParticipantes: rankingData.totalParticipantes,
                naZonaPro: infoRanking ? infoRanking.naZonaPro : false,
                pontosParaTop5
            };
        } catch (engajamentoError) {
            console.warn("[Perfil] Não foi possível carregar estatísticas de engajamento:", engajamentoError.message);
        }

        const { obterConquistasUsuario, obterMolduraAtiva, obterMoldurasUsuario, equiparMoldura } = require("../services/conquistas.service");
        const conquistasUsuario = await obterConquistasUsuario(usuarioId);
        const molduraAtiva = obterMolduraAtiva(usuarioId);

        res.status(200).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            plano: usuario.plano,
            foto: usuario.foto,
            isAdmin: usuario.isAdmin,
            molduraAtiva: molduraAtiva || usuario.molduraAtiva || null,
            conquistas: conquistasUsuario || [],
            engajamento: engajamentoInfo,
            stats: {
                saved: usuario._count.favoritos,
                created: usuario._count.receitas,
                aiGenerated: aiGeneratedCount,
                booksCount: usuario._count.livros
            }
        });
    } catch (error) {
        console.error("[Perfil] Erro ao carregar perfil:", error);
        res.status(500).json({ erro: "Erro ao obter perfil do usuário.", detalhe: error.message });
    }
};

const listarConquistasUsuario = async (req, res) => {
    try {
        const { obterConquistasUsuario } = require("../services/conquistas.service");
        const targetId = req.params.usuarioId ? Number(req.params.usuarioId) : req.usuario.id;
        const conquistas = await obterConquistasUsuario(targetId);
        res.status(200).json(conquistas);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao listar conquistas.", detalhe: err.message });
    }
};

const listarMoldurasUsuario = async (req, res) => {
    try {
        const { obterMoldurasUsuario } = require("../services/conquistas.service");
        const resultado = await obterMoldurasUsuario(req.usuario.id);
        res.status(200).json(resultado);
    } catch (err) {
        res.status(500).json({ erro: "Erro ao listar molduras.", detalhe: err.message });
    }
};

const atualizarMolduraUsuario = async (req, res) => {
    try {
        const { equiparMoldura } = require("../services/conquistas.service");
        const moldura = req.body.moldura !== undefined ? req.body.moldura : req.body.molduraId;
        const resultado = await equiparMoldura(req.usuario.id, moldura);
        res.status(200).json(resultado);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                foto: true,
                plano: true,
                isAdmin: true,
                _count: { select: { receitas: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.status(200).json(lista);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar usuários.", detalhe: error.message });
    }
};

const buscar = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await prisma.usuario.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                nome: true,
                email: true,
                foto: true,
                plano: true,
                isAdmin: true
            }
        });
        if (!item) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar usuário.", detalhe: error.message });
    }
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, foto } = req.body;

    if (req.usuario.id !== Number(id)) {
        return res.status(403).json({ erro: "Acesso negado. Você não pode atualizar os dados de outro usuário." });
    }
    try {
        const dados = {};
        if (nome) dados.nome = nome;
        if (email) dados.email = email;
        if (foto !== undefined) dados.foto = foto;
        if (senha) {
            dados.senha = bcrypt.hashSync(senha, 10);
        }
        const item = await prisma.usuario.update({
            where: { id: Number(id) },
            data: dados
        });

        if (item.foto && item.nome && item.email) {
            await registrarPerfilCompleto(item.id).catch(() => {});
        }

        res.status(200).json({
            id: item.id,
            nome: item.nome,
            email: item.email,
            plano: item.plano,
            foto: item.foto,
            isAdmin: item.isAdmin
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar usuário.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const { id } = req.params;
    if (req.usuario.id !== Number(id)) {
        return res.status(403).json({ erro: "Acesso negado. Você não pode excluir a conta de outro usuário." });
    }
    try {
        await prisma.usuario.delete({
            where: { id: Number(id) }
        });
        res.status(200).json({ mensagem: "Usuário excluído com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir usuário.", detalhe: error.message });
    }
};

module.exports = {
    cadastrar,
    login,
    loginGoogle,
    perfil,
    listar,
    buscar,
    atualizar,
    excluir,
    listarConquistasUsuario,
    listarMoldurasUsuario,
    atualizarMolduraUsuario
};
