const express = require('express')
const nodemailer = require("nodemailer");
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
const user = require('../models/user')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your admin email
    pass: process.env.EMAIL_PASS  // app password (NOT your real Gmail pass!)
  }
});

// function to send emails
async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: `"Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

//Contact Us Route
router.post("/contactus", async (req, res) => {
  const { subject, message, attachments  } = req.body;

  if (!subject || !message) {
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  const mailOptions = {
    from: `"Admin" <${process.env.EMAIL_USER}>`,
    to: 'jmillercustomcuestest@gmail.com',
    subject,
    //text: message,
    html: `<p>${message}</p>`,
    attachments: attachments?.map(file => ({
        filename: file.filename,
        path: file.path,
        content: file.content,
        encoding: file.encoding || undefined
    }))
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return res.status(201).json(makeResponse('success', false, ['Message Sent Successfully.'], false));
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json(makeError(['Failed to send message.']));
  }
});

//Reset password route. This needs to be hooked up still.
//
router.post("/resetPassword", async (req, res) => {
  const { email } = req.body;

    //Search for user in database.
    try{
        //Find user in the database by email.
        const login = await User.findOne({ email });
        if(!login)
        {
            //User not found. Invalid email.
            return res.status(400).json(makeError(['Invalid Email or Password.']));
        }

        //Generate new password, encrypt and save.
        const resetToken = bcrypt.randomBytes(32).toString("hex");
        const editedUser = await User.findOne({email: email});
        const passHash = await bcrypt.hash(resetToken, 10);
        editedUser.password = passHash;
        await editedUser.save();
        const subject = "Password Reset."
        //Send password to email.
        const mailOptions = {
          from: `"Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject,
          //text: message,
          html: `<p>This is an automated message. Do not reply to this email.<br>
          Your password reset token is: ${resetToken}. Use this to login to your account.</p>`
        };
    
          
        }catch(ex){
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return res.status(201).json(makeResponse('success', false, ['Message Sent Successfully.'], false));
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json(makeError(['Failed to send message.']));
  }
});

//Email notifications. Contents to be determined. ADMIN ONLY
router.post("/notification", async (req, res) => {
  const { subject, message } = req.body;

    //Search for user in database.
    try{
        //Find each user in the database by email.
        const users = await User.find({});

        // if user has email notos turned on, send them a notification.
        for ( const user of users )
        {
          if(user.emailNotos === true)
          {
            const mailOptions = {
                from: `"Admin" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject,
                //text: message,
                html: `<p>This is an automated message. Do not reply to this email.<br>
                ${message}</p>`
              };
              try {
                  const info = await transporter.sendMail(mailOptions);
                  console.log("Email sent:", info.messageId);
                  return res.status(201).json(makeResponse('success', false, ['Message Sent Successfully.'], false));
              } 
              catch (error) {
                console.error("Error sending email:", error);
                return res.status(500).json(makeError(['Failed to send message.']));
              }
          }
        }
          
        }catch(ex){
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }

});

module.exports = router;
