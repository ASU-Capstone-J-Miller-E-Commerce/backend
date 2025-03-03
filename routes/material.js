const express = require('express')
const Material = require('../models/material')
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
        const materials = await Material.find()
        res.status(200).json(makeResponse('success', [materials], ['fetched all materials from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one
router.get('/:id', getMaterial, (req, res, next) => {
    res.send(makeResponse('success', [res.material], ['fetched 1 material from database with id: ' + req.params.id], false))
})

router.post('/', async (req, res, next) => {
    const material = new Material({
        materialCode: req.body.materialCode,
        name: req.body.name,
        imageURL: req.body.imageURL,
        price: req.body.price,
    })

    try {
        const newMaterial = await material.save()
        
        res.status(201).json(makeResponse('success', [newMaterial], ['created a new material in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', getMaterial, async (req, res, next) => {
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
    if(req.body.materialCode != null)
    {
        res.material.materialCode = req.body.materialCode
    }

    try {
        const updatedMaterial = await res.material.save()

        res.json(makeResponse('success', [updatedMaterial], ['updated a material in the database'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', getMaterial, async (req, res, next) => {
    try {
        await res.material.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a material in the database with database id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})


async function getMaterial(req, res, next) {
    let material
    try {
        material = await Material.findById(req.params.id)
        if(material == null){
            return res.status(404).json(makeError(['Cannot find material']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.material = material
    next()
}

module.exports = router