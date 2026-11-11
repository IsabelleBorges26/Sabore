const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const {
    gerarLink,
    registrar
} = require("../controllers/compartilhamento.controllers");
router.post("/gerar/:receitaId", authMiddleware, gerarLink);
router.post("/registrar/:receitaId", authMiddleware, registrar);
module.exports = router;
