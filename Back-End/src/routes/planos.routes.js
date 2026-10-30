const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const adminMiddleware = require("../middlewares/admin");
const {
    verificar,
    atualizar,
    listarPlanos,
    ranking,
    meuHistoricoAtividades,
    adminExecutarFechamento,
    adminDashboard
} = require("../controllers/planos.controllers");

// Rotas públicas e de consulta
router.get("/listar", listarPlanos);
router.get("/ranking", authMiddleware, ranking);

// Rotas do usuário autenticado
router.get("/verificar", authMiddleware, verificar);
router.get("/historico-atividades", authMiddleware, meuHistoricoAtividades);

// Bloqueio seguro: não permite atualizar plano diretamente pelo frontend
router.put("/atualizar", authMiddleware, atualizar);

// Rotas exclusivas de Administrador
router.get("/admin/dashboard", authMiddleware, adminMiddleware, adminDashboard);
router.post("/admin/fechamento", authMiddleware, adminMiddleware, adminExecutarFechamento);

module.exports = router;