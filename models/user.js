const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false},
        role: {type: String, required: true, default: "User" }
    }
)

module.exports = mongoose.model('user', userSchema)