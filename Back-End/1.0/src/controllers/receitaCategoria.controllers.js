const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const data = req.body;

    const item = await prisma.receitaCategoria.create({
        data
    });

    res.status(201).json(item);
};

const listar = async (req, res) => {
    const lista = await prisma.receitaCategoria.findMany();

    res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.receitaCategoria.findUnique({
        where: { id: Number(id) }
    });

    res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const { id } = req.params;
    const dados = req.body;
    
    const item = await prisma.receitaCategoria.update({
        where: { id: Number(id) },
        data: dados
    });

    res.status(200).json(item);
};

const excluir = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.receitaCategoria.delete({
        where: { id: Number(id) }
    });

    res.status(200).json(item);
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
};