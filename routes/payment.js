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
        const shippingOptions = await getShippingOptionsForCountry(req.body.shippingCountry, req.body.cartTotal);

        session = await stripe.checkout.sessions.create({
            customer_email: req.body.email,
            submit_type: 'pay',
            billing_address_collection: 'required', // Still collect billing for payment
            shipping_address_collection: {
              allowed_countries: [req.body.shippingCountry], // Only allow the selected country
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
              source: 'website_cart',
              shipping_country: req.body.shippingCountry,
              cue_guids: JSON.stringify(res.cues.map(cue => cue.guid)),
              accessory_items: JSON.stringify(res.accessories.map(acc => ({ guid: acc.accessory.guid, quantity: acc.quantity })))
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

// Verify payment session and get order details
router.get('/verify-session/:session_id', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.session_id, {
            expand: ['line_items', 'line_items.data.price.product']
        });

        if (session.payment_status !== 'paid') {
            return res.status(400).json(makeError(['Payment not completed']));
        }

        // Get the payment intent to get more details
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        // Extract order information from metadata
        const cueGuids = session.metadata.cue_guids ? JSON.parse(session.metadata.cue_guids) : [];
        const accessoryItems = session.metadata.accessory_items ? JSON.parse(session.metadata.accessory_items) : [];

        const orderDetails = {
            sessionId: session.id,
            paymentIntentId: paymentIntent.id,
            orderNumber: `ORD-${Date.now()}`, // Generate a user-friendly order number
            status: 'paid',
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency,
            customer: {
                email: session.customer_details.email,
                name: session.customer_details.name,
                phone: session.customer_details.phone
            },
            shipping: session.shipping_details,
            billing: session.customer_details.address,
            items: {
                cues: cueGuids,
                accessories: accessoryItems
            },
            createdAt: new Date(session.created * 1000),
            metadata: session.metadata
        };

        await processCompletedOrder(orderDetails);

        return res.status(200).json(makeResponse('success', orderDetails, ['Payment verified successfully'], false));
    } catch (error) {
        return res.status(500).json(makeError(['Failed to verify payment session']));
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

// Stripe webhook endpoint for handling events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Payment succeeded for session:', session.id);
            
            // Get full session details with line items
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items', 'line_items.data.price.product']
            });

            // Process the order
            await handleSuccessfulPayment(fullSession);
            break;
        
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
        
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

async function handleSuccessfulPayment(session) {
    try {
        // Extract order information from metadata
        const cueGuids = session.metadata.cue_guids ? JSON.parse(session.metadata.cue_guids) : [];
        const accessoryItems = session.metadata.accessory_items ? JSON.parse(session.metadata.accessory_items) : [];

        const orderDetails = {
            sessionId: session.id,
            orderNumber: `ORD-${Date.now()}`,
            status: 'paid',
            amount: session.amount_total / 100,
            currency: session.currency,
            customer: {
                email: session.customer_details.email,
                name: session.customer_details.name,
                phone: session.customer_details.phone
            },
            shipping: session.shipping_details,
            billing: session.customer_details.address,
            items: {
                cues: cueGuids,
                accessories: accessoryItems
            },
            createdAt: new Date(session.created * 1000),
            metadata: session.metadata
        };

        await processCompletedOrder(orderDetails);
        
        console.log('Order processed successfully for session:', session.id);
    } catch (error) {
        console.error('Error processing successful payment:', error);
        // Consider implementing retry logic or dead letter queue here
    }
}

async function processCompletedOrder(orderDetails) {
    try {
        // 1. Create order record in database
        // const order = await Order.create(orderDetails);
        
        // 2. Update inventory - mark cues as sold
        if (orderDetails.items.cues && orderDetails.items.cues.length > 0) {
            await Cue.updateMany(
                { guid: { $in: orderDetails.items.cues } },
                { status: 'Sold' }
            );
        }

        // 3. Clear user's cart after successful purchase
        if (orderDetails.customer && orderDetails.customer.email) {
            const User = require('../models/user');
            await User.updateOne(
                { email: orderDetails.customer.email },
                { $set: { cart: [] } }
            );
        }

        // 4. Send confirmation email
        // await sendOrderConfirmationEmail(orderDetails);

        // 5. Log analytics
        console.log('Order analytics:', {
            orderNumber: orderDetails.orderNumber,
            amount: orderDetails.amount,
            itemCount: (orderDetails.items.cues?.length || 0) + (orderDetails.items.accessories?.length || 0),
            country: orderDetails.shipping?.address?.country
        });

        return orderDetails;
    } catch (error) {
        throw error;
    }
}

module.exports = router;