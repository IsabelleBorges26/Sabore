const express = require("express");
const authMiddleware = require("../middlewares/auth");
const {
    listarPerfis,
    meuResumo,
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
router.get("/conexoes", authMiddleware, listarConexoes);
router.get("/notificacoes", authMiddleware, listarNotificacoes);
router.post("/seguir/:usuarioId", authMiddleware, seguir);
router.delete("/seguir/:usuarioId", authMiddleware, deixarDeSeguir);

module.exports = router;
