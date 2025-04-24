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
        const searchType = req.query.searchType
        var limit = req.query.limit
        console.log(query)
        const searchRegex = new RegExp(query, 'i');

        var cues = [], accessories = [], woods = [], crystals = []
        
        if(searchType)
        {
            cues = await Cue.find({ 
                $or: [
                    { name: searchRegex },
                    { cueNumber: searchRegex }
                  ]
             })
            accessories = await Accessory.find({
                $or: [
                    { name: searchRegex },
                    { accessoryNumber: searchRegex }
                  ]
            });
            woods = await Wood.find({
                $or: [
                    { commonName: searchRegex },
                    { alternateName1: searchRegex },
                    { alternateName2: searchRegex },
                    { scientificName: searchRegex }
                  ]
            });
            crystals = await Crystal.find({
                $or: [
                    { crystalName: searchRegex },
                    { crystalCategory: searchRegex }
                  ]
            });
        }
        else
        {
            cues = await Cue.find({ 
                $or: [
                    { name: searchRegex },
                    { cueNumber: searchRegex }
                  ]
             }).limit(limit);
             limit = limit - cues.length;
             if(limit != 0) 
             {
                accessories = await Accessory.find({
                    $or: [
                        { name: searchRegex },
                        { accessoryNumber: searchRegex }
                      ]
                }).limit(limit);
                limit = limit - accessories.length;
                if(limit != 0)
                {
                    woods = await Wood.find({
                        $or: [
                            { commonName: searchRegex },
                            { alternateName1: searchRegex },
                            { alternateName2: searchRegex },
                            { scientificName: searchRegex }
                          ]
                    }).limit(limit);
                    limit = limit - woods.length;
                    if(limit != 0)
                    {
                        crystals = await Crystal.find({
                            $or: [
                                { crystalName: searchRegex },
                                { crystalCategory: searchRegex }
                              ]
                        }).limit(limit);
                    }
                    
                }
                
             }
            
        }
        
        res.status(200).json(makeResponse('success', [...cues, ...accessories, ...woods, ...crystals], ['fetched all search records from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

module.exports = router;