const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const settingSchema = new Schema({
    userID: {
        type: Number,
        required: true
    },
    accent: {
        type: Object,
        required: true,
        properties: {
            label: { type: String, required: true },
            code: { type: String, required: true }
        }
    },
    translationLang: {
        type: Object,
        required: true,
        properties: {
            label: { type: String, required: true },
            code: { type: String, required: true }
        }
    },
    ttsVoice: {
        type: Object,
        required: true,
        properties: {
            label: { type: String, required: true },
            code: { type: String, required: true },
            locale: { type: String, required: true }
        }
    },
    ttsSpeed: {
        type: Number,
        required: true
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('settings', settingSchema, 'settings');