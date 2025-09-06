const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express')
const router = express.Router()
const Cue = require('../models/cue')
const { makeError, makeResponse } = require('../response/makeResponse')


router.post('/create-checkout-session', getCue, async (req, res) => {

    try
    {
        var session;
        var cue_price_ids = [];

        for (const cue of res.cues) {
          const price =  await stripe.products.retrieve(cue.stripe_id, {
            expand: ['default_price'],
          });

          cue_price_ids.push(price.default_price.id);
        }

        const qtyByPrice = new Map();
        for (const cue_price of cue_price_ids) {
          if (!cue_price) continue; // or throw if required
          qtyByPrice.set(cue_price, (qtyByPrice.get(cue_price) || 0) + 1);
        }
        const line_items_ = [...qtyByPrice.entries()].map(([price, quantity]) => ({ price, quantity }));

        if (line_items_.length === 0) {
          return res.status(400).json(makeError(['No purchasable items.']));
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
                line_items: line_items_,
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
                line_items: line_items_,
                mode: 'payment',
                success_url: `${process.env.ORIGIN_URL}/success.html`,
                cancel_url: `${process.env.ORIGIN_URL}/cancel.html`,
              });
        }
        
        res.set("Location", session.url);
        return res.status(303).json(makeResponse('success', session.url, ['Checkout Link Created.'], false));
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
  
});

async function getCue(req, res, next) {
    let cues
    try {
        cues = await Cue.find({
          _id: { $in: req.body.ids }
        })
        if(cues === null){
            return res.status(404).json(makeError(['Cannot find cue(s)']))
        }

    } catch (err) {
        console.log(err)
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.cues = cues
    next()
}

module.exports = router;