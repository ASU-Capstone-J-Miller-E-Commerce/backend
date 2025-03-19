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
        commonName: req.body.commonName,
        altName1: req.body.altName1,
        altName2: req.body.altName2,
        jankaHardness: req.body.jankaHardness,
        geographicOrigin: req.body.geographicOrigin,
        scientificName: req.body.scientificName,
        color1: req.body.color1,
        color2: req.body.color2,
        color3: req.body.color3,
        streaksAndVeins: req.body.streaksAndVeins,
        texture: req.body.texture,
        grainPattern: req.body.grainPattern,
        image: req.body.image,
        inStock: req.body.inStock,
        metaphysicalTags1: req.body.metaphysicalTags1,
        metaphysicalTags2: req.body.metaphysicalTags2,
        metaphysicalTags3: req.body.metaphysicalTags3,
        metaphysicalTags4: req.body.metaphysicalTags4,
        metaphysicalAndSpiritualDesc: req.body.metaphysicalAndSpiritualDesc,
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
        crystalCategory: req.body.crystalCategory,
        crystalName: req.body.crystalName,
        color1: req.body.color1,
        color2: req.body.color2,
        color3: req.body.color3,
        rarity: req.body.rarity,
        psychologicalCorr1: req.body.psychologicalCorr1,
        psychologicalCorr2: req.body.psychologicalCorr2,
        psychologicalCorr3: req.body.psychologicalCorr3,
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
    if (req.body.commonName != null) {
        res.material.commonName = req.body.commonName;
    }
    if (req.body.altName1 != null) {
        res.material.altName1 = req.body.altName1;
    }
    if (req.body.altName2 != null) {
        res.material.altName2 = req.body.altName2;
    }
    if (req.body.jankaHardness != null) {
        res.material.jankaHardness = req.body.jankaHardness;
    }
    if (req.body.geographicOrigin != null) {
        res.material.geographicOrigin = req.body.geographicOrigin;
    }
    if (req.body.scientificName != null) {
        res.material.scientificName = req.body.scientificName;
    }
    if (req.body.color1 != null) {
        res.material.color1 = req.body.color1;
    }
    if (req.body.color2 != null) {
        res.material.color2 = req.body.color2;
    }
    if (req.body.color3 != null) {
        res.material.color3 = req.body.color3;
    }
    if (req.body.streaksAndVeins != null) {
        res.material.streaksAndVeins = req.body.streaksAndVeins;
    }
    if (req.body.texture != null) {
        res.material.texture = req.body.texture;
    }
    if (req.body.grainPattern != null) {
        res.material.grainPattern = req.body.grainPattern;
    }
    if (req.body.image != null) {
        res.material.image = req.body.image;
    }
    if (req.body.inStock != null) {
        res.material.inStock = req.body.inStock;
    }
    if (req.body.metaphysicalTags1 != null) {
        res.material.metaphysicalTags1 = req.body.metaphysicalTags1;
    }
    if (req.body.metaphysicalTags2 != null) {
        res.material.metaphysicalTags2 = req.body.metaphysicalTags2;
    }
    if (req.body.metaphysicalTags3 != null) {
        res.material.metaphysicalTags3 = req.body.metaphysicalTags3;
    }
    if (req.body.metaphysicalTags4 != null) {
        res.material.metaphysicalTags4 = req.body.metaphysicalTags4;
    }
    if (req.body.metaphysicalAndSpiritualDesc != null) {
        res.material.metaphysicalAndSpiritualDesc = req.body.metaphysicalAndSpiritualDesc;
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
    if (req.body.crystalCategory != null) {
        res.material.crystalCategory = req.body.crystalCategory;
    }
    if (req.body.crystalName != null) {
        res.material.crystalName = req.body.crystalName;
    }
    if (req.body.color1 != null) {
        res.material.color1 = req.body.color1;
    }
    if (req.body.color2 != null) {
        res.material.color2 = req.body.color2;
    }
    if (req.body.color3 != null) {
        res.material.color3 = req.body.color3;
    }
    if (req.body.rarity != null) {
        res.material.rarity = req.body.rarity;
    }
    if (req.body.psychologicalCorr1 != null) {
        res.material.psychologicalCorr1 = req.body.psychologicalCorr1;
    }
    if (req.body.psychologicalCorr2 != null) {
        res.material.psychologicalCorr2 = req.body.psychologicalCorr2;
    }
    if (req.body.psychologicalCorr3 != null) {
        res.material.psychologicalCorr3 = req.body.psychologicalCorr3;
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