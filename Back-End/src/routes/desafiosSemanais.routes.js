const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const c = require("../controllers/desafiosSemanais.controllers");

// Opcional auth para saber se o usuário já participou
const optAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return auth(req, res, next);
  }
  next();
};

router.get("/atual", optAuth, c.obterAtual);
router.get("/programados", c.listarProgramados);
router.post("/participar", auth, c.participar);

// Admin
router.post("/admin/salvar", auth, admin, c.salvarDesafioAdmin);
router.post("/admin/:id/encerrar", auth, admin, c.encerrarDesafioAdmin);
router.get("/admin/participacoes", auth, admin, c.listarParticipacoes);

module.exports = router;

