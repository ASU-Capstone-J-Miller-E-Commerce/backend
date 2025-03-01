const express = require('express')
const bcrypt = require('bcryptjs')
const analytic = require('../models/analytic')
const Product = require('../models/product')
const User = require('../models/user')
const { authUser , authAdmin } = require('./authorization')
const { makeResponse, makeError } = require('../response/makeResponse')
const router = express.Router()


router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//Get ALL Users
//router.get('/users', authUser, authAdmin, async (req, res) =>
router.get('/users', async (req, res) =>
{
    try{
        const users = await User.find();
        res.status(200).json(makeResponse('success', [users], ['Fetched all users from database.'], false));
    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Get ONE User
//router.get('/users/:email', authUser, authAdmin, async (req, res) =>
router.get('/users/:email', async (req, res) =>
    {
        try{
            const {userEmail} = req.params;
            const users = await User.findOne({email: userEmail});
            res.status(200).json(makeResponse('success', [users], ['Fetched user from database.'], false));
        }catch(ex)
        {
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }
    });

//Create a new User
//router.post('/users', authUser, authAdmin, async (req, res) =>
router.post('/users', async (req, res) =>
{
    try{
        const { email, password, firstName, lastName } = req.body;
        const passHash = await bcrypt.hash(password, 10);
        const newUser = new User({email: email, password: passHash, firstName: firstName, lastName: lastName, role: 'User'});
        await newUser.save();
        res.status(201).json(makeResponse('success', newUser, ['New user successfully created.'], false));
    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Edit / save User
//router.put('/users/:email', authUser, authAdmin, async (req, res) =>
router.put('/users/:email', async (req, res) =>
{
    try
    {
        const {userEmail} = req.params;
        const {newEmail, newPassword, newFirstName, newLastName, newRole} = req.body;
        const editedUser = await User.findOne({email: userEmail});

        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }

        if(newEmail)
        {
            editedUser.email = newEmail;
        }
        if(newPassword)
        {
            const passHash = await bcrypt.hash(password, 10);
            editedUser.password = passHash;
        }
        if(newFirstName)
        {
            editedUser.firstName = newFirstName;
        }
        if(newLastName)
        {
            editedUser.lastName = newLastName;
        }
        if(newRole)
        {
            editedUser.role = newRole;
        }

        await editedUser.save();

        return res.status(200).json(makeResponse('success', editedUser, ['User edited and saved successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Delete User
//router.delete('/users/:email', authUser, authAdmin, async (req, res) =>
router.delete('/users/:email', async (req, res) =>
{
    try
    {
        const {userEmail} = req.params;
        const deletedUser = await User.findOneAndDelete({ email: userEmail });
        if(!deletedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        return res.status(200).json(makeResponse('success', false, ['User Deleted Successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});
    
module.exports = router