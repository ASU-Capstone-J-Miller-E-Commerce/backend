const stripe = require('stripe')(process.env.STRIPE_KEY);
const express = require('express')
const router = express.Router()
const Cue = require('../models/cue')
const { makeError, makeResponse } = require('../response/makeResponse')


router.post('/create-checkout-session', getCue, async (req, res) => {

    try
    {
        var session;
        console.log(res.cue.stripe_id);
        if(req.body.shipping)
        {
            session = await stripe.checkout.sessions.create({
                customer_email: req.body.email,
                submit_type: 'pay',
                billing_address_collection: 'auto',
                shipping_address_collection: {
                  allowed_countries: ['US', 'CA'],
                },
                line_items: [
                  {
                    price: res.cue.stripe_id,
                    quantity: 1,
                  }
                ],
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
                line_items: [
                  {
                    price: res.cue.stripe_id,
                    quantity: 1,
                  }
                ],
                mode: 'payment',
                success_url: `${process.env.ORIGIN_URL}/success.html`,
                cancel_url: `${process.env.ORIGIN_URL}/cancel.html`,
              });
        }
        res.redirect(303, session.url);
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
  
});

async function getCue(req, res, next) {
    let cue
    try {
        cue = await Cue.findById(req.body.id)
        if(cue == null){
            return res.status(404).json(makeError(['Cannot find cue']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.cue = cue
    next()
}

module.exports = router;