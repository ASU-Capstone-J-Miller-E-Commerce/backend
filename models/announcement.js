const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const announcementSchema = new mongoose.Schema({
    guid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    active: {
        type: Boolean,
        default: false,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    startAt: {
        type: Date,
        required: false,
        validate: {
            validator: function(value) {
                // If startAt is set, endAt must also be set
                if (value && !this.endAt) return false;
                return true;
            },
            message: 'If start date is set, end date must also be set.'
        }
    },
    endAt: {
        type: Date,
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
});

module.exports = mongoose.model('Announcement', announcementSchema);