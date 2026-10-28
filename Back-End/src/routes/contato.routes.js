const express = require("express");
const { enviar } = require("../controllers/contato.controllers");

const router = express.Router();
router.post("/", enviar);

module.exports = router;
