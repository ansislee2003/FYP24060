const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memoSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    userID: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    translation: { type: String },
    notes: { type: String }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('memoEntries', memoSchema, 'memoEntries');