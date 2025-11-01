const resetPasswordTemplate = require('../emailNotificationTemplates/resetPassword.js')
const orderConfirmationTemplate = require('../emailNotificationTemplates/orderConfirmation.js')
const accountCreationTemplate = require('../emailNotificationTemplates/accountCreation.js')
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
  host: 'in-v3.mailjet.com',
  port: 2525,
  auth: {
    user: process.env.MJ_USER,
    pass: process.env.MJ_PASS
  }
});

// Account creation email function
async function sendAccountCreationEmail({ email, firstName }) {
  try {
    const subject = "Account Created - J.Miller Custom Cues";
    const htmlContent = accountCreationTemplate(firstName, email);
    const mailOptions = {
      from: `"J.Miller Custom Cues" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Account creation email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (ex) {
    console.error("Error sending account creation email:", ex);
    throw new Error('Failed to send account creation email.');
  }
}

//Contact Us Route
router.post("/contactus", upload.array("attachments"), async (req, res) => {
  const { subject, message } = req.body;
  const files = req.files;

  if (!subject || !message) {
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  let replyTo = undefined;
  const emailMatch = message.match(/Client Email:\s*([^<\n]+)\s*<br>/i);
  if (emailMatch && emailMatch[1]) {
    replyTo = emailMatch[1].trim();
  }
  // Only add attachments if files exist and are non-empty
  const attachments = Array.isArray(files) && files.length > 0
    ? files.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }))
    : undefined;
  const mailOptions = {
    from: `"J.Miller Custom Cues" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject,
    html: `<p>${message}</p>`,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments ? { attachments } : {})
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

//Reset password route.
router.post("/resetPassword", async (req, res) => {
  const { email } = req.body;

  // Always respond with success and a generic message
  try {
    const userRecord = await User.findOne({ email });
    if (userRecord) {
      // Generate new password
      const resetToken = crypto.randomBytes(8).toString("hex");
      const subject = "Password Reset.";
      const htmlContent = resetPasswordTemplate(resetToken);
      const mailOptions = {
        from: `"J.Miller Custom Cues" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent
      };
      // Send email, then update password only if successful
      await transporter.sendMail(mailOptions)
        .then(async (info) => {
          console.log("Email sent:", info.messageId);
          const passHash = await bcrypt.hash(resetToken, 10);
          userRecord.password = passHash;
          await userRecord.save();
        })
        .catch((emailErr) => {
          console.error("Error sending reset email:", emailErr);
          // Do not update password if email fails to send
        });
    }
    // Always respond with success, regardless of user existence
    return res.status(200).json(makeResponse('success', false, ['If the email exists, a temporary password has been sent.'], false));
  } catch (ex) {
    console.error(ex);
    // Still respond with success to avoid leaking info
    return res.status(200).json(makeResponse('success', false, ['If the email exists, a temporary password has been sent.'], false));
  }
});

async function sendOrderConfirmationEmail({ email, orderID }) {
  try {
    const subject = "J.Miller Custom Cues Order Confirmation";
    const htmlContent = orderConfirmationTemplate(orderID);
    const mailOptions = {
      from: `"J.Miller Custom Cues" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Order Confirmation sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (ex) {
    console.error(ex);
    throw new Error('Failed to send order confirmation email.');
  }
}

module.exports = router;
module.exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
module.exports.sendAccountCreationEmail = sendAccountCreationEmail;
