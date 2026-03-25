const express = require("express");
const router = express.Router();

const {
    gerarLink
} = require("../controllers/compartilhamento.controllers");

router.post("/gerar/:receitaId", gerarLink);


module.exports = router;