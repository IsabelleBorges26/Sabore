const express = require("express");
const router = express.Router();

const {
    listarPublicas,
    listarPorCategoria,
    buscar
} = require("../controllers/bibliotecas.controllers");

router.get("/publicas", listarPublicas);
router.get("/categoria/:categoria", listarPorCategoria);
router.get("/buscar/:id", buscar);

module.exports = router;