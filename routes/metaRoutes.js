const express = require('express');
const router = express.Router();
const metaController = require('../controllers/auth/metaAuthController');

router.get('/auth/meta', metaController.authMeta);
router.get('/auth/callback/meta', metaController.metaCallback);

module.exports = router;