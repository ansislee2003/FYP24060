const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const loginRegisterController = require('../controllers/loginRegisterController');
const passportConfig = require('../passportConfig.js')

router.get('/checkUsername', loginRegisterController.checkUsername);

router.post('/loginAccount', (req, res, next) => {
    passportConfig.authenticate('local', async (err, user, info) => {
            if (err) {
                console.log("authenticate:", err)
                return res.status(500).send({ message: 'Login Failed.' });
            }
            if (!user) {
                console.log(info.message)
                return res.status(500).send({ message: info.message });
            }

            req.login(user, (err) => {
                if (err) {
                    console.log("req.login:", err)
                    return res.status(500).send({ message: 'Login Failed.' });
                }
                return res.status(200).send({
                    userData: {
                        userID: user.userID,
                        username: user.username
                    }
                });
            });
    })(req, res, next);
});

module.exports = router;