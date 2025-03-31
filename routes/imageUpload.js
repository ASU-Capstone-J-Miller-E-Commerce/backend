const AWS = require("aws-sdk");
const express = require('express')
const Cue = require('../models/cue')
const { makeError, makeResponse } = require('../response/makeResponse');
const router = express.Router()
const { authAdmin } = require('./authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com");  // Change region if needed
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DIGITAL_OCEAN_ADMIN_ID,
    secretAccessKey: process.env.DIGITAL_OCEAN_ADMIN_KEY
});

router.get('/', authAdmin, async (req, res, next) => {
    const { filename, filetype } = req.query;

    if(!filename || !filetype)
    {
        res.status(400).json(makeError(['File name or File type not valid']))
        return;
    }

    try {
        const params = {
            Bucket: "jmillercustomcues",
            Key: filename,
            ContentType: filetype,
            ACL: "private",
            Expires: 60 // URL expires in 60 seconds
        };

        res.status(200).json(makeResponse('success', await s3.getSignedUrlPromise("putObject", params), ['Made temporary URL for uploading file'], false));
    }
    catch (err) {
        res.status(500).json(makeError(['Error getting upload URL']));
        console.log(err);
    }
})

module.exports = router