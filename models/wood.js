const mongoose = require("mongoose")

const woodSchema = new mongoose.Schema({
    materialCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    description: {
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
    commonName: {
        type: String,
        required: true
    },
    alternateName1: {
        type: String,
        required: true
    },
    alternateName2: {
        type: String,
        required: true
    },
    scientificName: {
        type: String,
        required: true
    },
    brief: {
        type: String,
        required: true
    },
    jankaHardness: {
        type: String,
        required: true
    },
    treeHeight: {
        type: String,
        required: true
    },
    trunkDiameter: {
        type: String,
        required: true
    },
    geographicOrigin: {
        type: String,
        required: true
    },
    streaksVeins: {
        type: String,
        required: true
    },
    texture: {
        type: String,
        required: true
    },
    grainPattern: {
        type: String,
        required: true
    },
    metaphysicalTags: {
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
    }
})

module.exports = mongoose.model('wood', woodSchema)