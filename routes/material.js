const express = require('express')
const Wood = require('../models/wood')
const Crystal = require('../models/crystal')
const { makeError, makeData } = require('../response/makeResponse');
const router = express.Router()

router.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL)
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

// Add this line if it's missing - exports the router
module.exports = router;