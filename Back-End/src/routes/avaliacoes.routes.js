const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const {
    cadastrar,
    listar,
    excluir
} = require("../controllers/avaliacoes.controllers");

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", listar);
router.delete("/excluir/:receitaId", authMiddleware, excluir);

module.exports = router;
