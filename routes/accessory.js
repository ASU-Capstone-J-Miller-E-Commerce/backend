const express = require('express')
const Accessory = require('../models/accessory')
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
        const accessories = await Accessory.find()
        res.status(200).json(makeResponse('success', [accessories], ['fetched all accessories from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one
router.get('/:id', getAccessory, (req, res, next) => {
    res.send(makeResponse('success', [res.accessory], ['fetched 1 accessory from database with id: ' + req.params.id], false))
})

router.post('/', async (req, res, next) => {
    const accessory = new Accessory({
        accessoryCode: req.body.accessoryCode,
        name: req.body.name,
        imageURL: req.body.imageURL,
        price: req.body.price,
    })

    try {
        const newAccessory = await accessory.save()
        
        res.status(201).json(makeResponse('success', [newAccessory], ['created a new accessory in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', getAccessory, async (req, res, next) => {
    if(req.body.name != null)
    {
        res.material.name = req.body.name
    }
    if(req.body.price != null)
    {
        res.material.price = req.body.price
    }
    if(req.body.imageURL != null)
    {
        res.material.imageURL = req.body.imageURL
    }
    if(req.body.accessoryCode != null)
    {
        res.material.accessoryCode = req.body.accessoryCode
    }

    try {
        const updatedAccessory = await res.accessory.save()

        res.json(makeResponse('success', [updatedAccessory], ['updated a accessory in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', getAccessory, async (req, res, next) => {
    try {
        await res.accessory.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a accessory in the database with database id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
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
        return res.status(500).json(makeError([err.message]))
    }

    res.accessory = accessory
    next()
}

module.exports = router