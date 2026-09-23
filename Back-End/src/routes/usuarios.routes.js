const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { 
    perfil,
    listar, 
    buscar, 
    atualizar, 
    excluir 
} = require("../controllers/usuarios.controllers");
router.get("/perfil", authMiddleware, perfil);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", authMiddleware, atualizar);
router.delete("/excluir/:id", authMiddleware, excluir);
module.exports = router;
