const mongoose = require("mongoose")

const materialSchema = new mongoose.Schema({
    materialCode: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: false
    },
    imageURL: {
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

module.exports = mongoose.model('material', materialSchema)