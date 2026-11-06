const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const c = require("../controllers/eventosEspeciais.controllers");

const optAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return auth(req, res, next);
  }
  next();
};

router.get("/", optAuth, c.listar);
router.get("/auditoria", auth, admin, c.auditoria);
router.get("/:id", optAuth, c.detalhar);

// Inscrição Oficial (Modelo B)
router.post("/:id/participar", auth, c.inscrever);
router.post("/:id/inscrever", auth, c.inscrever);

// Votação Comunitária
router.post("/:id/votar", auth, c.votar);

// Denúncia
router.post("/:id/denunciar", auth, c.denunciar);

// Admin
router.post("/", auth, admin, c.salvarEvento);
router.put("/:id", auth, admin, c.salvarEvento);
router.get("/:id/admin/entradas", auth, admin, c.listarEntradas);
router.post("/:id/entradas/:entradaId/moderar", auth, admin, c.moderar);
router.post("/:id/encerrar-votacao", auth, admin, c.encerrarVotacao);
router.post("/:id/confirmar-resultado", auth, admin, c.confirmarResultado);

module.exports = router;

