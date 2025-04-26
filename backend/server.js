const express = require('express');
const passport = require('passport')
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

const secrets = JSON.parse(process.env.SECRETS.toString());     // get secrets JSON from env (retreived from secret manager)

// passport.js
const session = require('express-session');
const passportConfig = require('./passportConfig.js');
const sessionMiddleware = session({
    secret: secrets.PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: secrets.MONGODB }),
    cookie: { maxAge: 10800000, secure: true, httpOnly: true, sameSite: 'None' }
});
app.set('trust proxy', 1);
app.use(sessionMiddleware);
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// websocket
const http = require('http');
const server = http.createServer(app);
const createWebSocketServer = require('./webSocket.js');
createWebSocketServer(server, sessionMiddleware, passportConfig);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        'http://localhost:3001',
        'https://fyp-frontend-629590115382.asia-northeast1.run.app'
    ],
    credentials: true
}));

const rootRoute = require('./routes/rootRoute');
const memoRoute = require('./routes/memoRoute');
const chatRoute = require('./routes/chatRoute');
const registerRoute = require('./routes/registerRoute');
const loginRoute = require('./routes/loginRoute');
const chatlogRoute = require('./routes/chatlogRoute');

mongoose.connect(secrets.MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: false
})
.then(() => {
    console.log('MongoDB connected...')
})
.catch(err => {
    console.error('MongoDB connection error:', err)
});


app.use('/api/memo', memoRoute);
app.use('/api/chatlog', chatlogRoute);
app.use('/api/chatbot', chatRoute);
app.use('/api/register', registerRoute);
app.use('/api/login', loginRoute);
app.use('/api', rootRoute);

server.listen(3000, () => {
    console.log('Listening on port: 3000');
});