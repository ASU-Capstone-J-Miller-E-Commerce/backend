const mongoose = require("mongoose")

const crystalSchema = new mongoose.Schema({
    materialCode: {
        type: String,
        required: true
    },
    crystalCategory: {
        type: String,
        required: true
    },
    crystalName: {
        type: String,
        required: true
    },
    color1: {
        type: String,
        required: true
    },
    color2: {
        type: String,
        required: false
    },
    color3: {
        type: String,
        required: false
    },
    rarity: {
        type: String,
        required: true
    },
    psychologicalCorr1: {
        type: String,
        required: false
    },
    psychologicalCorr2: {
        type: String,
        required: false
    },
    psychologicalCorr3: {
        type: String,
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