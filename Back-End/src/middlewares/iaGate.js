const { validarAcessoIA, registrarUsoIASucesso } = require("../services/iaUsage.service");
const prisma = require("../data/prisma");

/**
 * Middleware para controlar e limitar acesso a cada modalidade de IA (CHAT, IMAGEM, VIDEO).
 * O desconto da cota só é consumido caso o controller processe a requisição com sucesso.
 */
function verificarLimiteIA(modalidade) {
    return async (req, res, next) => {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            return res.status(401).json({ erro: "Acesso negado. Usuário não autenticado." });
        }

        const validacao = await validarAcessoIA(usuarioId, modalidade);
        if (!validacao.permitido) {
            return res.status(validacao.status).json({
                erro: validacao.erro,
                detalhe: validacao.detalhe,
                requerPro: Boolean(validacao.requerPro),
                consumo: validacao.consumo
            });
        }

        // Anexa função para registrar consumo de sucesso
        req.consumirQuotaIA = async () => {
            return await registrarUsoIASucesso(usuarioId, modalidade, validacao.plano);
        };

        next();
    };
}

/**
 * Segunda etapa do fluxo de IA por Foto (geração da receita após a análise).
 * Para FREE, a análise já consumiu o crédito: aqui apenas exige uma análise recente e não debita de novo.
 * Para PRO, mantém o comportamento original (validação e débito normais).
 */
function verificarContinuacaoFoto() {
    const gatePadrao = verificarLimiteIA("IMAGEM");
    return async (req, res, next) => {
        const usuarioId = req.usuario?.id;
        if (!usuarioId) {
            return res.status(401).json({ erro: "Acesso negado. Usuário não autenticado." });
        }
        try {
            const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { plano: true } });
            if (usuario?.plano === "PRO") return gatePadrao(req, res, next);

            const desde = new Date(Date.now() - 30 * 60 * 1000);
            const analiseRecente = await prisma.usoIA.findFirst({
                where: { usuarioId, modalidade: "IMAGEM", createdAt: { gte: desde } },
                select: { id: true }
            });
            if (!analiseRecente) return gatePadrao(req, res, next);
            return next();
        } catch (error) {
            return res.status(500).json({ erro: "Erro ao validar o uso de IA por Foto.", detalhe: error.message });
        }
    };
}

module.exports = {
    verificarLimiteIA,
    verificarContinuacaoFoto
};
