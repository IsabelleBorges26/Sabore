const express = require("express");

const router = express.Router();

const { 
    cadastrar
} = require("../controllers/geracaoIA.controllers");

router.post("/gerar", cadastrar);

module.exports = router;