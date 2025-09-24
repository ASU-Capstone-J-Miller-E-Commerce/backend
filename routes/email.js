const express = require('express')
const nodemailer = require("nodemailer");
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
const User = require('../models/user')
const Order = require('../models/order')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { authUser } = require('./authorization')

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
router.post("/contactus", authUser, upload.array("attachments"), async (req, res) => {
  const { subject, message } = req.body;
  const files = req.files; 

    console.log("Body:")
    console.log(req.body)

  if (!subject || !message) {
    console.log("Fucl")
    console.log(subject)
    console.log(message)
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  const mailOptions = {
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: 'jmillercustomcuestest@gmail.com',
      subject,
      html: `<p>${message}</p>`,
      attachments: files?.map(file => ({
        filename: file.originalname,
        content: file.buffer
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
        const resetToken = crypto.randomBytes(8).toString("hex");
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
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return res.status(201).json(makeResponse('success', false, ['Message Sent Successfully.'], false));
          
        }catch(ex){
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }
});

//Order Confirmation Email. Contents to be determined. 
router.post("/orderconfirm", authUser, async (req, res) => {
  const { email , userOrder } = req.body;
    try{
      const mailOptions = {
                from: `"J. Miller Custom Cues" <${process.env.EMAIL_USER}>`,
                to: email,
                subject,
                //text: message,
                html: `<p>This is an automated message. Do not reply to this email.<br>
                ${message}</p>`
              };

        const info = await transporter.sendMail(mailOptions);
        console.log("Order Confirmation sent:", info.messageId);
        return res.status(201).json(makeResponse('success', false, ['Order Confirmation Sent Successfully.'], false));

        }catch(ex){
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }

});


module.exports = router;
