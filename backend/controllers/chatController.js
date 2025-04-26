const axios = require('axios');
const Settings = require('../models/settingsModel');
const secrets = JSON.parse(process.env.SECRETS.toString());

const tokenizer = require('wink-nlp-utils');
const tokenize = (text) => {
    return tokenizer.string.tokenize( text, false );
}

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const speechKey = secrets.AZURE_TTS_API_KEY_HK;
const serviceRegion = "eastasia";
const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, serviceRegion);

const deepl = require('deepl-node');
const deeplTranslator = new deepl.Translator(secrets.DEEPL_API_KEY, { maxRetries: 3, minTimeout: 10000 }); // ENV KEY

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(secrets.GEMINI_API_KEY);
const gemini = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const formatTokens = (response) => {
    response = response.trim('\n');
    response = response.split('\n');

    for (let i = 0; i < response.length; i++) {
        response[i] = tokenize(response[i]);
        if (response[i].length > 1) {
            for (let j = 1; j < response[i].length; j++) {      // concat contractions with '
                if (response[i][j-1].match(/^\w+$/) && response[i][j].match(/^n?'(s|re|t|ve|ll|d|m)$/)) {
                    response[i].splice(j-1, 2, response[i][j-1] + response[i][j]);
                    j--;
                }
                if (response[i][j] == '-' && j+1 < response[i].length) {    // concat hyphenated words
                    if (response[i][j-1].match(/^\w+$/) && response[i][j+1].match(/^\w+$/)) {
                        response[i].splice(j-1, 3, response[i][j-1] + response[i][j] + response[i][j+1]);
                        j -= 2;
                    }
                }
            }
        }
    }
    return response;
}

// settings
// setting options
exports.getSettingOptions = async (req, res) => {
    try {
        // azure tts voice options
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        let ttsVoice_US = await synthesizer.getVoicesAsync("en-US")
        let ttsVoice_GB = await synthesizer.getVoicesAsync("en-GB")
        ttsVoice_US = ttsVoice_US.voices.map(voice => ({
            label: voice.privDisplayName,
            code: voice.privShortName,
            locale: voice.privLocaleName
        }))
        ttsVoice_GB = ttsVoice_GB.voices.map(voice => ({
            label: voice.privDisplayName,
            code: voice.privShortName,
            locale: voice.privLocaleName
        }))
        let ttsVoice = [];
        Array.prototype.push.apply(ttsVoice, ttsVoice_US);
        Array.prototype.push.apply(ttsVoice, ttsVoice_GB);
        
        // translation language options
        let translationOptions = await deeplTranslator.getTargetLanguages();
        let langSet = new Set();
        let translationLang = [];
        translationOptions.forEach(lang => {
            if (!langSet.has(lang.name)) {
                langSet.add(lang.name);
                translationLang.push({
                    label: lang.name,
                    code: lang.code
                });
            }
        })
        translationLang.push({ label:'Chinese (Traditional)', code:'ZH-HANT'});

        let options = {
            translationLang: translationLang,
            ttsVoice: ttsVoice
        };

        res.status(200).send({ options: options });
    }
    catch(error) {
        console.log("/getSettingOptions:", error)
        res.status(500).send({ message: "Failed to get setting options." });
    }
}
// get user settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({
            userID: req.user.userID
        });
        res.status(200).send({ settings: settings });
    }
    catch(error) {
        console.log("/getSettings:", error)
        res.status(500).send({ message: "Failed to get user setting." });
    }
}
// update user settings
exports.updateSettings = async (req, res) => {
    try {
        // data check
        const { accent, translationLang, ttsVoice, ttsSpeed } = req.body;
        if (accent && translationLang && ttsVoice && ttsSpeed) {
            const result = await Settings.updateOne({
                userID: req.user.userID
            },{
                accent: req.body.accent,
                translationLang: translationLang,
                ttsVoice: ttsVoice,
                ttsSpeed: ttsSpeed
            });

            if (result.modifiedCount === 0) {   // user does have settings saved, create new entry
                const newResult = await Settings.create({
                    userID: req.user.userID,
                    accent: accent,
                    translationLang: translationLang,
                    ttsVoice: ttsVoice,
                    ttsSpeed: ttsSpeed
                })
            }

            return res.status(200).send({ message: "Settings saved successfully." });
        }
        else {
            return res.status(400).send({ message: "All fields are required." })
        }
    }
    catch(error) {
        console.log("/updateSettings:", error)
        res.status(500).send({ message: "Failed to save settings." });
    }
}

