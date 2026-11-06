const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { 
    perfil,
    listar, 
    buscar, 
    atualizar, 
    excluir,
    listarConquistasUsuario,
    listarMoldurasUsuario,
    atualizarMolduraUsuario
} = require("../controllers/usuarios.controllers");
router.get("/perfil", authMiddleware, perfil);
router.get("/conquistas", authMiddleware, listarConquistasUsuario);
router.get("/conquistas/:usuarioId", authMiddleware, listarConquistasUsuario);
router.get("/molduras", authMiddleware, listarMoldurasUsuario);
router.put("/moldura", authMiddleware, atualizarMolduraUsuario);
router.post("/moldura", authMiddleware, atualizarMolduraUsuario);
router.put("/equipar-moldura", authMiddleware, atualizarMolduraUsuario);
router.post("/equipar-moldura", authMiddleware, atualizarMolduraUsuario);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", authMiddleware, atualizar);
router.delete("/excluir/:id", authMiddleware, excluir);
module.exports = router;
