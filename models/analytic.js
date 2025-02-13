const mongoose = require("mongoose")

const analyticSchema = new mongoose.Schema({
    interaction: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    page: {
        type: String,
        required: true
    },
    data: {
        type: Object,
        default: {}
    }
})

module.exports = mongoose.model('analytic', analyticSchema)