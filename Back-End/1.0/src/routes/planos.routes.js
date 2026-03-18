const express = require("express");
const router = express.Router();

const {
    verificar,
    atualizar,
    listarPlanos
} = require("../controllers/planos.controllers");

router.get("/verificar", verificar);
router.put("/atualizar", atualizar);
router.get("/listar", listarPlanos);

module.exports = router;