const express = require('express')
const Analytic = require('../../models/analytic')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const analytics = await Analytic.find()
        res.status(200).json(makeResponse('success', analytics, ['fetched all analytics from database'], false))
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

async function getAnalytic(req, res, next) {
    let analytic
    try {
        analytic = await Analytic.findById(req.params.id)
        if(analytic == null){
            return res.status(404).json(makeError(['cannot find analytic']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.analytic = analytic
    next()
}

module.exports = router