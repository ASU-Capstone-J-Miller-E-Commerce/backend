const express = require('express')
const Cue = require('../models/cue')
const Accessory = require('../models/accessory')
const Wood = require('../models/wood')
const Crystal = require('../models/crystal')
const { makeError, makeResponse } = require('../response/makeResponse');
const router = express.Router()

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

router.get('/', async (req, res, next) => {
    try {
        const query = req.query.query
        const fullSearch = req.query.full === 'true'
        let limit = 12
        
        // return empty results if query is empty
        if (!query || query.trim() === '') {
            return res.status(200).json(makeResponse('success', {
                items: [],
                hasMoreResults: false
            }, ['empty query provided'], false))
        }
        
        const searchRegex = new RegExp(query, 'i');
        
        let cues = [], accessories = [], woods = [], crystals = [];
        
        if (fullSearch) {
            // Fetch all results when fullSearch is true
            cues = await Cue.find({ 
                $or: [
                    { name: searchRegex },
                    { cueNumber: searchRegex }
                ],
                status: { $in: ['Available', 'Coming Soon', 'Sold'] }
            }).select('guid cueNumber name price imageUrls');
            
            accessories = await Accessory.find({
                $or: [
                    { name: searchRegex },
                    { accessoryNumber: searchRegex }
                ],
                status: 'Available'
            }).select('guid accessoryNumber name price imageUrls');
            
            woods = await Wood.find({
                $or: [
                    { commonName: searchRegex },
                    { alternateName1: searchRegex },
                    { alternateName2: searchRegex },
                    { scientificName: searchRegex }
                ],
                status: 'Available' 
            }).select('guid commonName imageUrls');
            
            crystals = await Crystal.find({
                $or: [
                    { crystalName: searchRegex },
                    { crystalCategory: searchRegex }
                ],
                status: 'Available' 
            }).select('guid crystalName imageUrls');
        } else {
            // Progressive fetching respecting the limit
            cues = await Cue.find({ 
                $or: [
                    { name: searchRegex },
                    { cueNumber: searchRegex }
                ],
                status: { $in: ['Available', 'Coming Soon', 'Sold'] }
            }).limit(limit).select('guid cueNumber name price imageUrls');
            
            limit = limit - cues.length;
            if (limit > 0) {
                accessories = await Accessory.find({
                    $or: [
                        { name: searchRegex },
                        { accessoryNumber: searchRegex }
                    ],
                    status: 'Available'
                }).limit(limit).select('guid accessoryNumber name price imageUrls');
                
                limit = limit - accessories.length;
                if (limit > 0) {
                    woods = await Wood.find({
                        $or: [
                            { commonName: searchRegex },
                            { alternateName1: searchRegex },
                            { alternateName2: searchRegex },
                            { scientificName: searchRegex }
                        ],
                        status: 'Available' 
                    }).limit(limit).select('guid commonName imageUrls');
                    
                    limit = limit - woods.length;
                    if (limit > 0) {
                        crystals = await Crystal.find({
                            $or: [
                                { crystalName: searchRegex },
                                { crystalCategory: searchRegex }
                            ],
                            status: 'Available' 
                        }).limit(limit).select('guid crystalName imageUrls');
                    }
                }
            }
        }
        
        const getDisplayName = (obj) => {
            if (obj.name) return obj.name;
            if (obj.commonName) return obj.commonName;
            if (obj.crystalName) return obj.crystalName;
            return '';
        };

        const allResults = [...cues, ...accessories, ...woods, ...crystals]
            .sort((a, b) => {
                const nameA = getDisplayName(a).toLowerCase();
                const nameB = getDisplayName(b).toLowerCase();
                return nameA.localeCompare(nameB);
            });
        
        res.status(200).json(makeResponse('success', allResults, ['fetched search records from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

module.exports = router;