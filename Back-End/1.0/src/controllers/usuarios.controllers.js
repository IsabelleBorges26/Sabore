const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const data = req.body;

    const item = await prisma.usuario.create({
        data
    });

    res.json(item).status(201).end();
};

const listar = async (req, res) => {
    const lista = await prisma.usuario.findMany();

    res.json(lista).status(200).end();
};

const buscar = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
            receitas: true
        }
    });

    res.json(item).status(200).end();
};

const perfil = async (req, res) => {
    const item = await prisma.usuario.findUnique({
        where: { id: req.usuarioId },
        include: {
            plano: true,
            receitas: true,
            favoritos: true
        }
    });

    res.json(item).status(200).end();
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const dados = req.body;
    
    const item = await prisma.usuario.update({
        where: { id: Number(id) },
        data: dados
    });

    res.status(200).json(item);
};

const excluir = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.usuario.delete({
        where: { id: Number(id) }
    });

    res.json(item).status(200).end();
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    perfil,
    atualizar,
    excluir
};