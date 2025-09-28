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
            <p><strong>Your password has been reset.</strong></p>
            <p style="color: #d32f2f; font-weight: bold;">This is your new temporary password. You must use this password to log in to your account.</p>
            <div style="padding: 10px; background: #f4f4f4; border: 1px solid #ccc; display: inline-block; font-size: 1.2em;">
              <strong>${resetToken}</strong>
            </div>
            <p style="color: #666; margin-top: 20px;">
              After logging in, please update your password to something memorable in your account settings.
            </p>
        </div>
    </body>
    </html>`
}

module.exports = resetPasswordTemplate