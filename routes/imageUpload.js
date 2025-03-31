const AWS = require("aws-sdk");
const express = require('express')
const Cue = require('../models/cue')
const { makeError, makeResponse } = require('../response/makeResponse');
const router = express.Router()
const { authAdmin } = require('./authorization')
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

router.post('/upload', authAdmin, upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        res.status(400).json(makeError(['No file provided']));
        return;
    }
    
    const file = req.file;
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${file.originalname.split('.').pop()}`;
    
    try {
        // Upload directly from your server to DO Spaces
        const params = {
            Bucket: "jmillercustomcues",
            Key: filename,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read"
        };
        
        await s3.upload(params).promise();
        
        const fileUrl = `https://jmillercustomcues.nyc3.digitaloceanspaces.com/${filename}`;
        res.status(200).json(makeResponse('success', fileUrl, ['File uploaded successfully']));
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json(makeError(['Error uploading file to storage']));
    }
});

module.exports = router