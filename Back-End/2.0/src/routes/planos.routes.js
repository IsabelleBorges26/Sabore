const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const {
    verificar,
    atualizar,
    listarPlanos
} = require("../controllers/planos.controllers");

router.get("/verificar", authMiddleware, verificar);
router.put("/atualizar", authMiddleware, atualizar);
router.get("/listar", listarPlanos);

module.exports = router;