const prisma = require("../data/prisma");

const listarPublicas = async (req, res) => {
    const lista = await prisma.receita.findMany({
        where: { publica: true }
    });

    res.status(200).json(lista);
};

const listarPorCategoria = async (req, res) => {
    const { categoria } = req.params;
    
    const lista = await prisma.receita.findMany({
        where: { 
            publica: true,
            categoria: categoria
        }
    });

    res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.receita.findUnique({
        where: { id: Number(id) }
    });

    res.status(200).json(item);
};

module.exports = {
    listarPublicas,
    listarPorCategoria,
    buscar
};