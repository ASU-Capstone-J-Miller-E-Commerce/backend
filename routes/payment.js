const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express')
const router = express.Router()
const Cue = require('../models/cue')
const Accessory = require('../models/accessory')
const { makeError, makeResponse, makeData } = require('../response/makeResponse')
const { authUser } = require('./authorization')


router.post('/create-checkout-session', authUser, getCartItems, async (req, res) => {

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
        
        // Debug: Log shipping options
        console.log('Shipping options for', req.body.shippingCountry, ':', shippingOptions);
        
        // If no shipping options are available, don't require shipping address
        const sessionConfig = {
            customer_email: req.body.email,
            submit_type: 'pay',
            billing_address_collection: 'required', // Still collect billing for payment
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
            },

            invoice_creation: {
                enabled: true
            }
        };
        
        // Only add shipping configuration if shipping options are available
        if (shippingOptions && shippingOptions.length > 0) {
            sessionConfig.shipping_address_collection = {
                allowed_countries: [req.body.shippingCountry]
            };
            sessionConfig.shipping_options = shippingOptions;
        } else {
            console.warn('No shipping options available for', req.body.shippingCountry);
        }

        session = await stripe.checkout.sessions.create(sessionConfig);
        
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
router.get('/verify-session/:session_id', authUser, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.session_id, {
            expand: ['line_items', 'line_items.data.price.product', 'shipping_cost', 'total_details']
        });

        if (session.payment_status !== 'paid') {
            return res.status(400).json(makeError(['Payment not completed']));
        }

        // Get the payment intent to get more details
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

        // Extract order information from metadata
        const cueGuids = session.metadata.cue_guids ? JSON.parse(session.metadata.cue_guids) : [];
        const accessoryItems = session.metadata.accessory_items ? JSON.parse(session.metadata.accessory_items) : [];

        // Extract shipping details from the correct location
        let shippingDetails = session.shipping_details;
        if (!shippingDetails && session.collected_information?.shipping_details) {
            shippingDetails = session.collected_information.shipping_details;
            console.log('Using shipping details from collected_information');
        }

        const orderDetails = {
            sessionId: session.id,
            paymentIntentId: paymentIntent.id,
            status: 'paid',
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency,
            customer: {
                email: session.customer_details.email,
                name: session.customer_details.name,
                phone: session.customer_details.phone
            },
            shipping: shippingDetails,
            billing: session.customer_details.address,
            items: {
                cues: cueGuids,
                accessories: accessoryItems
            },
            createdAt: new Date(session.created * 1000),
            metadata: session.metadata
        };

        const enhancedOrderDetails = await processCompletedOrder(orderDetails);

        return res.status(200).json(makeResponse('success', enhancedOrderDetails, ['Payment verified successfully'], false));
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

// Note: Webhook handling has been moved to /routes/webhook.js

async function processCompletedOrder(orderDetails) {
    try {
        // 1. Create order record in database
        const Order = require('../models/order');
        const User = require('../models/user');
        
        // Verify customer exists (for validation)
        const customer = await User.findOne({ email: orderDetails.customer.email });
        if (!customer) {
            throw new Error(`Customer not found with email: ${orderDetails.customer.email}`);
        }

        // Prepare order items with GUIDs
        const orderItems = {
            cueGuids: [],
            accessoryGuids: []
        };
        
        // Add cue GUIDs to order items
        if (orderDetails.items.cues && orderDetails.items.cues.length > 0) {
            orderItems.cueGuids = orderDetails.items.cues;
        }
        
        // Add accessory GUIDs with quantities to order items
        if (orderDetails.items.accessories && orderDetails.items.accessories.length > 0) {
            orderItems.accessoryGuids = orderDetails.items.accessories.map(item => ({
                guid: item.guid,
                quantity: item.quantity
            }));
        }

        // Create order document
        const order = await Order.create({
            // Let mongoose generate the guid and orderId automatically
            customer: orderDetails.customer.email, // Store email directly
            orderStatus: 'confirmed',
            totalAmount: orderDetails.amount,
            currency: orderDetails.currency.toUpperCase(),
            paymentStatus: 'paid',
            paymentMethod: 'Stripe',
            shippingAddress: orderDetails.shipping ? {
                name: orderDetails.shipping.name,
                address: orderDetails.shipping.address,
                phone: orderDetails.customer.phone
            } : {},
            billingAddress: orderDetails.billing || {},
            orderItems: orderItems,
            createdAt: orderDetails.createdAt,
            updatedAt: new Date()
        });

        console.log('Order created successfully:', order.orderId);
        
        // Update invoice metadata with the actual order ID
        try {
            // Get the checkout session to find the invoice
            const checkoutSession = await stripe.checkout.sessions.retrieve(orderDetails.sessionId);
            if (checkoutSession.invoice) {
                await stripe.invoices.update(checkoutSession.invoice, {
                    metadata: {
                        orderId: order.orderId,
                        ship_status: 'unshipped',
                    }
                });
                console.log('Invoice metadata updated with order ID:', order.orderId);
            }
        } catch (invoiceError) {
            console.error('Error updating invoice metadata:', invoiceError);
            // Don't throw error as the order was successfully created
        }
        
        // 2. Update inventory - mark cues as sold
        if (orderDetails.items.cues && orderDetails.items.cues.length > 0) {
            await Cue.updateMany(
                { guid: { $in: orderDetails.items.cues } },
                { status: 'Sold' }
            );
        }

        // 3. Clear user's cart after successful purchase
        await User.updateOne(
            { email: orderDetails.customer.email },
            { $set: { cart: [] } }
        );

        // 4. Send confirmation email
        // await sendOrderConfirmationEmail(orderDetails);

        // 5. Log analytics
        console.log('Order analytics:', {
            orderId: order.orderId,
            amount: orderDetails.amount,
            itemCount: (orderDetails.items.cues?.length || 0) + (orderDetails.items.accessories?.length || 0),
            country: orderDetails.shipping?.address?.country
        });

        // Return enhanced order details with the generated orderId
        return {
            ...orderDetails,
            orderId: order.orderId
        };
    } catch (error) {
        throw error;
    }
}

// Note: Shipping update handling has been moved to /routes/webhook.js

module.exports = router;
module.exports.processCompletedOrder = processCompletedOrder;