const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { obterAtual, publicar, historico } = require("../controllers/desafio.controllers");

// GET público (mas com autenticação opcional para verificar participação)
router.get("/atual", authMiddleware, obterAtual);
router.get("/historico", authMiddleware, historico);

// POST protegido
router.post("/publicar", authMiddleware, publicar);

module.exports = router;
