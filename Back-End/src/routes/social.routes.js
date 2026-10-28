const express = require("express");
const authMiddleware = require("../middlewares/auth");
<<<<<<< HEAD
const { 
    listarPerfis, 
    meuResumo, 
    meusSeguidores, 
    meusSeguindo, 
    seguir, 
    deixarDeSeguir, 
    removerSeguidor 
=======
const {
    listarPerfis,
    meuResumo,
    listarConexoes,
    detalharPerfil,
    seguir,
    deixarDeSeguir,
    listarNotificacoes
>>>>>>> bf6bdb9ad30543104ca05bc226459cc5e5d70ba7
} = require("../controllers/social.controllers");

const router = express.Router();
router.get("/perfis", authMiddleware, listarPerfis);
router.get("/perfis/:usuarioId", authMiddleware, detalharPerfil);
router.get("/meu-resumo", authMiddleware, meuResumo);
<<<<<<< HEAD
router.get("/meus-seguidores", authMiddleware, meusSeguidores);
router.get("/meus-seguindo", authMiddleware, meusSeguindo);
=======
router.get("/conexoes", authMiddleware, listarConexoes);
router.get("/notificacoes", authMiddleware, listarNotificacoes);
>>>>>>> bf6bdb9ad30543104ca05bc226459cc5e5d70ba7
router.post("/seguir/:usuarioId", authMiddleware, seguir);
router.delete("/seguir/:usuarioId", authMiddleware, deixarDeSeguir);
router.delete("/remover-seguidor/:seguidorId", authMiddleware, removerSeguidor);

module.exports = router;

