const express = require('express')
const nodemailer = require("nodemailer");
const { makeData } = require('../response/makeResponse')
const { makeError, makeResponse } = require('../response/makeResponse')
const router = express.Router()

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

router.post("/", async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  const mailOptions = {
    from: `"Admin" <${process.env.EMAIL_USER}>`,
    to: 'jmillercustomcuestest@gmail.com',
    subject,
    //text: message,
    html: `<p>${message}</p>`
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


module.exports = router;
