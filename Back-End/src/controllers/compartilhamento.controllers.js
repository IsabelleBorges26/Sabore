const crypto = require("crypto");
const prisma = require("../data/prisma");

const gerarLink = async (req, res) => {
    const receitaId = Number(req.params.receitaId);
    const usuarioId = req.usuario.id;
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) {
        return res.status(400).json({ erro: "Receita inválida." });
    }
    try {
        const receita = await prisma.receita.findFirst({
            where: { id: receitaId, publica: true, rascunho: false },
            select: { id: true }
        });
        if (!receita) {
            return res.status(404).json({ erro: "Somente receitas publicadas podem ser compartilhadas." });
        }
        // Reaproveita o registro: o endereço público da receita é sempre o mesmo.
        let item = await prisma.compartilhamento.findFirst({ where: { receitaId, usuarioId } });
        if (!item) {
            item = await prisma.compartilhamento.create({
                data: { token: crypto.randomBytes(16).toString("hex"), receitaId, usuarioId }
            });
        }
        res.status(200).json({ ...item, url: `/publicacao/${receitaId}` });
    } catch (error) {
        res.status(500).json({ erro: "Não foi possível gerar o link da publicação." });
    }
};

module.exports = { gerarLink };
