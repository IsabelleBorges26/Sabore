const prisma = require("../data/prisma");

const listar = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const livros = await prisma.livro.findMany({
            where: { usuarioId },
            include: {
                _count: {
                    select: { receitas: true }
                }
            }
        });

        const listaFormatada = livros.map(livro => ({
            id: livro.id,
            titulo: livro.titulo,
            title: livro.titulo,
            emoji: livro.emoji,
            tag: livro.tag,
            _count: { receitas: livro._count.receitas },
            count: livro._count.receitas,
            createdAt: livro.createdAt,
            updatedAt: livro.updatedAt
        }));

        res.status(200).json(listaFormatada);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar livros de receitas.", detalhe: error.message });
    }
};

const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { titulo, emoji, tag } = req.body;

    if (!titulo) {
        return res.status(400).json({ erro: "O título do livro é obrigatório." });
    }

    try {
        const livro = await prisma.livro.create({
            data: {
                titulo,
                emoji: emoji || "fa-solid fa-book",
                tag: tag || "Pessoal",
                usuarioId
            }
        });

        res.status(201).json({
            id: livro.id,
            titulo: livro.titulo,
            title: livro.titulo,
            emoji: livro.emoji,
            tag: livro.tag,
            count: 0,
            _count: { receitas: 0 }
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao criar livro de receitas.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    try {
        const livro = await prisma.livro.findFirst({
            where: {
                id: Number(id),
                usuarioId
            }
        });

        if (!livro) {
            return res.status(404).json({ erro: "Livro de receitas não encontrado." });
        }

        await prisma.livro.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ mensagem: "Livro de receitas excluído com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir livro de receitas.", detalhe: error.message });
    }
};

module.exports = {
    listar,
    cadastrar,
    excluir
};
