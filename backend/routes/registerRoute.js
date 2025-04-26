const express = require('express');
const router = express.Router();
const loginRegisterController = require('../controllers/loginRegisterController');

router.post('/addAccount', loginRegisterController.addAccount);

router.get('/checkUsername', loginRegisterController.checkUsername);

module.exports = router;