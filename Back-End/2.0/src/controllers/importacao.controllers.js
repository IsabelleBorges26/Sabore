const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    const data = req.body;

    const item = await prisma.receita.create({
        data
    });

    res.status(201).json(item);
};

module.exports = {
    cadastrar
};