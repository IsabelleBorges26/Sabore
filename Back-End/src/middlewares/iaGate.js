const { validarAcessoIA, registrarUsoIASucesso } = require("../services/iaUsage.service");

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

module.exports = {
    verificarLimiteIA
};
