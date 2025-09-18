const mongoose = require('mongoose');
const { otpauthURL } = require('speakeasy');

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false},
        address: {type: String, required: false},
        role: {type: String, required: true, default: "User" },
        TFAEnabled: {type: Boolean, default: false },
        TFASecret: {
            ascii: String,
            hex: String,
            base32: String,
            otpauth_URL: String
        },
        emailNotos: {type: Boolean, required: true },
        cart: [{
            itemGuid: { type: String, required: true },
            itemType: { type: String, enum: ['cue', 'accessory'], required: true },
            quantity: { type: Number, default: 1, min: 1 },
            addedAt: { type: Date, default: Date.now }
        }]
    }
)

module.exports = mongoose.model('user', userSchema)