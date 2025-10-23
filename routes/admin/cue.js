const express = require('express')
const Cue = require('../../models/cue')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser, authAdmin } = require('../authorization');
const { getAllowedOrigins, getStripeKey } = require('../../utils/environment');
const stripe = require('stripe')(getStripeKey());

router.use(function (req, res, next) {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const cues = await Cue.find()
        res.status(200).json(makeResponse('success', cues, ['fetched all cues from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

//get one
router.get('/:id', authAdmin, getCue, (req, res, next) => {
    res.send(makeResponse('success', res.cue, ['fetched 1 cue from database with id: ' + req.params.id], false))
})

router.post('/', authAdmin, async (req, res, next) => {
    try {
        // Check featured cue limit before creating
        if (req.body.featured === true) {
            const featuredCount = await Cue.countDocuments({ featured: true });
            if (featuredCount >= 4) {
                return res.status(400).json(makeError(['Maximum of 4 featured cues allowed. Please unfeatured another cue first.']));
            }
        }

        const cue = new Cue(req.body);

        const priceDecimal = parseFloat(req.body.price)

        const productData = {
            name: req.body.name,
            description: req.body.description && req.body.description.trim() !== '' ? req.body.description : undefined,
            images: req.body.imageUrls
        };

        // Only add price data if price is valid
        if (!isNaN(priceDecimal) && priceDecimal > 0) {
            productData.default_price_data = {
                currency: 'usd',
                unit_amount_decimal: priceDecimal * 100
            };
        }

        const product = await stripe.products.create(productData);

        cue.stripe_id = product.id

        const newCue = await cue.save()
        
        res.status(201).json(makeResponse('success', newCue, ['New Cue successfully created.'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', authAdmin, getCue, async (req, res, next) => {
    try {
        // Check featured cue limit before updating
        if (req.body.featured === true && res.cue.featured !== true) {
            const featuredCount = await Cue.countDocuments({ featured: true });
            if (featuredCount >= 4) {
                return res.status(400).json(makeError(['Maximum of 4 featured cues allowed. Please unfeatured another cue first.']));
            }
        }

        for (const key in req.body) {
            if (req.body[key] != null) {
                res.cue[key] = req.body[key];
            }
        }

        if(req.body.price && !isNaN(parseFloat(req.body.price)) && parseFloat(req.body.price) > 0)
        {
            const priceDecimal = parseFloat(req.body.price)

            const newPrice = await stripe.prices.create({
                product: res.cue.stripe_id,      
                unit_amount: priceDecimal * 100,           
                currency: 'usd'
            });

            await stripe.products.update(res.cue.stripe_id, {
                default_price: newPrice.id
            });
        }

        if(req.body.description && req.body.description.trim() !== '')
        {
            await stripe.products.update(res.cue.stripe_id, {
                description: req.body.description
            });
        }

        if(req.body.name)
        {
            await stripe.products.update(res.cue.stripe_id, {
                name: req.body.name
            });
        }

        res.cue.updatedOn = Date.now();

        const updateCue = await res.cue.save()

        res.json(makeResponse('success', updateCue, ['Cue edited and saved successfully.'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', authAdmin, getCue, async (req, res, next) => {
    try {
        await res.cue.deleteOne()
        res.status(201).json(makeResponse('success', false, ['Cue Deleted Successfully.'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})


async function getCue(req, res, next) {
    let cue
    try {
        cue = await Cue.findById(req.params.id)
        if(cue === null){
            return res.status(404).json(makeError(['Cannot find cue']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.cue = cue
    next()
}

module.exports = router