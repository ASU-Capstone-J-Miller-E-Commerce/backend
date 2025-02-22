const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: false },
        phone: { type: String, required: false}
    }
)

module.exports = mongoose.model('user', userSchema)