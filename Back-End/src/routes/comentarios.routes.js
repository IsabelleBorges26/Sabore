const express = require("express");
const authMiddleware = require("../middlewares/auth");
const { cadastrar, listar, excluir } = require("../controllers/comentarios.controllers");
const router = express.Router();

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", listar);
router.delete("/excluir/:id", authMiddleware, excluir);

module.exports = router;
