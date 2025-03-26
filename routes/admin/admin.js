const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../../models/user')
const { authUser , authAdmin } = require('../authorization')
const { makeResponse, makeError } = require('../../response/makeResponse')
const router = express.Router()
const auth = require('../../routes/authorization');


router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//Get ALL Users
//router.get('/users', authUser, authAdmin, async (req, res) =>
router.get('/users', authAdmin, async (req, res) =>
{
    try{
        const users = await User.find({}, {password: 0});
        res.status(200).json(makeResponse('success', users, ['Fetched all users from database.'], false));
    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Get ONE User
//router.get('/users/:email', authUser, authAdmin, async (req, res) =>
router.get('/users/:id', authAdmin, async (req, res) =>
    {
        try{
            const {id} = req.params;
            const users = await User.findOne({_id: id}, {password: 0});
            res.status(200).json(makeResponse('success', [users], ['Fetched user from database.'], false));
        }catch(ex)
        {
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }
    });

//Create a new User
//router.post('/users', authUser, authAdmin, async (req, res) =>
router.post('/users', authAdmin, async (req, res) =>
{
    try{
        const { email, password, firstName, lastName } = req.body;
        //Password length checks
        if(!password)
        {
            return res.status(400).json(makeError(['Please provide a new password.']));
        }
        if(password.length < 8)
        {
            return res.status(400).json(makeError(['Password cannot be fewer than 8 characters long.']));
        }
        if( password.length > 64)
        {
            return res.status(400).json(makeError(['Password cannot be more than 64 characters long.']));
        }
        const passHash = await bcrypt.hash(password, 10);
        const newUser = new User({email: email, password: passHash, firstName: firstName, lastName: lastName, role: 'User'});
        await newUser.save();
        res.status(201).json(makeResponse('success', false, ['New user successfully created.'], false));
    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});


//Edit / save User
//router.put('/users/:email', authUser, authAdmin, async (req, res) =>
router.put('/users/:id', authAdmin, async (req, res) =>
{
    try
    {
        const {id} = req.params;
        const {newEmail, newFirstName, newLastName} = req.body;
        const editedUser = await User.findOne({_id: id});

        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        if(newEmail)
        {
            editedUser.email = newEmail;
        }
        if(newFirstName)
        {
            editedUser.firstName = newFirstName;
        }
        if(newLastName)
        {
            editedUser.lastName = newLastName;
        }

        await editedUser.save();

        return res.status(200).json(makeResponse('success', false, ['User edited and saved successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Change password
//router.put('/users/resetPassword/:email', authUser, authAdmin, async (req, res) =>
router.put('/users/resetPassword/:id', authAdmin, async (req, res) =>
{
    try
    {
        const {id} = req.params;
        const {newPassword} = req.body;
        const editedUser = await User.findOne({_id: id});

        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        //Password length checks
        if(!newPassword)
        {
            return res.status(400).json(makeError(['Please provide a new password.']));
        }
        if(newPassword.length < 8)
        {
            return res.status(400).json(makeError(['Password cannot be fewer than 8 characters long.']));
        }
        if( newPassword.length > 64)
        {
            return res.status(400).json(makeError(['Password cannot be more than 64 characters long.']));
        }

        const passHash = await bcrypt.hash(newPassword, 10);
        editedUser.password = passHash;

        await editedUser.save();

        return res.status(200).json(makeResponse('success', false, ['User edited and saved successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Delete User
//router.delete('/users/:email', authUser, authAdmin, async (req, res) =>
router.delete('/users/:id', authAdmin, async (req, res) =>
{
    try
    {
        const {id} = req.params;
        const deletedUser = await User.findOneAndDelete({ _id: id });
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