const mongoose = require("mongoose")
const { v4: uuidv4 } = require('uuid');

const woodSchema = new mongoose.Schema({
    guid: {
        type: String,
        default: uuidv4,
        unique: true
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
        required: false
    },
    alternateName2: {
        type: String,
        required: false
    },
    scientificName: {
        type: String,
        required: false
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
        required: true
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

module.exports = mongoose.model('wood', woodSchema)