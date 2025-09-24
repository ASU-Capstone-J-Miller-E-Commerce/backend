const express = require('express')
const nodemailer = require("nodemailer");
const { makeData } = require('../../response/makeResponse')
const { makeError, makeResponse } = require('../../response/makeResponse')
const User = require('../../models/user')
const Order = require('../../models/order')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { authUser , authAdmin } = require('../authorization')

//Email notifications. Contents to be determined. ADMIN ONLY
router.post("/announcement", authAdmin, upload.array("attachments"), async (req, res) => {
  const { subject, message } = req.body;
  const files = req.files;

  if (!subject || !message) {
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  try {
    const users = await User.find({ emailNotos: true }); // filter in the query

    if (!users.length) {
      return res.status(200).json(makeResponse('success', false, ['No recipients with email notifications enabled.'], false));
    }

    const attachments = files?.map(file => ({
      filename: file.originalname,
      content: file.buffer,
    })) || [];

    const html = `<p>This is an automated message. Do not reply to this email.<br>${message}</p>`;

    const sendPromises = users.map(u => {
      const mailOptions = {
        from: `"Admin" <${process.env.EMAIL_USER}>`,
        to: u.email,
        subject,
        html,
        attachments,
      };
      return transporter.sendMail(mailOptions)
        .then(info => ({ email: u.email, ok: true, id: info.messageId }))
        .catch(err => ({ email: u.email, ok: false, error: String(err) }));
    });

    const results = await Promise.all(sendPromises);
    const sent = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);

    const msgs = [`Sent ${sent} announcement email(s).`];
    if (failed.length) msgs.push(`Failed ${failed.length}: ${failed.map(f => f.email).join(', ')}`);

    return res.status(200).json(makeResponse('success', false, msgs, false));
  } catch (ex) {
    console.error(ex);
    return res.status(500).json(makeError(['Something went wrong.']));
  }
});

module.exports = router;