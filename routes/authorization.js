const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const user = require('../models/user');
const router = express.Router();
const { sendEmail } = require('../sendMail');
const { makeError, makeResponse } = require('../response/makeResponse');



// New User Registration
router.post('/register', async (req, res) => 
{
    const { email, password } = req.body;

    try{
        //Check if the entered email is in fact an email address.
        if(!validator.isEmail(email))
        {
            return res.status(400).json(makeError(['Please enter a valid email.']));
        }

        // Check if a user with that email exists in the database.
        const userExists = await user.findOne({ email: email });

        if(userExists)
        {
            //If user is found, return 400
            return res.status(400).json(makeError(['User with that email already exists.']));
        }

        //User does not exist! We can register.
        //Int is the salt length to generate, longer value is more secure.
        const passHash = await bcrypt.hash(password, 10);

        const newUser = new user( { email, password: passHash } );

        await newUser.save();

        const accountEmailNotification = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to J Miller Custom Cues</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 5px; text-align: center;">
                <h2 style="color: #333;">Welcome to J Miller Custom Cues!</h2>
                <p style="color: #666;">Thank you for creating an account with us. Your passion for precision-crafted cues starts here.</p>
                <p><strong>Account Details:</strong></p>
                <p>Email: ${email}</p>
                <p>Click the button below to access your account:</p>
                <a href="https://google.com" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to My Account</a>
                <p style="color: #666; margin-top: 20px;">If you did not create this account, please contact our support team.</p>
            </div>
        </body>
        </html>
        `

        sendEmail(email, "Account Created", accountEmailNotification);
        res.status(201).json(makeResponse('success', false, ['You have registered successfully!'], false));
    }catch (ex){
        res.status(500).json(makeError(['Error: ' + ex.error]));
    }
});

//User login 
router.post('/login', async (req, res) => 
{
    const {email, password} = req.body;

    try{
        //Find user in the database by email.
        const user = await user.findOne({ email });
        if(!user)
        {
            //User not found. Invalid email.
            return res.status(400).json(makeError(['Please enter a valid email.']));
        }

        //User found, compare password hashes.
        const validPassword = await bcrtypt.compare(password, user.password);
        if(!validPassword)
        {
            //Invalid password.
            return res.status(400).json(makeError(['Invalid Username / Password.']));
        }

        //Successful authorization. Create token.
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },{
                expiresIn: '4h' // Duration for the token.
            });
        
            res.status(201).json(makeResponse('success', token, ['Login Successful'], false));

    }catch(ex){
        res.status(500).json(makeError(['Error: ' + ex.error]));
    }
});

module.exports = router;