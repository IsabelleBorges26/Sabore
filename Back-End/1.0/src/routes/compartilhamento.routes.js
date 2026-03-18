const express = require("express");
const router = express.Router();

const {
    gerarLink,
    listar,
    buscar,
    desativar
} = require("../controllers/compartilhamento.controllers");

router.post("/gerar/:receitaId", gerarLink);
router.get("/listar", listar);
router.get("/buscar/:token", buscar);
router.delete("/desativar/:id", desativar);

module.exports = router;