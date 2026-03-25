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

module.exports = {
    gerarLink
};