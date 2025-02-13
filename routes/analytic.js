const express = require('express')
const Analytic = require('../models/analytic')
const router = express.Router()


router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:5000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const analytics = await Analytic.find()
        res.status(200).json(analytics)
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})

//get one
router.get('/:id', getAnalytic, (req, res, next) => {
    res.send(res.analytic)
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
        
        res.status(201).json(newAnalytic)
    } catch (err) {
        res.status(400).json({message: err.message})
    }
})

async function getAnalytic(req, res, next) {
    let analytic
    try {
        analytic = await Analytic.findById(req.params.id)
        if(analytic == null){
            return res.status(404).json({ message: 'Cannot find appointment'})
        }
    } catch (err) {
        return res.status(500).json({ message: err.message})
    }

    res.analytic = analytic
    next()
}

module.exports = router