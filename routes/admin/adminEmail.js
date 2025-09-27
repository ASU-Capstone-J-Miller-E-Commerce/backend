const express = require('express')
const nodemailer = require("nodemailer");
const { makeData } = require('../../response/makeResponse')
const { makeError, makeResponse } = require('../../response/makeResponse')
const User = require('../../models/user')
const Order = require('../../models/order')
const router = express.Router()
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const { authUser , authAdmin } = require('../authorization')

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

//Email notifications. Contents to be determined. ADMIN ONLY
router.post("/announcement", authAdmin, async (req, res) => {
  const { subject, html } = req.body;

  if (!subject || !html) {
    return res.status(400).json(makeError(['Please enter all fields.']));
  }

  try {
    const users = await User.find({ emailNotos: true }); // filter in the query

    if (!users.length) {
      return res.status(200).json(makeResponse('success', false, ['No recipients with email notifications enabled.'], false));
    }

    const sendPromises = users.map(u => {
      const mailOptions = {
        from: `"J.Miller Custom Cues" <${process.env.EMAIL_USER}>`,
        to: u.email,
        subject,
        html
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