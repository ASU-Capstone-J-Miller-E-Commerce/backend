const express = require('express')
const Cue = require('../models/cue')
const { makeError, makeResponse } = require('../response/makeResponse');
const router = express.Router()


router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const cues = await Cue.find()
        res.status(200).json(makeResponse('success', [cues], ['fetched all cues from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one
router.get('/:id', getCue, (req, res, next) => {
    res.send(makeResponse('success', [res.cue], ['fetched 1 cue from database with id: ' + req.params.id], false))
})

router.post('/', async (req, res, next) => {
    const cue = new Cue({
        prodId: req.body.prodId,
        listDate: req.body.listDate,
        availableDate: req.body.availableDate,
        price: req.body.price,
        tipMaterial: req.body.tipMaterial,
        tipSize: req.body.tipSize,
        ferruleMaterial: req.body.ferruleMaterial,
        shaftMaterial: req.body.shaftMaterial,
        collarMaterial: req.body.collarMaterial,
        jointPinSize: req.body.jointPinSize,
        jointPinMaterial: req.body.jointPinMaterial,
        jointCollarMaterial: req.body.jointCollarMaterial,
        forearmSize: req.body.forearmSize,
        forearmMaterial: req.body.forearmMaterial,
        forearmPointMaterial: req.body.forearmPointMaterial,
        veneerMatieral: req.body.veneerMatieral,
        handleMaterial: req.body.handleMaterial,
        buttSleeveSize: req.body.buttSleeveSize,
        buttSleeveMaterial: req.body.buttSleeveMaterial,
        buttSleeveVeneerMaterial: req.body.buttSleeveVeneerMaterial,
        buttCapMaterial: req.body.buttCapMaterial,
        bumperMaterial: req.body.bumperMaterial
    })

    try {
        const newCue = await cue.save()
        
        res.status(201).json(makeResponse('success', [newCue], ['created a new cue in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', getCue, async (req, res, next) => {
    if(req.body.prodId != null)
    {
        res.cue.prodId = req.body.prodId
    }
    if(req.body.listDate != null)
    {
        res.cue.listDate = req.body.listDate
    }
    if(req.body.availableDate != null)
    {
        res.cue.availableDate = req.body.availableDate
    }
    if(req.body.price != null)
    {
        res.cue.price = req.body.price
    }
    if(req.body.tipMaterial != null)
    {
        res.cue.tipMaterial = req.body.tipMaterial
    }
    if(req.body.tipSize != null)
    {
        res.cue.tipSize = req.body.tipSize
    }
    if(req.body.ferruleMaterial != null)
    {
        res.cue.ferruleMaterial = req.body.ferruleMaterial
    }
    if(req.body.shaftMaterial != null)
    {
        res.cue.shaftMaterial = req.body.shaftMaterial
    }
    if(req.body.collarMaterial != null)
    {
        res.cue.collarMaterial = req.body.collarMaterial
    }
    if(req.body.jointPinSize != null)
    {
        res.cue.jointPinSize = req.body.jointPinSize
    }
    if(req.body.jointPinMaterial != null)
    {
        res.cue.jointPinMaterial = req.body.jointPinMaterial
    }
    if(req.body.jointCollarMaterial != null)
    {
        res.cue.jointCollarMaterial = req.body.jointCollarMaterial
    }
    if(req.body.forearmSize != null)
    {
        res.cue.forearmSize = req.body.forearmSize
    }
    if(req.body.forearmMaterial != null)
    {
        res.cue.forearmMaterial = req.body.forearmMaterial
    }
    if(req.body.forearmPointMaterial != null)
    {
        res.cue.forearmPointMaterial = req.body.forearmPointMaterial
    }
    if(req.body.veneerMatieral != null)
    {
        res.cue.veneerMatieral = req.body.veneerMatieral
    }
    if(req.body.handleMaterial != null)
    {
        res.cue.handleMaterial = req.body.handleMaterial
    }
    if(req.body.buttSleeveSize != null)
    {
        res.cue.buttSleeveSize = req.body.buttSleeveSize
    }
    if(req.body.buttSleeveMaterial != null)
    {
        res.cue.buttSleeveMaterial = req.body.buttSleeveMaterial
    }
    if(req.body.buttSleeveVeneerMaterial != null)
    {
        res.cue.buttSleeveVeneerMaterial = req.body.buttSleeveVeneerMaterial
    }
    if(req.body.buttCapMaterial != null)
    {
        res.cue.buttCapMaterial = req.body.buttCapMaterial
    }
    if(req.body.bumperMaterial != null)
    {
        res.cue.bumperMaterial = req.body.bumperMaterial
    }
    
    res.cue.updatedOn = Date.now()


    try {
        const updateCue = await res.cue.save()

        res.json(makeResponse('success', [updateCue], ['updated a cue in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', getCue, async (req, res, next) => {
    try {
        await res.cue.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a cue in the database with id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})


async function getCue(req, res, next) {
    let cue
    try {
        cue = await Cue.findById(req.params.id)
        if(cue == null){
            return res.status(404).json(makeError(['Cannot find cue']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.cue = cue
    next()
}

module.exports = router