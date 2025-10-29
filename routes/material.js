const express = require('express')
const Wood = require('../models/wood')
const Crystal = require('../models/crystal')
const { makeError, makeData } = require('../response/makeResponse');
const { getAllowedOrigins } = require('../utils/environment');
const router = express.Router()

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
router.get('/', async (req, res, next) => {
    try {
        const crystals = await Crystal.find().find({ status: 'Available' }).select('guid crystalName tier status imageUrls createdOn colors -_id')
        const woods = await Wood.find().find({ status: 'Available' }).select('guid commonName tier status imageUrls createdOn colors -_id')
        res.status(200).json(makeData([...crystals, ...woods]))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

// Get individual wood by GUID
router.get('/wood/:guid', async (req, res, next) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const wood = await Wood.findOneAndUpdate(
            { guid: req.params.guid },
            { $inc: { clicks: 1, [`clickHistory.${today}`]: 1 } },
            {new: true, projection: '-_id'} )
        if (!wood) {
            return res.status(404).json(makeError(['Wood not found']))
        }
        res.status(200).json(makeData(wood))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

// Get individual crystal by GUID
router.get('/crystal/:guid', async (req, res, next) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const crystal = await Crystal.findOneAndUpdate(
            { guid: req.params.guid },
            { $inc: { clicks: 1, [`clickHistory.${today}`]: 1 } },
            {new: true, projection: '-_id'} )
        if (!crystal) {
            return res.status(404).json(makeError(['Crystal not found']))
        }
        res.status(200).json(makeData(crystal))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

// Add this line if it's missing - exports the router
module.exports = router;