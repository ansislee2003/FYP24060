const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatlogSchema = new Schema({
    title: { 
        type: String,
        required: true
     },
    userID: { 
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    scenario: {
        type: Object,
        required: true,
        properties: {
            description: { type: String, required: true },
            goal: { type: String, required: true },
            userRole: { type: String, required: true },
            botRole: { type: String, required: true },
            engLevel: { type: String, required: true }
        }
    }
}, { 
    versionKey: false
});

module.exports = mongoose.model('chatlogs', chatlogSchema, 'chatlogs');