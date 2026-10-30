const prisma = require("../data/prisma");

const assuntosPermitidos = new Set([
    "suporte",
    "conta",
    "planos",
    "parceria",
    "sugestao",
    "outro"
]);

const enviar = async (req, res) => {
    const nome = String(req.body?.nome || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const assunto = String(req.body?.assunto || "").trim().toLowerCase();
    const mensagem = String(req.body?.mensagem || "").trim();

    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).json({ erro: "Preencha todos os campos do formulário." });
    }
    if (nome.length > 120 || email.length > 254 || mensagem.length > 5000) {
        return res.status(400).json({ erro: "Um ou mais campos ultrapassaram o tamanho permitido." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ erro: "Informe um e-mail válido." });
    }
    if (!assuntosPermitidos.has(assunto)) {
        return res.status(400).json({ erro: "Selecione um assunto válido." });
    }

    try {
        const contato = await prisma.mensagemContato.create({
            data: { nome, email, assunto, mensagem },
            select: { id: true }
        });
        res.status(201).json({
            id: contato.id,
            mensagem: "Mensagem enviada com sucesso."
        });
    } catch (error) {
        console.error("[Contato] Erro ao salvar mensagem:", error.message);
        res.status(500).json({ erro: "Não foi possível enviar sua mensagem. Tente novamente." });
    }
};

module.exports = { enviar };
