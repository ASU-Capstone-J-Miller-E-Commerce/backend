const express = require('express')
const { spawn } = require('child_process');
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization');
const { getAllowedOrigins } = require('../../utils/environment');

router.use(function (req, res, next) {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});


//Route to init the database, admin only.
router.get('/initDatabase', authAdmin, async (req, res) =>
{
    const python = spawn('python3', ['scripts/parser.py']);

    let output = '';

    python.stdout.on('data', (data) => 
    {
        output += data.toString();
    });

    python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
        res.send({ result: output.trim() });
    });

});


module.exports = router;