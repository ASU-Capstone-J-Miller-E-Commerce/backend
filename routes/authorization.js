const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const user = require('../models/user')
const router = express.Router()
const { sendEmail } = require('../sendMail')
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET_KEY



// New User Registration
router.post('/register', async (req, res) => 
{
    try{
        //This will change when front end is complete for sending requests to backend.
        //Testing works with JSON format.
        const { email, password } = req.body.data;

        //Check if the entered email is in fact an email address.
        if(!validator.isEmail(email) || email.length > 320)
        {
            return res.status(400).json(makeError(['Please enter a valid email.']));
        }
        //Password length checks
        if(password.length < 8)
        {
            return res.status(400).json({message: 'Password cannot be fewer than 8 characters long.'});
        }
        if( password.length > 64)
        {
            return res.status(400).json({message: 'Password cannot be more than 64 characters long.'});
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

        const newUser = new user( { email: email, password: passHash, role: "User"});
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
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
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
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword)
        {
            //Invalid password.
            return res.status(400).json(makeError(['Invalid Username / Password.']));
        }

        //Successful authorization. Create token.
        const token_payload = {
            userId: user.email,
            role: user.role,
        };

        const token = jwt.sign(token_payload, jwtSecret, { expiresIn: '4h'});
        return res.status(201).json(makeResponse('success', token, ['Login Successful'], false));
    }catch(ex){
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//Authenticate User
const authUser = (req, res, next) => 
{
    //Update when logic for passing to backend is complete.
    const token = req.header('Authorization');

    if(!token)
    {
        return res.status(401).json(makeError(['Access Denied. Invalid Token.']));
    }

    try
    {
        const userToken = token.split(' ')[1];
        const validated = jwt.verify(userToken, jwtSecret);
        req.user = validated;
        next();
    }catch(ex)
    {
        res.status(401).json(makeError(['Invalid Token.']));
    }
};

//Admin auth 
const authAdmin = (req, res, next) => 
{
    if(!req.user || req.user.role !== 'Admin')
    {
        return res.status(401).json(makeError(['Access Denied. Admin Only Resource.']));
    }
    next();
};

module.exports = router;
module.exports.authUser = authUser;
module.exports.authAdmin = authAdmin;