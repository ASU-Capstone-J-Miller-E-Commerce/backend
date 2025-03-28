const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: uuidv4,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    orderStatus: {
        type: String,
        default: "pending",
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "USD"
    },
    paymentStatus: {
        type: String,
        default: "pending"
    },
    paymentMethod: {
        type: String,
        default: "Stripe"
    },
    shippingAddress: {
        type: Object,
        default: {}
    },
    billingAddress: {
        type: Object,
        default: {}
    },
    expectedDelivery: {
        type: Date,
    },
    orderItems: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("order", orderSchema);
