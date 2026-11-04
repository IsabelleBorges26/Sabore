const router = require('express').Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const c = require('../controllers/desafios.controllers');

router.get('/ativo', (req, res, next) => req.headers.authorization ? auth(req, res, next) : next(), c.listarAtivo);
router.get('/conquistas', auth, c.listarConquistas);
router.get('/conquistas/:usuarioId', auth, c.listarConquistas);
router.post('/', auth, admin, c.criar);
router.post('/:id/status', auth, admin, c.atualizarStatus);
router.post('/:id/finalizar', auth, admin, c.finalizar);
router.post('/participar', auth, c.participar);
router.post('/entrada', auth, c.enviarEntrada);
router.post('/votar', auth, c.votar);

module.exports = router;
