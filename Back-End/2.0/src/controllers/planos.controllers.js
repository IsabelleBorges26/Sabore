const prisma = require("../data/prisma");

const listarPlanos = async (req, res) => {
    const planos = [
        { nome: 'FREE', preco: 0 },
        { nome: 'PRO', preco: 19.90 }
    ];
    
    res.status(200).json(planos);
};

const verificar = async (req, res) => {
    const usuarioId = req.usuario.id;
    
    const item = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { plano: true, planoExpiraEm: true }
    });

    res.status(200).json(item);
};

const atualizar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const dados = req.body;
    
    const item = await prisma.usuario.update({
        where: { id: usuarioId },
        data: dados
    });

    res.status(200).json(item);
};

module.exports = {
    verificar,
    atualizar,
    listarPlanos
};