// chatbot response
exports.getResponse = async (req, res) => {
    try {
        const { scenario, chatHistory } = req.body;

        // normal reponse prompt
        let system_instruction = `
        You are roleplaying with the user in this scenario: ${scenario.description}
        Your role is ${scenario.botRole}
        The user's role is ${scenario.userRole}
        Goal of the conversation is: ${scenario.goal}
        Use vocabulary suitable for the user with ${scenario.engLevel} level English.
        
        This is a verbal conversation in English only.
        Respond only with dialogue in the conversation, do not add actions or descriptions.
        Do not include any follow-up actions or statements as the user will need to respond.
        Elborate more to show a variety of phrases and vocabulary.
        Create problems or scenario to prevent the user from reaching the goal easily.

        If the goal is not reached, guide the user towards the goal with questions.
        If the goal is reached, add ENDOFCONVERSATION to the end of response.
        If the conversation can no longer be steered back towards the goal, also add ENDOFCONVERSATION to the response.

        Using appropriate punctuation.
        Do not return anything other than your dialogue.
        Only use ASCII characters in your response and keep it TTS-friendly with no markdown.

        Chat history:
        ${chatHistory}
        bot: (Your response)
        `;

        // overall evalutation prompt
        let system_instruction_end = `
        You are tasked with evaluating all of the user's dialogues based on the roleplay scenario.

        Roleplay scenario:
        ${scenario.description}
        Your role:
        ${scenario.botRole}
        The user's role:
        ${scenario.userRole}
        The goal of the conversation:
        ${scenario.goal}
        The user's english proficiency level:
        ${scenario.engLevel}

        Chat history:
        ${chatHistory}
        
        Evaluation criteria:
        -vocabulary: Are the word choices appropriate for the scenario? Are there better phrases that can be used?
        -grammar: Are there any grammatical mistake?
        -context awareness: Does the response relate well to the scenario and chat history? 
        -appropriateness of tone: Did the user talk in an appropriate tone based on the scenario?
        -clarity: Did the user convey their message clearly?
        -improvements: Suggest improvements with examples and detailed explaination.

        Provide a detailed analysis based on the above criteria individually. Address "the user" as "you" directly. Do not include introductory sentence. Respond with a helpful and professional tone.
        Only use ASCII characters in your response and keep it TTS-friendly with no markdown.

        Respond in this format:
        Vocabulary:

        Grammar:

        Context Awareness:

        Appropriateness of Tone:

        Clarity:

        Improvements:
        `;

        const chat = gemini.startChat();
        
        let response = [];
        if (Number(scenario.isEnd)) {
            const result = await chat.sendMessageStream(system_instruction_end);
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                response += chunkText
            }
        }
        else {
            const result = await chat.sendMessageStream(system_instruction);
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                response += chunkText
            }
        }
        
        let isEnd = 0;
        if (Number(scenario.isEnd)) {
            isEnd = 1;
            response = formatTokens(response);
        }
        else {
            if (response.indexOf("ENDOFCONVERSATION") != -1) {

                response = response.replace("ENDOFCONVERSATION", '')
                isEnd = 1;
            }
            response = formatTokens(response);
        }

        return res.status(200).send({
            isEnd: isEnd,
            message: response
        });
    }
    catch(error) {
        console.log("/getResponse:", error)
        return res.status(500).send({ message: "Failed to receive response from chatbot." });
    }
}

