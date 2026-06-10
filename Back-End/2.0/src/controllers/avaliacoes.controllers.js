const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { receitaId, nota, comentario } = req.body;

    if (!receitaId || nota === undefined) {
        return res.status(400).json({ erro: "ID da receita e nota são obrigatórios." });
    }

    try {
        const item = await prisma.avaliacao.upsert({
            where: {
                usuarioId_receitaId: {
                    usuarioId,
                    receitaId: Number(receitaId)
                }
            },
            update: {
                nota: Number(nota),
                comentario: comentario || ""
            },
            create: {
                usuarioId,
                receitaId: Number(receitaId),
                nota: Number(nota),
                comentario: comentario || ""
            }
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao cadastrar avaliação.", detalhe: error.message });
    }
};

const listar = async (req, res) => {
    const { receitaId } = req.query;

    try {
        const filters = {};
        if (receitaId) {
            filters.receitaId = Number(receitaId);
        }

        const lista = await prisma.avaliacao.findMany({
            where: filters,
            include: {
                usuario: {
                    select: {
                        nome: true,
                        foto: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json(lista);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar avaliações.", detalhe: error.message });
    }
};

const buscar = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await prisma.avaliacao.findUnique({
            where: { id: Number(id) },
            include: { usuario: true }
        });
        if (!item) {
            return res.status(404).json({ erro: "Avaliação não encontrada." });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar avaliação.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    try {
        const evalItem = await prisma.avaliacao.findUnique({
            where: { id: Number(id) }
        });

        if (!evalItem) {
            return res.status(404).json({ erro: "Avaliação não encontrada." });
        }

        if (evalItem.usuarioId !== usuarioId) {
            return res.status(403).json({ erro: "Acesso negado. Você não é o autor desta avaliação." });
        }

        await prisma.avaliacao.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ mensagem: "Avaliação excluída com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir avaliação.", detalhe: error.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    excluir
};