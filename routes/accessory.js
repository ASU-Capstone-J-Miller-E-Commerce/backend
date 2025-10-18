const express = require('express')
const Accessory = require('../models/accessory')
const { makeError, makeData } = require('../response/makeResponse');
const { getOriginUrl } = require('../utils/environment');
const router = express.Router()

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", getOriginUrl()) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const accessories = await Accessory.find({ 
            status: { $in: ['Available', 'Coming Soon', 'Sold'] }
        }).select('guid accessoryNumber name price status imageUrls createdOn -_id')
        res.status(200).json(makeData(accessories))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

// Debug route to see all accessories regardless of status
router.get('/debug/all', async (req, res, next) => {
    try {
        const accessories = await Accessory.find({}).select('guid accessoryNumber name status -_id')
        res.status(200).json(makeData(accessories))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one by guid
router.get('/:guid', getAccessoryByGuid, (req, res, next) => {
    res.status(200).json(makeData(res.accessory))
})

async function getAccessoryByGuid(req, res, next) {
    let accessory
    try {
        console.log('Looking for accessory with GUID:', req.params.guid)
        accessory = await Accessory.findOne({ guid: req.params.guid })
        console.log('Found accessory:', accessory ? 'Yes' : 'No')
        if(accessory === null){
            return res.status(404).json(makeError(['Cannot find accessory']))
        }
    } catch (err) {
        console.log('Error finding accessory:', err.message)
        return res.status(500).json(makeError([err.message]))
    }

    res.accessory = accessory
    next()
}

module.exports = router;