// comment
exports.getComment = async (req, res) => {
    console.log("/getComment", req.body)
    try {
        let settings = req.body;
        let chatHistory = settings.chatHistory;
        let targetMsg = settings.targetMsg
        let scenario = settings.scenario;

        let system_instruction = `
        You are tasked with evaluating a target message based on the roleplay scenario and the preceding chat history.

        Roleplay scenario:
        ${scenario.description}
        Your role:
        ${scenario.botRole}
        The user's role:
        ${scenario.userRole}
        The goal of the conversation:
        ${scenario.goal}
        The user's english proficiency level:
        ${scenario.engLevel}

        Chat history:
        ${chatHistory}
        Target message:
        ${targetMsg}
        
        Evaluation criteria:
        -vocabulary: Are the word choices appropriate for the scenario? Are there better phrases that can be used?
        -grammar: Are there any grammatical mistake?
        -context awareness: Does the response relate well to the scenario and chat history? 
        -appropriateness of tone: Did the user talk in an appropriate tone based on the scenario?
        -clarity: Did the user convey their message clearly?
        -improvements: Suggest improvements with examples and detailed explaination.

        Provide a detailed analysis based on the above criteria individually. Address "the user" as "you" directly. Do not include introductory sentence. Respond with a helpful and professional tone.
        Only use ASCII characters in your response.

        Respond in this format:
        Vocabulary:

        Grammar:

        Context Awareness:

        Appropriateness of Tone:

        Clarity:

        Improvements:
        `;

        const chat = gemini.startChat();

        let response = "";
        const result = await chat.sendMessageStream(system_instruction);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            console.log("Bot:", chunkText);
            response = response + chunkText
        }

        return res.status(200).send({
            message: response
        });
    }
    catch(error) {
        console.log("/getComment:", error)
        return res.status(500).send("Failed to receive response from chatbot.")
    }
}
// suggestion
exports.getSuggestion = async (req, res) => {
    console.log("/getSuggestion", req.body)
    try {
        let settings = req.body;
        let chatHistory = settings.chatHistory;
        let scenario = settings.scenario;

        let system_instruction = `
        Write a response on as the user based on the roleplay scenario, user's english level and the preceding chat history.
        Your reponse is a model example for the user to follow. It should be have correct grammar, vocabulary and context awareness.

        Roleplay scenario:
        ${scenario.description}
        Chatbot role:
        ${scenario.botRole}
        The user's role:
        ${scenario.userRole}
        The goal of the conversation:
        ${scenario.goal}
        Vocabulary level:
        ${scenario.engLevel == 'beginner' ? 'common vocabulary' : 'intermediate' ? 'natural vocabulary' : 'native level, advanced words allowed if applicable'}

        Chat history:
        ${chatHistory}
        user: (Your response)

        Only use ASCII characters in your response and keep it TTS-friendly with no markdown.
        User correct punctuations.
        Example:
        No, I don't understand.
        `;
        const chat = gemini.startChat();
        
        let response = "";
        const result = await chat.sendMessageStream(system_instruction);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            response = response + chunkText
        }

        response = formatTokens(response);

        res.status(200).send({
            message: response
        });
    }
    catch(error) {
        console.log("/getSuggestion:", error)
        res.status(500).send("Failed to receive response from chatbot.")
    }
}

// TTS
const sanitizeSSML = (text) => {
    return text
        .replace(/\*/g, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;");
}
exports.getTTS = async(req, res) => {
    try {
        const {text, voice, locale, ttsSpeed} = req.body;
        speechConfig.speechSynthesisVoiceName = voice ? voice : 'en-GB-SoniaNeural';
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Webm24Khz16BitMonoOpus;
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
        
        res.setHeader('Content-Type', 'audio/webm');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.flushHeaders();
        
        synthesizer.synthesizing = (sender, event) => {
            let chunk = Buffer.from(event.result.audioData);
            res.write(Buffer.from(chunk));
        };
        synthesizer.synthesisCompleted = (sender, event) => {
            res.end();
            synthesizer.close();
        };
        synthesizer.synthesisCanceled = (sender, event) => {
            res.status(500).end({ message: "Failed to receive TTS." });
            synthesizer.close();
        };

        let input = 
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">
            <voice name="${voice}">
                <prosody rate="${ttsSpeed}">${sanitizeSSML(text)}</prosody>
            </voice>
        </speak>`
        if (input) {
            synthesizer.speakSsmlAsync(input, (result) => {
                if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.error("Fallback error:", result.errorDetails);
                    if (!res.headersSent) {
                        res.status(500).end({ message: "Failed to receive TTS." });
                        synthesizer.close();
                    }
                }
            });
        }
        else {
            throw new Error("Input text cannot be null.");
        }
    }
    catch(error) {
        console.log("/getTTS", error)
        return res.status(500).send({ message: "Failed to receive TTS." })
    }
}

// translation
exports.getTranslation = async (req, res) => {
    try {
        const usage = await deeplTranslator.getUsage();
        if (usage.anyLimitReached()) {
            throw new Error("Translation limit exceeded!");
        }

        const text = req.body.text;
        const targetLang = req.body.targetLang;
        
        const result = await deeplTranslator.translateText(text, 'en', targetLang);
        res.status(200).send({ translation: result.text });
    }
    catch(error) {
        console.log("/getTranslation:",error)
        res.status(500).send({ message: "Failed to get translation." })
    }
}

// dictionary
exports.getDefinition = async (req, res) => {
    try {
        axios.get(`https://dictionaryapi.com/api/v3/references/collegiate/json/${req.query.word}?key=${secrets.DICTIONARY_API_KEY}`)
        .then((entry) => {
            let responseData = {
                definitions: entry.data[0].shortdef ? entry.data[0].shortdef : []
            }
            res.status(200).send(responseData);
        })
        .catch(error => {
            console.log("/getDefinition:", error)
            res.status(500).send({ message: "Failed to find definition." });
        })
    }
    catch(error) {
        console.log("/getDefinition:", error)
        res.status(500).send({ message: "Failed to find definition." })
    }
}