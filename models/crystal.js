const mongoose = require("mongoose")

const crystalSchema = new mongoose.Schema({
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
})

module.exports = mongoose.model('crystal', crystalSchema)