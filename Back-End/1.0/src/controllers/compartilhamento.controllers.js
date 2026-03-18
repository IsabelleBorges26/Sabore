const prisma = require("../data/prisma");

const gerarLink = async (req, res) => {
    const { receitaId } = req.params;
    const usuarioId = req.usuario.id;
    
    const token = Math.random().toString(36).substring(2, 15); // Essa função gera o token de forma aletória
    
    const item = await prisma.compartilhamento.create({
        data: {
            token,
            receitaId: Number(receitaId),
            usuarioId
        }
    });

    res.status(201).json(item);
};

const listar = async (req, res) => {
    const usuarioId = req.usuario.id;
    
    const lista = await prisma.compartilhamento.findMany({
        where: { usuarioId }
    });

    res.status(200).json(lista);
};

const buscar = async (req, res) => {
    const { token } = req.params;
    
    const item = await prisma.compartilhamento.findUnique({
        where: { token }
    });

    res.status(200).json(item);
};

const desativar = async (req, res) => {
    const { id } = req.params;
    
    const item = await prisma.compartilhamento.delete({
        where: { id: Number(id) }
    });

    res.status(200).json(item);
};

module.exports = {
    gerarLink,
    listar,
    buscar,
    desativar
};