const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { verificarLimiteIA, verificarContinuacaoFoto } = require("../middlewares/iaGate");
const { gerar, analisarFoto, gerarReceitaFoto } = require("../controllers/geracaoIA.controllers");
const { obterConsumoUsuario } = require("../services/iaUsage.service");

// Endpoint informativo para frontend exibir cota, contadores e modalidade
router.get("/consumo", authMiddleware, async (req, res) => {
    try {
        const consumo = await obterConsumoUsuario(req.usuario.id);
        res.status(200).json(consumo);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao consultar consumo de IA.", detalhe: error.message });
    }
});

// Chat: permitido para FREE (5/mês) e PRO (10/semana compartilhado)
router.post("/gerar", authMiddleware, verificarLimiteIA("CHAT"), gerar);

// Imagem: FREE tem 2 créditos/mês (1 crédito por foto analisada); PRO compartilha o limite de 10/semana
router.post("/analisar-foto", authMiddleware, verificarLimiteIA("IMAGEM"), analisarFoto);
router.post("/gerar-receita-foto", authMiddleware, verificarContinuacaoFoto(), gerarReceitaFoto);

module.exports = router;
