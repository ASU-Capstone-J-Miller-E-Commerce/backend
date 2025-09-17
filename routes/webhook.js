
const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express');
const router = express.Router();

// Only handle invoice.updated events
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== 'invoice.updated') {
        return res.status(200).json({received: true, ignored: true});
    }

    const invoice = event.data.object;
    if (!invoice.metadata || !invoice.metadata.orderId) {
        console.log('Invoice has no orderId in metadata, skipping');
        return res.status(200).json({received: true, noOrderId: true});
    }

    // Only update orderStatus, trackingNumber, and shippingCarrier
    const orderId = invoice.metadata.orderId;
    const update = {};
    if (invoice.metadata.ship_status) {
        update.orderStatus = invoice.metadata.ship_status;
    }
    if (invoice.metadata.tracking_number) {
        update.trackingNumber = invoice.metadata.tracking_number;
    }
    if (invoice.metadata.service_name) {
        update.shippingCarrier = invoice.metadata.service_name;
    }
    update.updatedAt = new Date();

    try {
        const Order = require('../models/order');
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: update },
            { new: true }
        );
        if (!updatedOrder) {
            console.error(`Order not found for ID: ${orderId}`);
            return res.status(404).json({error: 'Order not found'});
        }
        console.log(`Order ${orderId} updated:`, update);
        return res.status(200).json({received: true, updated: true});
    } catch (error) {
        console.error(`Error updating order ${orderId}:`, error);
        return res.status(500).json({error: 'Failed to update order'});
    }
});

module.exports = router;