const express = require('express')
const Announcement = require('../../models/announcement')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization');
const { getOriginUrl } = require('../../utils/environment');

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", getOriginUrl()) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const announcements = await Announcement.find()
        res.status(200).json(makeResponse('success', announcements, ['fetched all announcements from database'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

//get one
router.get('/:id', authAdmin, getAnnouncement, (req, res, next) => {
    res.send(makeResponse('success', res.announcement, ['fetched 1 announcement from database with id: ' + req.params.id], false))
})

router.post('/', authAdmin, async (req, res, next) => {
    const { startAt, endAt } = req.body;
    if (startAt && !endAt) {
        return res.status(400).json(makeError(['If start date is set, end date must also be set.']));
    }
    const announcement = new Announcement(req.body);

    try {
        const newAnnouncement = await announcement.save()
        res.status(201).json(makeResponse('success', newAnnouncement, ['New announcement successfully created.'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', authAdmin, getAnnouncement, async (req, res, next) => {
    const { startAt, endAt } = req.body;
    if (startAt && !endAt) {
        return res.status(400).json(makeError(['If start date is set, end date must also be set.']));
    }
    try {
        for (const key in req.body) {
            if (req.body[key] != null) {
                res.announcement[key] = req.body[key];
            }
        }
        res.announcement.updatedOn = Date.now();

        const updatedAnnouncement = await res.announcement.save()
        res.json(makeResponse('success', updatedAnnouncement, ['Announcement edited and saved successfully.'], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', authAdmin, getAnnouncement, async (req, res, next) => {
    try {
        await res.announcement.deleteOne()
        res.status(201).json(makeResponse('success', false, ['Announcement Deleted Successfully.'], false))
    } catch (err) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }
})

async function getAnnouncement(req, res, next) {
    let announcement
    try {
        announcement = await Announcement.findById(req.params.id)
        if(announcement === null){
            return res.status(404).json(makeError(['Cannot find announcement']))
        }
    } catch (err) {
        return res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
    }

    res.announcement = announcement
    next()
}

module.exports = router