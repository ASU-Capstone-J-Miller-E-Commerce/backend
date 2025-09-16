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

        // Get shipping options for the country
        const shippingOptions = await getShippingOptionsForCountry(req.body.shipping.country, req.body.cartTotal);

        session = await stripe.checkout.sessions.create({
            customer_email: req.body.email,
            submit_type: 'pay',
            billing_address_collection: 'auto',
            shipping_address_collection: {
              allowed_countries: [req.body.shipping.country], // Only allow the selected country
            },
            shipping_options: shippingOptions,
            line_items: line_items,
            mode: 'payment',
            success_url: `${process.env.ORIGIN_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.ORIGIN_URL}/checkout/cancel`,
            
            // Additional customization options
            locale: 'auto', // Auto-detect customer's language
            payment_method_types: ['card'], // Accept only cards
            allow_promotion_codes: true, // Enable discount codes
            
            // Metadata for tracking
            metadata: {
              order_type: 'ecommerce',
              source: 'website_cart'
            },
            
            // Phone number collection
            phone_number_collection: {
              enabled: true
            },
            
            // Tax calculation (if configured in Stripe)
            automatic_tax: {
              enabled: true // Set to true if you have tax calculation set up
            }
          });
        
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

async function getShippingOptionsForCountry(countryCode, cartTotal) {
    try {
        // Get all shipping rates from Stripe
        const shippingRates = await stripe.shippingRates.list({
            limit: 100, // Adjust as needed
            active: true
        });

        // Filter shipping rates by country and threshold
        const applicableRates = shippingRates.data.filter(rate => {
            // Check if rate has metadata with countries and threshold
            if (!rate.metadata || !rate.metadata.countries) {
                return false;
            }

            // Check if the country is in the space-separated list
            const supportedCountries = rate.metadata.countries.split(' ');
            if (!supportedCountries.includes(countryCode)) {
                return false;
            }

            // Check threshold if it exists
            if (rate.metadata.threshold) {
                const threshold = parseFloat(rate.metadata.threshold);
                if (cartTotal < threshold) {
                    return false;
                }
            }

            return true;
        });

        if (applicableRates.length === 0) {
            // Return a default error or empty array if no shipping available
            return [];
        }

        // Sort by threshold (highest first) and pick the first one
        const sortedRates = applicableRates.sort((a, b) => {
            const thresholdA = parseFloat(a.metadata.threshold || 0);
            const thresholdB = parseFloat(b.metadata.threshold || 0);
            return thresholdB - thresholdA; // Descending order
        });

        // Return only the highest threshold rate that applies
        const selectedRate = sortedRates[0];
        
        return [
            {
                shipping_rate: selectedRate.id
            }
        ];

    } catch (error) {
        console.error('Error fetching shipping rates:', error);
        return [];
    }
}

module.exports = router;