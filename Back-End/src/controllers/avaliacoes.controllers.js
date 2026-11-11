const { withDirectDatabaseFallback } = require("../data/databaseFallback");

const cadastrar = async (req, res) => {
    const usuarioId = req.usuario.id;
    const receitaId = Number(req.body.receitaId);
    const nota = Number(req.body.nota);
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: "ID da receita é obrigatório." });
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) return res.status(400).json({ erro: "A nota deve ser de 1 a 5." });
    try {
        const result = await withDirectDatabaseFallback(async (db) => {
            const receita = await db.receita.findUnique({ where: { id: receitaId }, select: { usuarioId: true, publica: true, rascunho: true } });
            if (!receita || (receita.usuarioId !== usuarioId && (!receita.publica || receita.rascunho))) return null;
            const avaliacao = await db.avaliacao.upsert({
                where: { usuarioId_receitaId: { usuarioId, receitaId } },
                update: { nota },
                create: { usuarioId, receitaId, nota }
            });
            return { receita, avaliacao };
        }, "salvar avaliação", { write: true });
        if (!result) return res.status(404).json({ erro: "Receita não encontrada." });
        if (result.receita.usuarioId !== usuarioId) {
            try {
                const { registrarAvaliacaoRecebida } = require("../services/engajamento.service");
                await registrarAvaliacaoRecebida(result.receita.usuarioId, usuarioId, receitaId);
            } catch (error) {
                console.error("[Engajamento] Erro ao pontuar avaliação recebida:", error.message);
            }
        }
        return res.status(201).json(result.avaliacao);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao salvar avaliação.", detalhe: error.message });
    }
};

const listar = async (req, res) => {
    const receitaId = Number(req.query.receitaId);
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: "ID da receita é obrigatório." });
    try {
        const lista = await withDirectDatabaseFallback((db) => db.avaliacao.findMany({
            where: { receitaId },
            select: { id: true, nota: true, usuarioId: true, receitaId: true, createdAt: true },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }]
        }), "listar avaliações");
        res.set("Cache-Control", "no-store");
        return res.status(200).json(lista);
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao listar avaliações.", detalhe: error.message });
    }
};

const excluir = async (req, res) => {
    const receitaId = Number(req.params.receitaId);
    const usuarioId = req.usuario.id;
    if (!Number.isSafeInteger(receitaId) || receitaId <= 0) return res.status(400).json({ erro: "ID da receita inválido." });
    try {
        const excluida = await withDirectDatabaseFallback((db) => db.$transaction(async (tx) => {
            const resultado = await tx.avaliacao.deleteMany({ where: { usuarioId, receitaId } });
            if (!resultado.count) return false;
            await tx.atividadeEngajamento.deleteMany({
                where: { chaveUnica: `AVALIACAO_${usuarioId}_REC_${receitaId}` }
            });
            return true;
        }), "excluir avaliação", { write: true });
        if (!excluida) return res.status(404).json({ erro: "Você não possui avaliação nesta receita." });
        return res.status(200).json({ mensagem: "Sua avaliação foi excluída." });
    } catch (error) {
        return res.status(500).json({ erro: "Erro ao excluir avaliação.", detalhe: error.message });
    }
};

module.exports = { cadastrar, listar, excluir };
