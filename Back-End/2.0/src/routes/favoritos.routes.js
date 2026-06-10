const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const { 
    cadastrar, 
    listar, 
    buscar, 
    excluir 
} = require("../controllers/favoritos.controllers");

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", authMiddleware, listar);
router.get("/buscar/:id", authMiddleware, buscar);
router.delete("/excluir/:id", authMiddleware, excluir);

module.exports = router;