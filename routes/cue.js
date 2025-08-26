const express = require('express')
const Cue = require('../models/cue')
const { makeError, makeData } = require('../response/makeResponse');
const router = express.Router()
const { authUser } = require('./authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const cues = await Cue.find({
            status: { $in: ['Available', 'Coming Soon', 'Sold'] }
        }).select('guid cueNumber name price status imageUrls status isFullSplice includeWrap createdOn forearmInlayQuantity forearmPointQuantity handleInlayQuantity buttsleeveInlayQuantity buttSleevePointQuantity -_id')
        res.status(200).json(makeData(cues))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one by guid
router.get('/:guid', getCueByGuid, (req, res, next) => {
    res.status(200).json(makeData(res.cue))
})

//get one by id (for admin)
router.get('/id/:id', getCue, (req, res, next) => {
    res.status(200).json(makeData(res.cue))
})

async function getCueByGuid(req, res, next) {
    let cue
    try {
        cue = await Cue.findOne({ guid: req.params.guid })
        if(cue === null){
            return res.status(404).json(makeError(['Cannot find cue']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.cue = cue
    next()
}

async function getCue(req, res, next) {
    let cue
    try {
        cue = await Cue.findById(req.params.id)
        if(cue === null){
            return res.status(404).json(makeError(['Cannot find cue']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.cue = cue
    next()
}

module.exports = router