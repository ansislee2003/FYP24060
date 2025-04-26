const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

const checkAuth = (req, res, next) =>  {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log("not authorized")
    return res.status(401).send("Not authorized. Please login");
}

router.get('/getDefinition', checkAuth, chatController.getDefinition);
router.get('/getSettings', checkAuth, chatController.getSettings);
router.get('/getSettingOptions', checkAuth, chatController.getSettingOptions);

router.post('/getResponse', checkAuth, chatController.getResponse);
router.post('/getComment', checkAuth, chatController.getComment);
router.post('/getSuggestion', checkAuth, chatController.getSuggestion);
router.post('/getTranslation', checkAuth, chatController.getTranslation);
router.post('/getTTS', checkAuth, chatController.getTTS);
router.post('/updateSettings', checkAuth, chatController.updateSettings);

module.exports = router;