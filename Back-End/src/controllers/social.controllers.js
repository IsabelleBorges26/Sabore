const prisma = require("../data/prisma");

const profileSelect = {
    id: true,
    nome: true,
    foto: true,
    _count: {
        select: {
            receitas: { where: { publica: true } },
            seguidores: true,
            seguindo: true
        }
    }
};

const listarPerfis = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        const [perfis, seguindo] = await Promise.all([
            prisma.usuario.findMany({
                where: { id: { not: usuarioId } },
                select: profileSelect,
                orderBy: { createdAt: "desc" }
            }),
            prisma.seguidor.findMany({
                where: { seguidorId: usuarioId },
                select: { seguidoId: true }
            })
        ]);
        const seguidos = new Set(seguindo.map(item => item.seguidoId));
        res.status(200).json(perfis.map(perfil => ({
            id: perfil.id,
            nome: perfil.nome,
            foto: perfil.foto,
            receitasPublicas: perfil._count.receitas,
            seguidores: perfil._count.seguidores,
            seguindo: perfil._count.seguindo,
            seguindoVoce: seguidos.has(perfil.id)
        })));
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar perfis da comunidade.", detalhe: error.message });
    }
};

const meuResumo = async (req, res) => {
    try {
        const perfil = await prisma.usuario.findUnique({
            where: { id: req.usuario.id },
            select: profileSelect
        });
        res.status(200).json({
            seguidores: perfil?._count.seguidores || 0,
            seguindo: perfil?._count.seguindo || 0,
            receitasPublicas: perfil?._count.receitas || 0
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar seu resumo social.", detalhe: error.message });
    }
};

const seguir = async (req, res) => {
    const seguidorId = req.usuario.id;
    const seguidoId = Number(req.params.usuarioId);
    if (!Number.isInteger(seguidoId) || seguidoId <= 0 || seguidoId === seguidorId) {
        return res.status(400).json({ erro: "Escolha outro usuário para seguir." });
    }
    try {
        const usuario = await prisma.usuario.findUnique({ where: { id: seguidoId }, select: { id: true } });
        if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
        await prisma.seguidor.upsert({
            where: { seguidorId_seguidoId: { seguidorId, seguidoId } },
            update: {},
            create: { seguidorId, seguidoId }
        });
        res.status(200).json({ seguindo: true });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível seguir este usuário.", detalhe: error.message });
    }
};

const deixarDeSeguir = async (req, res) => {
    const seguidorId = req.usuario.id;
    const seguidoId = Number(req.params.usuarioId);
    try {
        await prisma.seguidor.deleteMany({ where: { seguidorId, seguidoId } });
        res.status(200).json({ seguindo: false });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível deixar de seguir este usuário.", detalhe: error.message });
    }
};

module.exports = { listarPerfis, meuResumo, seguir, deixarDeSeguir };
