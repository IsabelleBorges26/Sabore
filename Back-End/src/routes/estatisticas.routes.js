const express = require("express");
const { publicas } = require("../controllers/estatisticas.controllers");

const router = express.Router();

router.get("/publicas", publicas);

module.exports = router;
