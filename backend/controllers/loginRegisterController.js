const bcrypt = require("bcryptjs");
const userAccounts = require('../models/userAccountsModel');
const Settings = require('../models/settingsModel');

exports.addAccount = async (req, res) => {
    const { username, password } = req.body;

    // check input format
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
    const passwordRegex = /^(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){1})(?=(?:.*\d){1})(?=(?:.*[!@#$%^&*_-]){1}).{8,20}$/;
    if (!usernameRegex.test(username)) {
        return res.status(500).send("Username does not match format.")
    }
    if (!passwordRegex.test(password)) {
        return res.status(500).send("Password does not match format.")
    }

    // check if username unique
    let isExitst = true;
    try {
        isExitst = await userAccounts.findOne({ username: username });
    }
    catch { return res.status(500).send("Failed to retreive data from database."); }
    
    if (isExitst) { return res.status(500).send("Username already exists."); }
    else {
        const saltRounds = 10;
        try {
            let hashedPassword = await bcrypt.hash(password, saltRounds);
            let maxUser = await userAccounts.findOne().sort({ userID: -1 }).exec()
            let newUserID = maxUser ? (maxUser.userID + 1) : 0;

            await userAccounts.create({
                userID: newUserID,
                username: username,
                password: hashedPassword
            })
            
            await Settings.create({
                userID: newUserID,
                accent: { label: 'United States', code: 'en-US' },
                translationLang: { label:'Chinese (Traditional)', code:'ZH-HANT'},
                ttsVoice: { label: 'Sonia', code: 'en-GB-SoniaNeural', locale: 'English (United Kingdom)' },
                ttsSpeed: 1
            })

            return res.status(200).send("Account has been registered successfully.");
        }
        catch (error) {
            console.log("/addAccount:",error)
            return res.status(500).send("Failed to register account.");
        }
    }
}

exports.checkUsername = async (req, res) => {
    const { username } = req.query;

    let isExitst = 0;
    try {
        let user = await userAccounts.findOne({ username: username });
        isExitst = user ? "1" : "0";

        return res.status(200).send(isExitst);
    }
    catch (error) {
        console.log("/checkUsername:", error)
        return res.status(500).send("Failed to retreive data from database.");
    }
}

exports.loginAccount = async (username, password, done) => {
    try {
        let matchedUser = await userAccounts.findOne({ username: username });

        if (matchedUser) {
            let isMatched = await bcrypt.compare(password, matchedUser.password);
            if (isMatched) {
                return done(null, matchedUser, { message: "Login successful."});
            }
            else { 
                return done(null, false, { message: "Incorrect password." }); 
            }
        }
        else {
            return done(null, false, { message: "User does not exist." });
        }
    }
    catch (error) {
        console.log("/loginAccount:", error)
        return done(error, false, { message: "Login Failed." });
    }
}
// check authentication status
exports.authCheck = async (req, res) => {
    try {
        let isAuthenticated = req.isAuthenticated() ? "1" : "0";
        let userData = {};
        if (req.user) {
            userData.userID = req.user.userID;
            userData.username = req.user.username;
        };
        
        return res.status(200).send({ isAuthenticated: isAuthenticated, userData: userData });
    }
    catch (error) {
        console.log("/authCheck:", error)
        return res.status(500).send({ message: "Failed to check authentication" })
    }
}