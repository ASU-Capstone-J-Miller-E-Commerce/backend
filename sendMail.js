const nodemailer = require('nodemailer')
require('dotenv').config()

function sendEmail(email, subject, message) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_NAME,
            pass: process.env.EMAIL_PASS
        }
})

    
    var mailOptions = {
        from: '"J Miller Custom Cues" devidwannar429@gmail.com',
        to: email,
        subject: subject,
        html: message
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}


module.exports.sendEmail = sendEmail