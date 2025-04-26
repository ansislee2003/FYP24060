const { Server } = require('socket.io');
const secrets = JSON.parse(process.env.SECRETS.toString());

const tokenizer = require('wink-nlp-utils');
const tokenize = (text) => {
    let tokenizedText = tokenizer.string.tokenize( text, false );
    if (tokenizedText.length > 1) {
        for (let i = 1; i < tokenizedText.length; i++) {    // concat contractions with '
            if (tokenizedText[i-1].match(/^\w+$/) && tokenizedText[i].match(/^n?'(s|re|t|ve|ll|d|m)$/)) {
                tokenizedText.splice(i-1, 2, tokenizedText[i-1] + tokenizedText[i]);
            }
            if (tokenizedText[i] == '-' && i+1 < tokenizedText.length) {    // concat hyphenated words
                if (tokenizedText[i-1].match(/^\w+$/) && tokenizedText[i+1].match(/^\w+$/)) {
                    tokenizedText.splice(i-1, 3, tokenizedText[i-1] + tokenizedText[i] + tokenizedText[i+1]);
                    i -= 2;
                }
            }
        }
    }
    return tokenizedText;
}

const speech = require('@google-cloud/speech');
const sttclient = new speech.SpeechClient({ apiKey: secrets.GOOGLE_TTS_API_KEY });

const onlyForHandshake = (middleware) => {
    return (req, res, next) => {
        const isHandshake = req._query.sid === undefined;
        if (isHandshake) {
            middleware(req, res, next);
        }
        else {
            next();
        }
    };
}

const createWebSocketServer = (server, sessionMiddleware, passport) => {
    const io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:3001',
                'https://fyp-frontend-629590115382.asia-northeast1.run.app'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        },
    });

    io.engine.use(onlyForHandshake(sessionMiddleware));
    io.engine.use(onlyForHandshake(passport.session()));
    io.engine.use(
        onlyForHandshake((req, res, next) => {
            if (req.user) {     // authenticated
                next();
            } 
            else {      // not authenticated
                res.writeHead(401);
                res.end();
            }
        }),
    );

    io.on('connection', (socket) => {
        const user = socket.request.session.passport.user;
        const userId = user.userID;
        const username = user.username;
        console.log('User connected:', userId, username);

        let finalTranscript = "";
        let recognizer = null;
        let isRecEnd = false;
        socket.on('recognizerConfig', (locale, callback) => {
            try {
                isRecEnd = false;
                finalTranscript = ""
                recognizer = sttclient
                .streamingRecognize({
                    config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 16000,
                    languageCode: locale ? locale : 'en-GB',
                    enableAutomaticPunctuation: true,
                },
                    interimResults: true,
                })
                .on('data', (data) => {
                    if (data.results[0] && data.results[0].isFinal) {
                        finalTranscript += data.results[0].alternatives[0].transcript + ' ';
                        finalTranscript = finalTranscript;
                        io.to(socket.id).emit('transcript', { message: tokenize(finalTranscript) });
                    }
                    else {
                        let transcript = finalTranscript + data.results[0].alternatives[0].transcript;
                        io.to(socket.id).emit('transcript', { message: tokenize(transcript) });
                    }
                })
                .on('error', (error) => {
                    io.to(socket.id).emit('error')
                    
                    finalTranscript = "";
                    console.error('Failed to capture voice:', error);
                    if (recognizer) {
                        recognizer.end();
                    }
                })
                .on('end', () => {  // transcript finalized
                    io.to(socket.id).emit('transcript_end', { message: tokenize(finalTranscript) });
                });

                callback({ success: true });
            }
            catch(error) {
                callback({ error: 'STT config failed.' });
            }
        });

        socket.on('STT', (arrayBuffer) => {
            if (recognizer && !isRecEnd) {
                recognizer.write(arrayBuffer)
            }
        })

        socket.on('STT_end', async () => {
            isRecEnd = true;
            if (recognizer) {
                recognizer.end();
            }
        })

        // for testing
        socket.on('message', (socketID, msg) => {
            console.log('Message received:', socketID, msg, socket.id);
            let message = "Hello " + userId + " " + username;
            io.to(socket.id).emit('chat message', { message: msg });
        });

        // user disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });

        console.log("websocket server running...")
    });
}

module.exports = createWebSocketServer;