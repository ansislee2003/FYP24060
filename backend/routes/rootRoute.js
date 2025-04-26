const express = require('express');
const router = express.Router();
const passportConfig = require('../passportConfig.js')
const loginRegisterController = require('../controllers/loginRegisterController');


router.get('/authCheck', loginRegisterController.authCheck) 

router.post('/logoutAccount', (req, res) => {
    req.logout(err => {
        if (err) {
            console.log('/logoutAccount', err)
            return res.status(500).send({ message: 'Logout failed.' });
        }

        req.session.destroy(err => {
            if (err) {
                console.log('/logoutAccount', err)
                return res.status(500).send({ message: 'Logout failed.' });
            }
            res.clearCookie('connect.sid');
            return res.status(200).send({ message: 'Logged out.' });
        });
    });
});

module.exports = router;