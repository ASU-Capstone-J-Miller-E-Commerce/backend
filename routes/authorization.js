const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const user = require('../models/user')
const router = express.Router()
const { sendEmail } = require('../sendMail')
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
const speakeasy = require("speakeasy")
const qrcode = require("qrcode")
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET_KEY
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 5, //5 tries every 15 minutes
    message: { error: "Too many login attempts, try again later" }
});

// New User Registration
router.post('/register', async (req, res) => 
{
    try{
        //This will change when front end is complete for sending requests to backend.
        //Testing works with JSON format.
        const { email, password, fName, lName } = req.body;

        //Check if the entered email is in fact an email address.
        if(!validator.isEmail(email) || email.length > 320)
        {
            return res.status(400).json(makeError(['Please enter a valid email.']));
        }
        //Password length checks
        if(password.length < 8)
        {
            return res.status(400).json(makeError(['Password cannot be fewer than 8 characters long.']));
        }
        if( password.length > 64)
        {
            return res.status(400).json(makeError(['Password cannot be more than 64 characters long.']));
        }
        if( fName.length > 30)
        {
            return res.status(400).json(makeError(['Your first name cannot be more than 30 characters long.']));
        }
        if( lName.length > 30)
        {
            return res.status(400).json(makeError(['Your last name cannot be more than 30 characters long.']));
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

        const newUser = new user( { email: email, password: passHash, firstName: fName, lastName: lName, role: "User"});
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

        //sendEmail(email, "Account Created", accountEmailNotification);
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
        const login = await user.findOne({ email });
        if(!login)
        {
            //User not found. Invalid email.
            return res.status(400).json(makeError(['Invalid Email or Password.']));
        }

        //User found, compare password hashes.
        const validPassword = await bcrypt.compare(password, login.password);
        if(!validPassword)
        {
            //Invalid password.
            return res.status(400).json(makeError(['Invalid Email or Password.']));
        }

        //Successful authorization. Create token.
        const token_payload = {
            userId: login.email,
            role: login.role,
        };

        const token = jwt.sign(token_payload, jwtSecret, { expiresIn: '1d'}); //EXP in one day.
        res.cookie("jwt", token, 
            {
                httpOnly: true, //set to true in prod, false for browser testing.
                secure: false, //set to true when in prod
                sameSite: "Lax", //Set to "strict" for prod, Lax or None for testing and dev ONLY.
                maxAge: 86400 * 1000, // EXP in one day.
            }
        );
        return res.status(201).json(makeResponse('success', token, ['Login Successful.'], false));
    }catch(ex){
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

router.post('/logout', (req, res) => {
    try {
        // clear the jwt cookie
        res.clearCookie('jwt', {
            httpOnly: true, //set to true in prod, false for browser testing.
            secure: false, //set to true when in prod
            sameSite: 'Lax', //Set to "strict" for prod, Lax or None for testing and dev ONLY.
        });

        return res.status(200).json(makeResponse('success', false, ['Logout successful'], false));
    } catch (ex) {
        console.error(ex);
        res.status(500).json(makeError(['Something went wrong']));
    }
});

router.get('/check-auth', async (req, res) => {
    try {
        const token = req.cookies.jwt;

        // if no token exists, return false
        if (!token) {
            return res.status(200).json(makeData(false));
        }

        // verify the token is valid
        try {
            const decoded = jwt.verify(token, jwtSecret);

            // get user data from database
            const userData = await user.findOne({ email: decoded.userId }, { password: 0 });

            if (!userData) {
                return res.status(200).json(makeData({ authenticated: false }));
            }

            // return both authentication status and user data
            return res.status(200).json(makeData({
                authenticated: true,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role
            }));
        } catch (tokenError) {
            // token exists but is invalid (expired or tampered)
            return res.status(200).json(makeData({authenticated: false}));
        }
    } catch (ex) {
        console.error(ex);
        res.status(500).json(makeError(['Something went wrong.']));
    }
});

//Authenticate User
const authUser = (req, res, next) => 
{
    //Update when logic for passing to backend is complete.
    const token = req.cookies.jwt;

    if(!token)
    {
        return res.status(401).json(makeError(['Insufficient Permissions.']));
    }

    try
    {
        const validated = jwt.verify(token, jwtSecret);
        
        req.userId = validated.userId;
        req.userRole = validated.userRole;
        next();
    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
};

//Admin auth 
const authAdmin = (req, res, next) => 
{
    const token = req.cookies.jwt;

    if(!token)
    {
        return res.status(401).json(makeError(['Access Denied. Invalid Token.']));
    }

    try
    {
        const validated = jwt.verify(token, jwtSecret);
    
        res.userId = validated.userId;
        res.userRole = validated.role;
        //return res.status(200).json(makeData([validated.role]))
        if(validated.role != 'Admin')
        {
            return res.status(401).json(makeError(['Insufficient Permissions.']));
        }
        next();
    }
    catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
};

//2FA QRCode generation
router.put('/generate2FASecret', async (req, res) => {
    try{
        const secret = speakeasy.generateSecret({length: 20});
        const qrcodeUrl = await qrcode.toDataURL(secret.otpauth_url)
        const token = req.cookies.jwt;
        const decoded = jwt.verify(token, jwtSecret);
        const userData = await user.findOne({ email: decoded.userId }, { password: 0 });

        userData.TFASecret = secret;
        
        await userData.save();
        //Return data for the frontend.
        //QR code is an image.
        return res.json(makeData({secret, qrcodeUrl}));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});


module.exports = router;
module.exports.authUser = authUser;
module.exports.authAdmin = authAdmin;