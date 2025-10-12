const express = require('express')
const Cue = require('../models/cue')
const Wood = require('../models/wood')
const Crystal = require('../models/crystal')
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
        }).select('guid cueNumber name price status imageUrls featured isFullSplice includeWrap createdOn forearmInlayQuantity forearmPointQuantity handleInlayQuantity buttsleeveInlayQuantity buttSleevePointQuantity -_id')
        res.status(200).json(makeData(cues))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

// Get featured cues (public route) - MUST be before /:guid route
router.get('/featured', async (req, res, next) => {
    try {
        const featuredCues = await Cue.find({ featured: true, status: 'Available' })
            .select('guid cueNumber name price status imageUrls featured -_id')
            .limit(4)
            .sort({ updatedOn: 1 });
        
        res.status(200).json(makeData(featuredCues));
    } catch (err) {
        res.status(500).json(makeError(["Internal server error, please try again later or contact support"]));
    }
});

//get one by guid with dereferenced materials
router.get('/:guid', getCueByGuid, async (req, res, next) => {
    try {
        const cueWithMaterials = await dereferenceMaterials(res.cue);
        res.status(200).json(makeData(cueWithMaterials));
    } catch (err) {
        res.status(500).json(makeError([err.message]));
    }
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

async function dereferenceMaterials(cue) {
    const cueObj = cue.toObject();
    
    // List of material fields that might contain GUIDs
    const materialFields = [
        'forearmInlayMaterial',
        'forearmPointInlayMaterial', 
        'handleInlayMaterial',
        'buttSleeveInlayMaterial',
        'buttSleevePointInlayMaterial',
        'shaftMaterial',
        'ferruleMaterial',
        'jointPinMaterial',
        'jointCollarMaterial',
        'buttCapMaterial',
        'forearmMaterial',
        'handleMaterial',
        'buttSleeveMaterial'
    ];
    
    // Process each material field
    for (const field of materialFields) {
        const materialValue = cueObj[field];
        
        if (materialValue && typeof materialValue === 'string') {
            try {
                // Try to find as wood first
                let material = await Wood.findOne({ guid: materialValue })
                    .select('guid commonName')
                    .lean();
                
                if (material) {
                    cueObj[field] = material;
                    continue;
                }
                
                // If not found as wood, try crystal
                material = await Crystal.findOne({ guid: materialValue })
                    .select('guid crystalName')
                    .lean();
                
                if (material) {
                    cueObj[field] = material;
                }
                
            } catch (err) {
                console.error(`Error dereferencing material ${materialValue} for field ${field}:`, err);
            }
        }
    }
    
    return cueObj;
}

module.exports = router