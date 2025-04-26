const MemoCategories = require('../models/memoCategoriesModel');
const MemoEntries = require('../models/memoEntriesModel');

// Categories
exports.getCategories = async (req, res) => {
    try {
        MemoCategories.find({
            userID: req.user.userID
        }, {
            _id: false
        })
        .then(categories => {
            res.json(categories);
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to find categories" });
        })
    }
    catch(error) {
        console.log("/getCategories:", error)
        res.status(500).send({ message: "Failed to find categories" });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await MemoCategories.findOneAndDelete({
            userID: req.user.userID,
            title: req.body.title
        })

        await MemoEntries.deleteMany({
            userID: req.user.userID,
            category: req.body.title
        })

        res.status(200).send({ message: "Category and all realted entries deleted successfully." });
    }
    catch(error) {
        console.log("/deleteCategory:", error)
        res.status(500).send({ message: "Failed to delete category and realted entries." });
    }
};

exports.addCategory = async (req, res) => {
    try {
        MemoCategories.create({
            userID: req.user.userID,
            title: req.body.title,
            createdAt: new Date()
        })
        .then(() => {
            res.status(200).send();
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to create category." });
        })
    }
    catch(error) {
        console.log("/addCategory:", error)
        res.status(500).send({ message: "Failed to create category." });
    }
};

// Entries
exports.getEntries = async (req, res) => {
    try {
        MemoEntries.find({
            userID: req.user.userID,
            category: req.query.category
        })
        .then(entries => {
            res.json(entries);
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to find entries." });
        })
    }
    catch(error) {
        console.log("/getEntries:", error)
        res.status(500).send({ message: "Failed to find entries." });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        MemoEntries.findOneAndDelete({
            userID: req.user.userID,
            _id: req.body._id
        })
        .then(() => {
            res.status(200).send();
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to delete entry." });
        })
    }
    catch(error) {
        console.log("/deleteEntry:", error)
        res.status(500).send({ message: "Failed to delete entry." });
    }
};

exports.addEntry = async (req, res) => {
    try {
        let isCatExist = await MemoCategories.findOne({      // check if category exists before adding entry
            userID: req.user.userID,
            title: req.body.category
        })

        if (isCatExist) {
            await MemoEntries.create({
                userID: req.user.userID,
                category: req.body.category,
                title: req.body.title,
                translation: req.body.translation,
                notes: req.body.notes
            })
    
            res.status(200).send();
        }
        else {
            res.status(400).send({ message: "Category does not exist." });
        }
    }
    catch(error) {
        console.log("/addEntry:", error)
        res.status(500).send({ message: "Failed to add entry." });
    }
};

exports.editEntry = async (req, res) => {
    try {
        MemoEntries.updateOne({
            userID: req.user.userID,
            _id: req.body._id
        }
        ,{
            category: req.body.category,
            title: req.body.title,
            translation: req.body.translation,
            notes: req.body.notes
        })
        .then(() => {
            res.status(200).send();
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to edit entry" });
        })
    }
    catch(error) {
        console.log("/editEntry:", error)
        res.status(500).send({ message: "Failed to edit entry" });
    }
};