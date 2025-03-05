const mongoose = require("mongoose")

const woodSchema = new mongoose.Schema({
    materialCode: {
        type: String,
        required: true
    },
    commonName: {
        type: String,
        required: true
    },
    altName1: {
        type: String,
        required: false
    },
    altName2: {
        type: String,
        required: false
    },
    jankaHardness: {
        type: String,
        required: true
    },
    geographicOrigin: {
        type: String,
        required: true
    },
    scientificName: {
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
    streaksAndVeins: {
        type: String,
        required: false
    },
    color1: {
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
    image: {
        type: String,
        required: false
    },
    inStock: {
        type: Boolean,
        required: true
    },
    metaphysicalTags1: {
        type: String,
        required: false
    },
    metaphysicalTags2: {
        type: String,
        required: false
    },
    metaphysicalTags3: {
        type: String,
        required: false
    },
    metaphysicalTags4: {
        type: String,
        required: false
    },
    metaphysicalAndSpiritualDesc: {
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

module.exports = mongoose.model('wood', woodSchema)