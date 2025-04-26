const express = require('express');
const router = express.Router();
const chatlogController = require('../controllers/chatlogController');

const checkAuth = (req, res, next) =>  {
    if (req.isAuthenticated()) {
        return next();
    }

    return res.status(401).send("Not authorized. Please login");
}


router.get('/getChatlogList', checkAuth, chatlogController.getChatlogList);
router.get('/getChatlog', checkAuth, chatlogController.getChatlog);

router.post('/deleteChatlog', checkAuth, chatlogController.deleteChatlog);
router.post('/saveChatlog', checkAuth, chatlogController.saveChatlog);

module.exports = router;