const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { 
    listarPerfis, 
    meuResumo, 
    meusSeguidores, 
    meusSeguindo, 
    removerSeguidor,
    listarConexoes,
    detalharPerfil,
    seguir, 
    deixarDeSeguir,
    listarNotificacoes
} = require("../controllers/social.controllers");

const router = express.Router();
router.get("/perfis", authMiddleware, listarPerfis);
router.get("/perfis/:usuarioId", authMiddleware, detalharPerfil);
router.get("/meu-resumo", authMiddleware, meuResumo);
router.get("/meus-seguidores", authMiddleware, meusSeguidores);
router.get("/meus-seguindo", authMiddleware, meusSeguindo);
router.get("/conexoes", authMiddleware, listarConexoes);
router.get("/notificacoes", authMiddleware, listarNotificacoes);
router.post("/seguir/:usuarioId", authMiddleware, seguir);
router.delete("/seguir/:usuarioId", authMiddleware, deixarDeSeguir);
router.delete("/remover-seguidor/:seguidorId", authMiddleware, removerSeguidor);

module.exports = router;
