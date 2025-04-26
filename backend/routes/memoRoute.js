const express = require('express');
const router = express.Router();
const memoController = require('../controllers/memoController');

const checkAuth = (req, res, next) =>  {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log("not authorized")
    return res.status(401).send("Not authorized. Please login");
}

router.get('/getCategories', checkAuth, memoController.getCategories);
router.post('/deleteCategory', checkAuth, memoController.deleteCategory);
router.post('/addCategory', checkAuth, memoController.addCategory);

router.get('/getEntries', checkAuth, memoController.getEntries);
router.post('/deleteEntry', checkAuth, memoController.deleteEntry);
router.post('/addEntry', checkAuth, memoController.addEntry);
router.post('/editEntry', checkAuth, memoController.editEntry);

module.exports = router;