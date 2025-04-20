const express = require('express')
const Accessory = require('../models/accessory')
const { makeError, makeData } = require('../response/makeResponse');
const router = express.Router()

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const accessories = await Accessory.find({ status: 'Available' }).select('guid accessoryNumber name price status imageUrls createdOn')
        res.status(200).json(makeData(accessories))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

module.exports = router;