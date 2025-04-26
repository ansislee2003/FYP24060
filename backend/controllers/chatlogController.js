const chatlogs = require('../models/chatlogsModel');
const secrets = JSON.parse(process.env.SECRETS.toString());

const crypto = require('crypto');
const cryptoAlgo = 'aes-256-cbc';
const cryptoKey = Buffer.from(secrets.CRYPTO_KEY, 'base64');
const cryptoIv = Buffer.from(secrets.CRYPTO_IV, 'base64');

// get chat log title cards
exports.getChatlogList = async (req, res) => {
    try {
        chatlogs.find({
            userID: req.user.userID
        }, {
            userID: false,
            message: false,
            scenario: false
        })
        .then(chatlogs => {
            res.status(200).send({
                chatlogs: chatlogs
            });
        })
        .catch(error => {
            res.status(500).send({ message: "Failed to get chatlogs." });
        })    
    }
    catch(error) {
        res.status(500).send({ message: "Failed to get chatlogs." });
    }
};
// get selected chat log
exports.getChatlog = async (req, res) => {
    chatlogs.find({
        userID: req.user.userID,
        _id: req.query._id
    }, {
        _id: false,
        createdAt: false,
        userID: false
    })
    .then(chatlogs => {
        if (chatlogs.length !== 1) {
            throw new Error();
        }
        else {
            // decrpt
            let decipher = crypto.createDecipheriv(cryptoAlgo, cryptoKey, cryptoIv);
            let decrypted = decipher.update(chatlogs[0].message, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            let decryptedMsgs = JSON.parse(decrypted);

            res.status(200).send({
                message: decryptedMsgs,
                scenario: chatlogs[0].scenario
            });
        }
    })
    .catch(error => {
        res.status(500).send({ message: "Failed to get chatlogs." });
    })
};

exports.deleteChatlog = async (req, res) => {
    chatlogs.findOneAndDelete({
        userID: req.user.userID,
        _id: req.body._id,
        title: req.body.title
    })
    .then(() => {
        res.status(200).send({ message: "Deleted chatlog successfully." });
    })
    .catch(error => {
        res.status(500).send({ message: "Failed to delete chatlog." });
    })
};
// save chat log
exports.saveChatlog = async (req, res) => {
    try {
        // encrpyt chat messages
        let message = JSON.stringify(req.body.message);
        let cipher = crypto.createCipheriv(cryptoAlgo, cryptoKey, cryptoIv);
        let encryptedMsgs = cipher.update(message, 'utf8', 'hex');
        encryptedMsgs += cipher.final('hex');

        await chatlogs.create({
            userID: req.user.userID,
            title: req.body.title,
            message: encryptedMsgs,
            scenario: req.body.scenario,
            createdAt: Date()
        })

        res.status(200).send({ message: "Saved chatlog successfully." });
    }
    catch(error) {
        console.log("Save chatlog:", error)
        return res.status(500).send({ message: "Failed to save chatlogs." }) 
    }
};

exports.getOngoingChat;