const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const loginRegisterController = require('./controllers/loginRegisterController');

passport.use(new LocalStrategy(loginRegisterController.loginAccount));

passport.serializeUser((user, done) => {
    return done(null, {
        userID: user.userID,
        username: user.username
    });
})

passport.deserializeUser(function(user, done) {
    process.nextTick(() => {
        return done(null, user);
    });
});

module.exports = passport;