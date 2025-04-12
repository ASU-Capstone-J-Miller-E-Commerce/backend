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


router.put('/userChangePassword', async (req, res) =>
    {
        try
        {
            const {currPw, newPw} = req.body;
            const token = req.cookies.jwt;
            const decoded = jwt.verify(token, jwtSecret);
            const editedUser = await user.findOne({ email: decoded.userId });
            
            if(!editedUser)
            {
                return res.status(404).json(makeError(['User not found.']));
            }
            

            const validPassword = await bcrypt.compare(currPw, editedUser.password);
            if(!validPassword)
            {
                //Invalid password.
                return res.status(400).json(makeError(['Invalid Password.']));
            }
            if(newPw && newPw != '')
            {
                if( newPw.length < 8)
                {
                    return res.status(400).json(makeError(['Passwords must be at least 8 characters long.']));
                }
                
            }
            const passHash = await bcrypt.hash(newPw, 10);
            editedUser.password = passHash;
            await editedUser.save();
    
            return res.status(200).json(makeResponse('success', false, ['New Password Saved Successfully.'], false));
    
        }catch(ex)
        {
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }
    });
    
module.exports = router;