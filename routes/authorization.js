const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const validator = require('validator')
const user = require('../models/user')
const Cue = require('../models/cue')
const Accessory = require('../models/accessory')
const router = express.Router()
const { sendAccountCreationEmail } = require('./email')
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy")
const qrcode = require("qrcode")
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET_KEY
const ENC_KEY = process.env.ENC_KEY
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
    const { email, password, fName, lName, emailNotos } = req.body;

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
        if(fName.length > 30)
        {
            return res.status(400).json(makeError(['Your first name cannot be more than 30 characters long.']));
        }
        if(lName.length > 30)
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

        const newUser = new user( { email: email, password: passHash, firstName: fName, lastName: lName, role: "User", emailNotos: !!emailNotos });
        await newUser.save();

        // Send account creation email
        try {
            await sendAccountCreationEmail({ email, firstName: fName });
        } catch (emailError) {
            console.error('Failed to send account creation email:', emailError);
            // Don't fail registration if email fails
        }

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

        if(login.TFAEnabled)
        {
            //2FA enabled. Require 2FA for token signing.
            //Encrypt token data so frontend cannot see / inject data.
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
            let encRole = cipher.update(login.role, 'utf8', 'hex');
            encRole += cipher.final('hex');

            //enEmail = await bcrypt.hash(login.email, 10);
            //enRole = await bcrypt.hash(login.role, 10);
            const token_payload = {
                userId: login.email,
                role: encRole,
                isAdmin: (login.role === 'Admin' && login.TFAEnabled) ? true : false,
            }; 
            const TFAEnabled = true;
            return res.status(200).json(makeData([TFAEnabled, token_payload, iv.toString('hex')]));
        }
        else
        {
            //2FA disabled. Regular Login.
            //Successful authorization. Create token.
            const token_payload = {
                userId: login.email,
                role: login.role,
                isAdmin: (login.role === 'Admin' && login.TFAEnabled) ? true : false,
            };

            const token = jwt.sign(token_payload, jwtSecret, { expiresIn: '1d'}); //EXP in one day.
            res.cookie("jwt", token, 
                {
                    httpOnly: true, //set to true in prod, false for browser testing.
                    secure: false, //set to true when in prod
                    sameSite: "Strict", //Set to "strict" for prod, Lax or None for testing and dev ONLY.
                    maxAge: 86400 * 1000, // EXP in one day.
                }
            );
            return res.status(201).json(makeResponse('success', token, ['Login Successful.'], false));
        }
        
        
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
            sameSite: "Strict" //Set to "strict" for prod, Lax or None for testing and dev ONLY.
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

            // Populate cart items with actual product details
            const cartWithDetails = await Promise.all(
                userData.cart.map(async (cartItem) => {
                    let itemDetails = null;
                    
                    if (cartItem.itemType === 'cue') {
                        itemDetails = await Cue.findOne({ guid: cartItem.itemGuid })
                            .select('guid cueNumber name price status imageUrls description -_id');
                    } else if (cartItem.itemType === 'accessory') {
                        itemDetails = await Accessory.findOne({ guid: cartItem.itemGuid })
                            .select('guid accessoryNumber name price status imageUrls description -_id');
                    }

                    return {
                        itemGuid: cartItem.itemGuid,
                        itemType: cartItem.itemType,
                        quantity: cartItem.quantity,
                        addedAt: cartItem.addedAt,
                        itemDetails: itemDetails
                    };
                })
            );

            // Filter out items that no longer exist
            const validCartItems = cartWithDetails.filter(item => item.itemDetails);

            // If some items were removed, update the user's cart
            if (validCartItems.length !== userData.cart.length) {
                userData.cart = userData.cart.filter(cartItem => 
                    validCartItems.some(validItem => validItem.itemGuid === cartItem.itemGuid)
                );
                await userData.save();
            }

            // return both authentication status, user data, and cart
            return res.status(200).json(makeData({
                authenticated: true,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                TFAEnabled: userData.TFAEnabled,
                emailNotos: userData.emailNotos,
                isAdmin: (userData.role === 'Admin' && userData.TFAEnabled) ? true : false,
                cart: {
                    items: validCartItems,
                    totalItems: validCartItems.reduce((sum, item) => sum + item.quantity, 0)
                }
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
    
        if(!validated.isAdmin)
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
router.put('/generate2FA', async (req, res) => {
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
        return res.json(makeData({qrcodeUrl}));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//2FA QRCode Verification
router.put('/verify2FA', async (req, res) => {
    try{
        const token = req.cookies.jwt;
        const decoded = jwt.verify(token, jwtSecret);
        const userData = await user.findOne({ email: decoded.userId }, { password: 0 });
        const { code } = req.body;

        if(!userData || !userData.TFASecret)
        {
            //User or secret not found.
            res.status(400).json(makeError(['Something went wrong.']));
        }

        const verified = speakeasy.totp.verify({
            secret: userData.TFASecret.base32,
            encoding: "base32", 
            token: code, 
            window: 1 
        })

        if(verified){
            userData.TFAEnabled = true;
            await userData.save();
            
            // Create new token with updated isAdmin status
            const token_payload = {
                userId: userData.email,
                role: userData.role,
                isAdmin: (userData.role === 'Admin' && userData.TFAEnabled) ? true : false,
            };
            
            const newToken = jwt.sign(token_payload, jwtSecret, { expiresIn: '1d' });
            
            // Set the updated JWT cookie
            res.cookie("jwt", newToken, {
                httpOnly: true,
                secure: false, // set to true in production
                sameSite: "Strict", // Set to "strict" for prod
                maxAge: 86400 * 1000, // 1 day expiration
            });
            
            res.status(200).json(makeResponse('success', false, ['Two factor authentication setup complete.'], false));
        }
        else{
            res.status(401).json(makeError(['Invalid Code.']));
        }
    }catch(ex){
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

//2FA Login Verification
router.post('/verify2FALogin', async (req, res) => {
    try{
        const { token_data, code, iv } = req.body;
        const email = token_data.userId;
        const userData = await user.findOne({ email: email });

        if(!userData || !userData.TFASecret)
        {
            //User or secret not found.
            res.status(400).json(makeError(['Something went wrong.']));
        }
        if(code.length != 6)
        {
            //Code is not 6 digits.
            res.status(400).json(makeError(['Something went wrong.']));
        }
        encRole = token_data.role;

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), Buffer.from(iv, 'hex'));
        let decryptedRole = decipher.update(encRole, 'hex', 'utf8');
        decryptedRole += decipher.final('utf8');

        token_data.role = decryptedRole;

        const verified = speakeasy.totp.verify({
            secret: userData.TFASecret.base32,
            encoding: "base32", 
            token: code, 
            window: 1 
        });


        if(verified){
            const token = jwt.sign(token_data, jwtSecret, { expiresIn: '1d'}); //EXP in one day.
            res.cookie("jwt", token, 
                {
                    httpOnly: true, //set to true in prod, false for browser testing.
                    secure: false, //set to true when in prod
                    sameSite: "Strict", //Set to "strict" for prod, Lax or None for testing and dev ONLY.
                    maxAge: 86400 * 1000, // EXP in one day.
                }
            );
            return res.status(201).json(makeResponse('success', token, ['Login Successful.'], false));
        }
        else{
            res.status(401).json(makeError(['Incorrect Code.']));
        }


    }catch(ex){
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

module.exports = router;
module.exports.authUser = authUser;
module.exports.authAdmin = authAdmin;