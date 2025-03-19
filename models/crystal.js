const mongoose = require("mongoose")

const crystalSchema = new mongoose.Schema({
    materialCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    tier: {
        type: String,
        required: false
    },
    colors: {
        type: [String], // Array of strings
        required: false
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
        required: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    updatedOn: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('crystal', crystalSchema)