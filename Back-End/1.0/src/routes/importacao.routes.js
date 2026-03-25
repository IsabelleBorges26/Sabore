const express = require("express");

const router = express.Router();

const { 
    cadastrar
} = require("../controllers/importacao.controllers");

router.post("/importar", cadastrar);

module.exports = router;