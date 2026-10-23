const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const {
    cadastrar,
    listar,
    listarPublicas,
    listarHashtagsEmAlta,
    obterDesafioSemanal,
    buscar,
    atualizar,
    excluir
} = require("../controllers/receitas.controllers");

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", authMiddleware, listar);
router.get("/publicas", listarPublicas);
router.get("/hashtags-em-alta", listarHashtagsEmAlta);
router.get("/desafio-semanal", obterDesafioSemanal);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", authMiddleware, atualizar);
router.delete("/excluir/:id", authMiddleware, excluir);

module.exports = router;