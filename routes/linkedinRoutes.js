const express = require('express');
const router = express.Router();
const linkedinAuthController = require('../controllers/auth/linkedinAuthController');

router.get('/auth/linkedin', linkedinAuthController.authLinkedIn);
router.get('/auth/callback/linkedin', linkedinAuthController.linkedinCallback);

module.exports = router;