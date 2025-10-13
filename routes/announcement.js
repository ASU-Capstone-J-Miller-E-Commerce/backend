const express = require('express')
const Announcement = require('../models/announcement')
const { makeError, makeResponse } = require('../response/makeResponse');
const router = express.Router()

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all active announcements (public route)
router.get('/', async (req, res, next) => {
    try {
        const announcements = await Announcement.find({ active: true }, { _id: 0 })
        res.status(200).json(makeResponse('success', announcements, ['fetched all active announcements'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

module.exports = router