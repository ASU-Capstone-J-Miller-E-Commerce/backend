const mongoose = require("mongoose")
const { v4: uuidv4 } = require('uuid');

const crystalSchema = new mongoose.Schema({
    guid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    status: {
        type: String,
        required: true
    },
    tier: {
        type: String,
        required: true
    },
    colors: {
        type: [String], // Array of strings
        required: true
    },
    crystalName: {
        type: String,
        required: true
    },
    crystalCategory: {
        type: String,
        required: true
    },
    psychologicalCorrespondence: {
        type: [String], // Array of strings
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    updatedOn: {
        type: Date,
        default: Date.now
    },
    imageUrls: {
        type: [String],
        required: false
    },
    clicks: {
        type: Number,
        required: true
    },
    clickHistory: {
        type: Map,
        of: Number,
        default: {}
    }
})

module.exports = mongoose.model('crystal', crystalSchema)