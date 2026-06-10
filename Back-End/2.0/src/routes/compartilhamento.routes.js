const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const {
    gerarLink
} = require("../controllers/compartilhamento.controllers");

router.post("/gerar/:receitaId", authMiddleware, gerarLink);


module.exports = router;