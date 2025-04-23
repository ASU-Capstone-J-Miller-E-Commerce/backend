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
        
        // return empty results if query is empty
        if (!query || query.trim() === '') {
            return res.status(200).json(makeResponse('success', {
                items: [],
                hasMoreResults: false
            }, ['empty query provided'], false))
        }
        
        const searchRegex = new RegExp(query, 'i');
        
        const cues = await Cue.find({ 
            $or: [
                { name: searchRegex },
                { cueNumber: searchRegex }
              ]
         });
        const accessories = await Accessory.find({
            $or: [
                { name: searchRegex },
                { accessoryNumber: searchRegex }
              ]
        });
        const woods = await Wood.find({
            $or: [
                { commonName: searchRegex },
                { alternateName1: searchRegex },
                { alternateName2: searchRegex },
                { scientificName: searchRegex }
              ]
        });
        const crystals = await Crystal.find({
            $or: [
                { crystalName: searchRegex },
                { crystalCategory: searchRegex }
              ]
        });

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
        
        // limit results to the first 12 items
        const result = allResults.slice(0, 12);

        res.status(200).json(makeResponse('success', result, ['fetched search records from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

module.exports = router;