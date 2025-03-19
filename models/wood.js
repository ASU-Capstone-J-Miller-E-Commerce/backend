const mongoose = require("mongoose")

const woodSchema = new mongoose.Schema({
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
    commonName: {
        type: String,
        required: true
    },
    alternateName1: {
        type: String,
        required: false
    },
    alternateName2: {
        type: String,
        required: false
    },
    scientificName: {
        type: String,
        required: true
    },
    brief: {
        type: String,
        required: false
    },
    jankaHardness: {
        type: String,
        required: false
    },
    treeHeight: {
        type: String,
        required: false
    },
    trunkDiameter: {
        type: String,
        required: false
    },
    geographicOrigin: {
        type: String,
        required: true
    },
    streaksVeins: {
        type: String,
        required: false
    },
    texture: {
        type: String,
        required: false
    },
    grainPattern: {
        type: String,
        required: false
    },
    metaphysicalTags: {
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

module.exports = mongoose.model('wood', woodSchema)