const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { listarPerfis, meuResumo, seguir, deixarDeSeguir } = require("../controllers/social.controllers");

const router = express.Router();
router.get("/perfis", authMiddleware, listarPerfis);
router.get("/meu-resumo", authMiddleware, meuResumo);
router.post("/seguir/:usuarioId", authMiddleware, seguir);
router.delete("/seguir/:usuarioId", authMiddleware, deixarDeSeguir);

module.exports = router;
