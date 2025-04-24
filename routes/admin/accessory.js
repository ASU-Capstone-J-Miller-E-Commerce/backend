const express = require('express')
const Accessory = require('../../models/accessory')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const accessories = await Accessory.find()
        res.status(200).json(makeResponse('success', accessories, ['fetched all accessories from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

//get one
router.get('/:id', authAdmin, getAccessory, (req, res, next) => {
    res.send(makeResponse('success', res.accessory, ['fetched 1 accessory from database with id: ' + req.params.id], false))
})

router.post('/', authAdmin, async (req, res, next) => {
    const accessory = new Accessory(req.body);

    const priceDecimal = parseFloat(req.body.price)
    
    const product = await stripe.products.create({
        name: req.body.name,
        description: req.body.description,
        images: req.body.imageUrls,
        default_price_data: {
            currency: 'usd',
            unit_amount_decimal: priceDecimal * 100
        }
    });

    accessory.stripe_id = product.id

    try {
        const newAccessory = await accessory.save()
        
        res.status(201).json(makeResponse('success', newAccessory, ['New accessory successfully created.'], false))
    } catch (err) {
        res.status(400).json(makeError(["One or more fields is incorrect, the database returned the following error: " + err]))
    }
})

router.put('/:id', authAdmin, getAccessory, async (req, res, next) => {
    for (const key in req.body) {
        if (req.body[key] != null) {
            res.accessory[key] = req.body[key];
        }
    }

    if(req.body.price)
    {
        const priceDecimal = parseFloat(req.body.price)

        const newPrice = await stripe.prices.create({
            product: res.accessory.stripe_id,      
            unit_amount: priceDecimal * 100,           
            currency: 'usd'
        });

        await stripe.products.update(res.accessory.stripe_id, {
            default_price: newPrice.id
        });
    }

    if(req.body.description)
    {
        await stripe.products.update(res.accessory.stripe_id, {
            description: req.body.description
        });
    }

    if(req.body.name)
    {
        await stripe.products.update(res.accessory.stripe_id, {
            name: req.body.name
        });
    }

    res.accessory.updatedOn = Date.now();

    try {
        const updatedAccessory = await res.accessory.save()

        res.json(makeResponse('success', updatedAccessory, ['Accessory edited and saved successfully.'], false))
    } catch (err) {
        res.status(400).json(makeError(["One or more fields is incorrect. The database returned the following error: " + err]))
    }
})

router.delete('/:id', authAdmin, getAccessory, async (req, res, next) => {
    try {
        await res.accessory.deleteOne()
        res.status(201).json(makeResponse('success', false, ['Accessory Deleted Successfully.'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})


async function getAccessory(req, res, next) {
    let accessory
    try {
        accessory = await Accessory.findById(req.params.id)
        if(accessory == null){
            return res.status(404).json(makeError(['Cannot find accessory']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.accessory = accessory
    next()
}

module.exports = router