const resetPasswordTemplate = (resetToken) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 5px; text-align: center;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666;">This is an automated message. Do not reply to this email.</p>
            <p>Your password reset token is:</p>
            <div style="padding: 10px; background: #f4f4f4; border: 1px solid #ccc; display: inline-block;">
              <strong>${resetToken}</strong>
            </div>
            <p style="color: #666; margin-top: 20px;">
              Use this token to log in to your account and update your password.
            </p>
        </div>
    </body>
    </html>`
}

module.exports = resetPasswordTemplate