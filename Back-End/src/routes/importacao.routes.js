const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { verificarLimiteIA } = require("../middlewares/iaGate");
const { importar } = require("../controllers/importacao.controllers");

// Importação e transcrição por vídeo via IA: recurso exclusivo PRO (10 utilizações/semana compartilhadas)
router.post("/importar", authMiddleware, verificarLimiteIA("VIDEO"), importar);

module.exports = router;