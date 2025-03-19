const express = require('express')
const Wood = require('../../models/wood')
const Crystal = require('../../models/crystal')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const crystals = await Crystal.find()
        const woods = await Wood.find()
        res.status(200).json(makeResponse('success', [crystals, woods], ['fetched all materials from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.get('/crystal/', authAdmin, async (req, res, next) => {
    try {
        const crystals = await Crystal.find()
        res.status(200).json(makeResponse('success', [crystals], ['fetched all crystals from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.get('/wood/', authAdmin, async (req, res, next) => {
    try {
        const woods = await Wood.find()
        res.status(200).json(makeResponse('success', [woods], ['fetched all woods from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

//get one
router.get('/wood/:id', authAdmin, getWood, (req, res, next) => {
    res.send(makeResponse('success', [res.wood], ['fetched 1 wood from database with id: ' + req.params.id], false))
})

router.get('/crystal/:id', authAdmin, getCrystal, (req, res, next) => {
    res.send(makeResponse('success', [res.crystal], ['fetched 1 crystal from database with id: ' + req.params.id], false))
})

router.post('/wood/', authAdmin, async (req, res, next) => {
    const wood = new Wood({
        materialCode: req.body.materialCode,
        status: req.body.status,
        description: req.body.description,
        tier: req.body.tier,
        colors: req.body.colors,
        commonName: req.body.commonName,
        alternateName1: req.body.alternateName1,
        alternateName2: req.body.alternateName2,
        scientificName: req.body.scientificName,
        brief: req.body.brief,
        jankaHardness: req.body.jankaHardness,
        treeHeight: req.body.treeHeight,
        trunkDiameter: req.body.trunkDiameter,
        geographicOrigin: req.body.geographicOrigin,
        streaksVeins: req.body.streaksVeins,
        texture: req.body.texture,
        grainPattern: req.body.grainPattern,
        metaphysicalTags: req.body.metaphysicalTags,
        createdOn: req.body.createdOn,
        updatedOn: req.body.updatedOn
    })

    try {
        const newWood = await wood.save()
        
        res.status(201).json(makeResponse('success', [newWood], ['created a new wood in the database'], false))
    } catch (err) {
        res.status(400).json(makeError(["one or more fields is incorrect, the database returned the following error: " + err]))
    }
})

router.post('/crystal/', authAdmin, async (req, res, next) => {
    const crystal = new Crystal({
        materialCode: req.body.materialCode,
        status: req.body.status,
        description: req.body.description,
        tier: req.body.tier,
        colors: req.body.colors,
        crystalName: req.body.crystalName,
        crystalCategory: req.body.crystalCategory,
        psychologicalCorrespondence: req.body.psychologicalCorrespondence,
        createdOn: req.body.createdOn,
        updatedOn: req.body.updatedOn
    });

    try {
        const newCrystal = await crystal.save()
        
        res.status(201).json(makeResponse('success', [newCrystal], ['created a new crystal in the database'], false))
    } catch (err) {
        res.status(400).json(makeError(["one or more fields is incorrect, the database returned the following error: " + err]))
    }
})

//update
router.patch('/wood/:id', authAdmin, getWood, async (req, res, next) => {
    if (req.body.materialCode != null) {
        res.material.materialCode = req.body.materialCode;
    }
    if (req.body.status != null) {
        res.material.status = req.body.status;
    }
    if (req.body.description != null) {
        res.material.description = req.body.description;
    }
    if (req.body.tier != null) {
        res.material.tier = req.body.tier;
    }
    if (req.body.colors != null) {
        res.material.colors = req.body.colors;
    }
    if (req.body.commonName != null) {
        res.material.commonName = req.body.commonName;
    }
    if (req.body.alternateName1 != null) {
        res.material.alternateName1 = req.body.alternateName1;
    }
    if (req.body.alternateName2 != null) {
        res.material.alternateName2 = req.body.alternateName2;
    }
    if (req.body.scientificName != null) {
        res.material.scientificName = req.body.scientificName;
    }
    if (req.body.brief != null) {
        res.material.brief = req.body.brief;
    }
    if (req.body.jankaHardness != null) {
        res.material.jankaHardness = req.body.jankaHardness;
    }
    if (req.body.treeHeight != null) {
        res.material.treeHeight = req.body.treeHeight;
    }
    if (req.body.trunkDiameter != null) {
        res.material.trunkDiameter = req.body.trunkDiameter;
    }
    if (req.body.geographicOrigin != null) {
        res.material.geographicOrigin = req.body.geographicOrigin;
    }
    if (req.body.streaksVeins != null) {
        res.material.streaksVeins = req.body.streaksVeins;
    }
    if (req.body.texture != null) {
        res.material.texture = req.body.texture;
    }
    if (req.body.grainPattern != null) {
        res.material.grainPattern = req.body.grainPattern;
    }
    if (req.body.metaphysicalTags != null) {
        res.material.metaphysicalTags = req.body.metaphysicalTags;
    }
    
    res.material.updatedOn = Date.now();

    try {
        const updatedWood = await res.wood.save()

        res.json(makeResponse('success', [updatedWood], ['updated a wood in the database'], false))
    } catch (err) {
        res.status(400).json(makeError(["one or more fields is incorrect, the database returned the following error: " + err]))
    }
})

router.patch('/crystal/:id', authAdmin, getCrystal, async (req, res, next) => {
    if (req.body.materialCode != null) {
        res.material.materialCode = req.body.materialCode;
    }
    if (req.body.status != null) {
        res.material.status = req.body.status;
    }
    if (req.body.description != null) {
        res.material.description = req.body.description;
    }
    if (req.body.tier != null) {
        res.material.tier = req.body.tier;
    }
    if (req.body.colors != null) {
        res.material.colors = req.body.colors;
    }
    if (req.body.crystalName != null) {
        res.material.crystalName = req.body.crystalName;
    }
    if (req.body.crystalCategory != null) {
        res.material.crystalCategory = req.body.crystalCategory;
    }
    if (req.body.psychologicalCorrespondence != null) {
        res.material.psychologicalCorrespondence = req.body.psychologicalCorrespondence;
    }
    
    res.material.updatedOn = Date.now();

    try {
        const updatedCrystal = await res.crystal.save()

        res.json(makeResponse('success', [updatedCrystal], ['updated a crystal in the database'], false))
    } catch (err) {
        res.status(400).json(makeError(["one or more fields is incorrect, the database returned the following error: " + err]))
    }
})

router.delete('/wood/:id', authAdmin, getWood, async (req, res, next) => {
    try {
        await res.wood.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a wood in the database with database id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.delete('/crystal/:id', authAdmin, getCrystal, async (req, res, next) => {
    try {
        await res.crystal.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a crystal in the database with database id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})


async function getWood(req, res, next) {
    let wood
    try {
        wood = await Wood.findById(req.params.id)
        if(wood == null){
            return res.status(404).json(makeError(['Cannot find wood']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.wood = wood
    next()
}

async function getCrystal(req, res, next) {
    let crystal
    try {
        crystal = await Crystal.findById(req.params.id)
        if(crystal == null){
            return res.status(404).json(makeError(['Cannot find crystal']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.crystal = crystal
    next()
}

module.exports = router