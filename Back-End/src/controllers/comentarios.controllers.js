const { withDirectDatabaseFallback } = require("../data/databaseFallback");

const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const receitaId = Number(req.body.receitaId);
    const texto = typeof req.body.texto === "string" ? req.body.texto.trim() : "";
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: "ID da receita é obrigatório." });
    if (!texto || texto.length > 2000) return res.status(400).json({ erro: "O comentário deve ter entre 1 e 2000 caracteres." });
    try {
        const result = await withDirectDatabaseFallback(async (db) => {
            const receita = await db.receita.findUnique({ where: { id: receitaId }, select: { usuarioId: true, publica: true, rascunho: true } });
            if (!receita || (receita.usuarioId !== usuarioId && (!receita.publica || receita.rascunho))) return null;
            const comentario = await db.comentario.create({
                data: { usuarioId, receitaId, texto },
                include: { usuario: { select: { id: true, nome: true, foto: true, plano: true } } }
            });
            return { receita, comentario };
        }, "publicar comentário", { write: true });
        if (!result) return res.status(404).json({ erro: "Receita não encontrada." });
        if (result.receita.usuarioId !== usuarioId) {
            try {
                const { registrarComentarioRecebido } = require("../services/engajamento.service");
                await registrarComentarioRecebido(result.receita.usuarioId, usuarioId, receitaId);
            } catch (error) {
                console.error("[Engajamento] Erro ao pontuar comentário recebido:", error.message);
            }
        }
        return res.status(201).json(result.comentario);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao publicar comentário.", detalhe: error.message });
    }
};

const listar = async (req, res) => {
    const receitaId = Number(req.query.receitaId);
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: "ID da receita é obrigatório." });
    try {
        const lista = await withDirectDatabaseFallback((db) => db.comentario.findMany({
            where: { receitaId },
            include: { usuario: { select: { id: true, nome: true, foto: true, plano: true } } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }]
        }), "listar comentários");
        res.set("Cache-Control", "no-store");
        return res.status(200).json(lista);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar comentários.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ erro: "ID do comentário inválido." });
    try {
        const item = await withDirectDatabaseFallback(async (db) => {
            const comentario = await db.comentario.findUnique({ where: { id }, select: { usuarioId: true } });
            if (!comentario) return { status: 404 };
            if (comentario.usuarioId !== req.usuario.id) return { status: 403 };
            await db.comentario.delete({ where: { id } });
            return { status: 200 };
        }, "excluir comentário", { write: true });
        if (item.status === 404) return res.status(404).json({ erro: "Comentário não encontrado." });
        if (item.status === 403) return res.status(403).json({ erro: "Você não é o autor deste comentário." });
        return res.status(200).json({ mensagem: "Comentário excluído com sucesso." });
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao excluir comentário.", detalhe: error.message });
    }
};

module.exports = { cadastrar, listar, excluir };
