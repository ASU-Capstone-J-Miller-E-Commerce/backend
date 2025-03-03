const mongoose = require("mongoose")

const cueSchema = new mongoose.Schema({
    prodId: {
        type: String, 
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    listDate: {
        type: Date,
        required: true
    },
    availableDate: {
        type: Date,
        required: false
    },
    price: {
        type: String, 
        required: true
    },
    tipMaterial: {
        type: String,
        required: false
    },
    tipSize: {
        type: String,
        required: true
    },
    ferruleMaterial: {
        type: String,
        required: true
    },
    shaftMaterial: {
        type: String,
        required: true
    },
    collarMaterial: {
        type: String,
        required: true
    },
    jointPinSize: {
        type: String,
        required: true
    },
    jointPinMaterial: {
        type: String,
        required: true
    },
    jointCollarMaterial: {
        type: String,
        required: true
    },
    forearmSize: {
        type: String,
        required: true
    },
    forearmMaterial: {
        type: String,
        required: true
    },
    forearmPointMaterial: {
        type: String,
        required: false
    },
    veneerMatieral: {
        type: String,
        required: false
    },
    handleMaterial: {
        type: String,
        required: true
    },
    buttSleeveSize: {
        type: String,
        required: true
    },
    buttSleeveMaterial: {
        type: String,
        required: true
    },
    buttSleeveVeneerMaterial: {
        type: String,
        required: false
    },
    buttCapMaterial: {
        type: String,
        required: true
    },
    bumperMaterial: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('cue', cueSchema)