<<<<<<< HEAD
const express = require("express");const router = express.Router();const authMiddleware = require("../middlewares/auth");const {     cadastrar,     listar,     listarPublicas,    buscarPublica,    buscar,     atualizar,     excluir } = require("../controllers/receitas.controllers");router.post("/cadastrar", authMiddleware, cadastrar);router.get("/listar", authMiddleware, listar);router.get("/publicas", listarPublicas);router.get("/publicas/:id", buscarPublica);router.get("/buscar/:id", buscar);router.put("/atualizar/:id", authMiddleware, atualizar);router.delete("/excluir/:id", authMiddleware, excluir);module.exports = router;
=======
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const {
    cadastrar,
    listar,
    listarPublicas,
    buscarPublica,
    listarHashtagsEmAlta,
    obterDesafioSemanal,
    buscar,
    atualizar,
    excluir
} = require("../controllers/receitas.controllers");

router.post("/cadastrar", authMiddleware, cadastrar);
router.get("/listar", authMiddleware, listar);
router.get("/publicas", listarPublicas);
router.get("/publicas/:id", buscarPublica);
router.get("/hashtags-em-alta", listarHashtagsEmAlta);
router.get("/desafio-semanal", obterDesafioSemanal);
router.get("/buscar/:id", (req, res, next) => {
    if (req.headers.authorization) return authMiddleware(req, res, next);
    next();
}, buscar);
router.put("/atualizar/:id", authMiddleware, atualizar);
router.delete("/excluir/:id", authMiddleware, excluir);

module.exports = router;
>>>>>>> bf6bdb9ad30543104ca05bc226459cc5e5d70ba7
