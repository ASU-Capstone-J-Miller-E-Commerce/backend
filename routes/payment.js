const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express')
const router = express.Router()
const Cue = require('../models/cue')
const Accessory = require('../models/accessory')
const { makeError, makeResponse, makeData } = require('../response/makeResponse')


router.post('/create-checkout-session', getCartItems, async (req, res) => {

    try
    {
        var session;
        var line_items = [];

        // Process cues (quantity is always 1)
        for (const cue of res.cues) {
          if (!cue.stripe_id) {
            console.log(`Cue ${cue.guid} has no stripe_id`);
            continue;
          }

          const price = await stripe.products.retrieve(cue.stripe_id, {
            expand: ['default_price'],
          });

          line_items.push({
            price: price.default_price.id,
            quantity: 1 // Cues are always quantity 1
          });
        }

        // Process accessories (with their specified quantities)
        for (const accessoryItem of res.accessories) {
          if (!accessoryItem.accessory.stripe_id) {
            console.log(`Accessory ${accessoryItem.accessory.guid} has no stripe_id`);
            continue;
          }

          const price = await stripe.products.retrieve(accessoryItem.accessory.stripe_id, {
            expand: ['default_price'],
          });

          line_items.push({
            price: price.default_price.id,
            quantity: accessoryItem.quantity
          });
        }

        if (line_items.length === 0) {
          return res.status(400).json(makeError(['No purchasable items with valid Stripe products.']));
        }

        if(req.body.shipping)
        {
            session = await stripe.checkout.sessions.create({
                customer_email: req.body.email,
                submit_type: 'pay',
                billing_address_collection: 'auto',
                shipping_address_collection: {
                  allowed_countries: ['US', 'CA'],
                },
                line_items: line_items,
                mode: 'payment',
                success_url: `${process.env.ORIGIN_URL}/success.html`,
                cancel_url: `${process.env.ORIGIN_URL}/cancel.html`,
              });
        }
        else
        {
            session = await stripe.checkout.sessions.create({
                customer_email: req.body.email,
                submit_type: 'pay',
                line_items: line_items,
                mode: 'payment',
                success_url: `${process.env.ORIGIN_URL}/success.html`,
                cancel_url: `${process.env.ORIGIN_URL}/cancel.html`,
              });
        }
        
        // Return the URL in the response body for frontend to handle redirect
        return res.status(200).json(makeResponse('success', session.url, ['Checkout Link Created.'], false));
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
  
});

async function getCartItems(req, res, next) {
    try {
        // Get cue GUIDs and accessory items from request
        const cueGuids = req.body.cueGuids || [];
        const accessoryItems = req.body.accessoryItems || []; // Array of {guid, quantity}

        // Fetch cues
        const cues = await Cue.find({
          guid: { $in: cueGuids }
        });

        // Fetch accessories and combine with quantities
        const accessoryGuids = accessoryItems.map(item => item.guid);
        const accessories = await Accessory.find({
          guid: { $in: accessoryGuids }
        });

        // Combine accessories with their quantities
        const accessoriesWithQuantity = accessories.map(accessory => {
          const item = accessoryItems.find(item => item.guid === accessory.guid);
          return {
            accessory: accessory,
            quantity: item ? item.quantity : 1
          };
        });

        if (cues.length === 0 && accessoriesWithQuantity.length === 0) {
            return res.status(404).json(makeError(['No items found']));
        }

        res.cues = cues;
        res.accessories = accessoriesWithQuantity;
        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]));
    }
}

module.exports = router;