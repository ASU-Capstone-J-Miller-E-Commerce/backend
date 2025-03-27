const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const user = require('../models/user')
const router = express.Router()
const { sendEmail } = require('../sendMail')
const { makeError, makeResponse } = require('../response/makeResponse')
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET_KEY


router.put('/update-name/:email', async (req, res) =>
{
    try
    {
        const {email} = req.params;
        const {newFirstName, newLastName} = req.body;
        const editedUser = await user.findOne({email: email});

        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        if(newFirstName && newFirstName != '')
        {
            if( newFirstName.length > 30)
            {
                return res.status(400).json(makeError(['Your first name cannot be more than 30 characters long.']));
            }
            editedUser.firstName = newFirstName;
        }
        if(newLastName && newLastName != '' && newLastName.length < 30)
        {
            if( newLastName.length > 30)
            {
                return res.status(400).json(makeError(['Your last name cannot be more than 30 characters long.']));
            }
            editedUser.lastName = newLastName;
        }
        
        
        await editedUser.save();

        return res.status(200).json(makeResponse('success', false, ['Name saved successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

module.exports = router;