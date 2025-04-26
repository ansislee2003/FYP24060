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
    createdAt: {
        type: Date,
        required: true
    }
}, { 
    versionKey: false 
});
memoSchema.index({ title: 1, userID: 1 }, { unique: true });    // unique category title within each account

module.exports = mongoose.model('memoCategories', memoSchema, 'memoCategories');