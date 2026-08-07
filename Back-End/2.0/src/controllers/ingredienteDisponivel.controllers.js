const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: "O nome do ingrediente é obrigatório." });
    }

    try {
        const cleanNome = nome.trim().toLowerCase();

        const ingrediente = await prisma.ingrediente.upsert({
            where: { nome: cleanNome },
            update: {},
            create: { nome: cleanNome }
        });

        const item = await prisma.ingredienteDisponivel.upsert({
            where: {
                usuarioId_ingredienteId: {
                    usuarioId,
                    ingredienteId: ingrediente.id
                }
            },
            update: {},
            create: {
                usuarioId,
                ingredienteId: ingrediente.id
            }
        });

        res.status(201).json({ nome: ingrediente.nome });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao adicionar ingrediente à despensa.", detalhe: error.message });
    }
};

const listar = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const lista = await prisma.ingredienteDisponivel.findMany({
            where: { usuarioId },
            include: { ingrediente: true }
        });

        const nomes = lista.map(item => {
            const n = item.ingrediente.nome;
            return n.charAt(0).toUpperCase() + n.slice(1);
        });

        res.status(200).json(nomes);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao listar despensa.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const { nome } = req.params;
    const usuarioId = req.usuario.id;

    if (!nome) {
        return res.status(400).json({ erro: "O nome do ingrediente é obrigatório." });
    }

    try {
        const cleanNome = nome.trim().toLowerCase();

        const ingrediente = await prisma.ingrediente.findUnique({
            where: { nome: cleanNome }
        });

        if (!ingrediente) {
            return res.status(404).json({ erro: "Ingrediente não encontrado." });
        }

        await prisma.ingredienteDisponivel.delete({
            where: {
                usuarioId_ingredienteId: {
                    usuarioId,
                    ingredienteId: ingrediente.id
                }
            }
        });

        res.status(200).json({ mensagem: "Ingrediente removido com sucesso da despensa." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir ingrediente da despensa.", detalhe: error.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    excluir
};