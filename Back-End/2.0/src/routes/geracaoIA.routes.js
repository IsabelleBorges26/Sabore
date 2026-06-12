const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const { gerar } = require("../controllers/geracaoIA.controllers");

router.post("/gerar", authMiddleware, gerar);

module.exports = router;