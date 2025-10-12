const mongoose = require("mongoose");
const crypto = require("crypto");

const genOrderId = () => `JM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: genOrderId,
        unique: true
    },
    customer: {
        type: String,
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
    trackingNumber: {
        type: String,
    },
    shippingCarrier: {
        type: String,
    },
    orderItems: {
        cueGuids: [{
            type: String
        }],
        accessoryGuids: [{
            guid: String,
            quantity: Number
        }]
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure an index exists at the database level
orderSchema.index({ orderId: 1 }, { unique: true });

// Helper: create with retry on duplicate-key (E11000) for orderId
orderSchema.statics.createWithUniqueOrderId = async function(doc, maxRetries = 3) {
    const Model = this;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (!doc.orderId) doc.orderId = genOrderId();
        try {
            return await Model.create(doc);
        } catch (err) {
            // Mongo duplicate key error code
            if (err && (err.code === 11000 || err.code === 11001) && /orderId/.test(err.message)) {
                // regenerate and retry
                doc.orderId = genOrderId();
                continue;
            }
            throw err;
        }
    }
    throw new Error('Failed to create order with unique orderId after retries');
};

module.exports = mongoose.model("order", orderSchema);
