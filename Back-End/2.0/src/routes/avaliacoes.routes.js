const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const { 
    cadastrar, 
    listar, 
    buscar, 
    excluir 
} = require("../controllers/avaliacoes.controllers");

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.delete("/excluir/:id", authMiddleware, excluir);

module.exports = router;