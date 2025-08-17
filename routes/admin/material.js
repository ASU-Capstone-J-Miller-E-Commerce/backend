const express = require('express')
const Wood = require('../../models/wood')
const Crystal = require('../../models/crystal')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const crystals = await Crystal.find()
        const woods = await Wood.find()
        res.status(200).json(makeResponse('success', [...crystals, ...woods], ['fetched all materials from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.get('/crystal/', authAdmin, async (req, res, next) => {
    try {
        const crystals = await Crystal.find()
        res.status(200).json(makeResponse('success', crystals, ['fetched all crystals from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.get('/wood/', authAdmin, async (req, res, next) => {
    try {
        const woods = await Wood.find()
        res.status(200).json(makeResponse('success', woods, ['fetched all woods from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

//get one
router.get('/wood/:id', authAdmin, getWood, (req, res, next) => {
    res.send(makeResponse('success', res.wood, ['fetched 1 wood from database with id: ' + req.params.id], false))
})

router.get('/crystal/:id', authAdmin, getCrystal, (req, res, next) => {
    res.send(makeResponse('success', res.crystal, ['fetched 1 crystal from database with id: ' + req.params.id], false))
})

router.post('/wood/', async (req, res, next) => {
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
        
        res.status(201).json(makeResponse('success', newWood, ['New wood successfully created.'], false))
    } catch (err) {
        res.status(400).json(makeError(["One or more fields is incorrect. The database returned the following error: " + err]))
    }
})

router.post('/crystal/', authAdmin, async (req, res, next) => {
    const crystal = new Crystal({
        materialCode: req.body.materialCode,
        status: req.body.status,
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
        
        res.status(201).json(makeResponse('success', newCrystal, ['New Stone/Crystal successfully created.'], false))
    } catch (err) {
        res.status(400).json(makeError(["One or more fields is incorrect. The database returned the following error: " + err]))
    }
})

//update
router.put('/wood/:id', authAdmin, getWood, async (req, res, next) => {
    if (req.body.materialCode != null) {
        res.wood.materialCode = req.body.materialCode;
    }
    if (req.body.status != null) {
        res.wood.status = req.body.status;
    }
    if (req.body.description != null) {
        res.wood.description = req.body.description;
    }
    if (req.body.tier != null) {
        res.wood.tier = req.body.tier;
    }
    if (req.body.colors != null) {
        res.wood.colors = req.body.colors;
    }
    if (req.body.commonName != null) {
        res.wood.commonName = req.body.commonName;
    }
    if (req.body.alternateName1 != null) {
        res.wood.alternateName1 = req.body.alternateName1;
    }
    if (req.body.alternateName2 != null) {
        res.wood.alternateName2 = req.body.alternateName2;
    }
    if (req.body.scientificName != null) {
        res.wood.scientificName = req.body.scientificName;
    }
    if (req.body.brief != null) {
        res.wood.brief = req.body.brief;
    }
    if (req.body.jankaHardness != null) {
        res.wood.jankaHardness = req.body.jankaHardness;
    }
    if (req.body.treeHeight != null) {
        res.wood.treeHeight = req.body.treeHeight;
    }
    if (req.body.trunkDiameter != null) {
        res.wood.trunkDiameter = req.body.trunkDiameter;
    }
    if (req.body.geographicOrigin != null) {
        res.wood.geographicOrigin = req.body.geographicOrigin;
    }
    if (req.body.streaksVeins != null) {
        res.wood.streaksVeins = req.body.streaksVeins;
    }
    if (req.body.texture != null) {
        res.wood.texture = req.body.texture;
    }
    if (req.body.grainPattern != null) {
        res.wood.grainPattern = req.body.grainPattern;
    }
    if (req.body.metaphysicalTags != null) {
        res.wood.metaphysicalTags = req.body.metaphysicalTags;
    }
    if (req.body.imageUrls != null) {
        res.wood.imageUrls = req.body.imageUrls;
    }
    
    res.wood.updatedOn = Date.now();

    try {
        const updatedWood = await res.wood.save()

        res.json(makeResponse('success', updatedWood, ['Wood edited and saved successfully.'], false))
    } catch (err) {
        res.status(400).json(makeError(["One or more fields is incorrect. The database returned the following error: " + err]))
    }
})

router.put('/crystal/:id', authAdmin, getCrystal, async (req, res, next) => {
    if (req.body.materialCode != null) {
        res.crystal.materialCode = req.body.materialCode; // FIXED
    }
    if (req.body.status != null) {
        res.crystal.status = req.body.status; // FIXED
    }
    if (req.body.tier != null) {
        res.crystal.tier = req.body.tier;
    }
    if (req.body.colors != null) {
        res.crystal.colors = req.body.colors;
    }
    if (req.body.crystalName != null) {
        res.crystal.crystalName = req.body.crystalName;
    }
    if (req.body.crystalCategory != null) {
        res.crystal.crystalCategory = req.body.crystalCategory;
    }
    if (req.body.psychologicalCorrespondence != null) {
        res.crystal.psychologicalCorrespondence = req.body.psychologicalCorrespondence;
    }
    if (req.body.imageUrls != null) {
        res.crystal.imageUrls = req.body.imageUrls;
    }
    
    res.crystal.updatedOn = Date.now();

    try {
        const updatedCrystal = await res.crystal.save()

        res.json(makeResponse('success', updatedCrystal, ['Stone/Crystal edited and saved successfully.'], false))
    } catch (err) {
        res.status(400).json(makeError(["one or more fields is incorrect, the database returned the following error: " + err]))
    }
})

router.delete('/wood/:id', authAdmin, getWood, async (req, res, next) => {
    try {
        await res.wood.deleteOne()
        res.status(201).json(makeResponse('success', false, ['Wood Deleted Successfully.'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

router.delete('/crystal/:id', authAdmin, getCrystal, async (req, res, next) => {
    try {
        await res.crystal.deleteOne()
        res.status(201).json(makeResponse('success', false, ['Stone/Crystal Deleted Successfully.'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})


async function getWood(req, res, next) {
    let wood
    try {
        wood = await Wood.findById(req.params.id)
        if(wood === null){
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
        if(crystal === null){
            return res.status(404).json(makeError(['Cannot find Stone/Crystal']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.crystal = crystal
    next()
}

module.exports = router