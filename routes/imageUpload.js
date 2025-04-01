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

router.post('/upload', authAdmin, upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        res.status(400).json(makeError(['No file provided']));
        return;
    }

    const file = req.file;
    const folder = req.body.folder || 'general';
    const filename = `images/${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${file.originalname.split('.').pop()}`;
    console.log(folder)
    try {
        const params = {
            Bucket: "jmillercustomcues",
            Key: filename, // This includes the folder path
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

router.post('/delete', authAdmin, async (req, res) => {
    try {
        const { urls } = req.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json(makeError(['No URLs provided']));
        }

        const objects = urls.map(url => {
            const urlObj = new URL(url);
            const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            return { Key: key };
        });

        const deleteParams = {
            Bucket: "jmillercustomcues",
            Delete: {
                Objects: objects,
                Quiet: false
            }
        };

        const deleteResult = await s3.deleteObjects(deleteParams).promise();
        
        if (deleteResult.Errors && deleteResult.Errors.length > 0) {
            console.error('Errors deleting objects:', deleteResult.Errors);
            return res.status(207).json(makeResponse(
                'partial', 
                { 
                    deleted: deleteResult.Deleted?.map(d => d.Key) || [], 
                    failed: deleteResult.Errors.map(e => e.Key)
                },
                ['Some files could not be deleted']
            ));
        }

        return res.status(200).json(makeResponse(
            'success', 
            deleteResult.Deleted?.map(d => d.Key) || [],
            ['Files deleted successfully']
        ));
    } catch (err) {
        console.error('Error deleting files:', err);
        res.status(500).json(makeError(['Error deleting files from storage']));
    }
});

module.exports = router