const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const user = require('../models/user');
const router = express.Router();

// New User Registration
router.post('/register', async (req, res) => 
{
    const { email, password } = req.body;

    try{
        //Check if the entered email is in fact an email address.
        if(!validator.isEmail(email))
        {
            return res.status(400).json({message: 'Please enter a valid email address.'});
        }

        // Check if a user with that email exists in the database.
        const userExists = await user.findOne({email});
        //
        if(userExists)
        {
            //If user is found, return 400
            return res.status(400).json({message: 'User already exists.'});
        }

        //User does not exist! We can register.
        //Int is the salt length to generate, longer value is more secure.
        const passHash = await bcrypt.hash(password, 10);

        const newUser = new user( { email, password: passHash } );

        await newUser.save();
        res.status(201).json({ message: 'You have registered successfully!'});
    }catch (ex){
        res.status(500).json({ message: 'Error. Server might be down or your connetion may be faulty.', error: ex});
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
            return res.status(400).json({ message: 'We do not have an account under that email.'});
        }

        //User found, compare password hashes.
        const validPassword = await bcrtypt.compare(password, user.password);
        if(!validPassword)
        {
            //Invalid password.
            return res.status(400).json({ message: 'Invalid username / password.'});
        }

        //Successful authorization. Create token.
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },{
                expiresIn: '4h' // Duration for the token.
            });
        
        res.status(200).json({ message: 'Login successful', token});

    }catch(ex){
        res.status(500).json({ message: 'Error. Server might be down or your connetion may be faulty.', error: ex});
    }
});

module.exports = router;