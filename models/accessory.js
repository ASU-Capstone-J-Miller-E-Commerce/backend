const mongoose = require("mongoose")
const { v4: uuidv4 } = require('uuid');

const accessorySchema = new mongoose.Schema({
    guid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    accessoryNumber: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
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

module.exports = mongoose.model('accessory', accessorySchema)