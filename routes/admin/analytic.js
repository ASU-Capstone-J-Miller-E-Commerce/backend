const express = require('express')
const Analytic = require('../../models/analytic')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const Wood = require('../../models/wood')
const Crystal = require('../../models/crystal')
const { authUser , authAdmin } = require('../authorization');
const { getAllowedOrigins } = require('../../utils/environment');

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
        const woods = await Wood.find({}, {commonName: 1, clicks: 1, _id: 0})
        const crystals = await Crystal.find({}, {crystalName: 1, clicks: 1, _id: 0})
        const analytics = { 
            woods: woods.map(item => ({name: item.commonName, clicks: item.clicks || 0})), 
            crystals: crystals.map(item => ({name: item.crystalName, clicks: item.clicks || 0})) 
        }
        res.status(200).json(makeResponse('success', analytics, ['Fetched Analytics from database.'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one
router.get('/:id', authAdmin, getAnalytic, (req, res, next) => {
    res.send(makeResponse('success', res.analytic, ['fetched 1 analytic from the database with id: ' + req.params.id], false))
})

router.post('/', async (req, res, next) => {
    const analytic = new Analytic({
        interaction: req.body.interaction,
        timestamp: req.body.timestamp,
        userId: req.body.userId, 
        page: req.body.page,
        data: req.body.data
    })

    try {
        const newAnalytic = await analytic.save()
        
        res.status(201).json(makeResponse('success', newAnalytic, ['created new analytic in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

//Wood Analytics Get
//Not yet implemented.
router.get('/wood/clicks', async (req, res) => {
    const { timeframe } = req.query
    const now = new Date()
    let since

    //Create window for respective timeframe.
    switch(timeframe)
    {
        case '1d': since = new Date(now.setDate(now.getDate() - 1)); break;
        case '7d': since = new Date(now.setDate(now.getDate() - 7)); break;
        case '1m': since = new Date(now.setMonth(now.getMonth() - 1)); break;
        default: since = new Date(0);   //No query , this will return all time.
    }

    const woods = await Wood.find().select('name clickHistory')

    const clickMap = woods.map(w => {
        const totalClicks = (w.clickHistory || []).reduce((sum, entry) => 
        {
            if(new Date(entry.date) >= since) sum += entry.clicks
            return sum
        }, 0)
        return { name: w.name, totalClicks}
    })
    res.status(200).json(makeResponse('success', clickMap, ['Fetched all clicks for wood in the timeframe.'], false))
})

//Crystal Analytics Get
//Not yet implemented
router.get('/crystal/clicks', async (req, res) => {
    const { timeframe } = req.query
    const now = new Date()
    let since

    //Create window for respective timeframe.
    switch(timeframe)
    {
        case '1d': since = new Date(now.setDate(now.getDate() - 1)); break;
        case '7d': since = new Date(now.setDate(now.getDate() - 7)); break;
        case '1m': since = new Date(now.setMonth(now.getMonth() - 1)); break;
        default: since = new Date(0);   //No query , this will return all time.
    }

    const crystals = await Crystal.find().select('name clickHistory')

    const clickMap = crystals.map(w => {
        const totalClicks = (w.clickHistory || []).reduce((sum, entry) => 
        {
            if(new Date(entry.date) >= since) sum += entry.clicks
            return sum
        }, 0)
        return { name: w.name, totalClicks}
    })
    res.status(200).json(makeResponse('success', clickMap, ['Fetched all clicks for crystals in the timeframe.'], false))
})

async function getAnalytic(req, res, next) {
    let analytic
    try {
        analytic = await Analytic.findById(req.params.id)
        if(analytic === null){
            return res.status(404).json(makeError(['cannot find analytic']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.analytic = analytic
    next()
}

module.exports = router