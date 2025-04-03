
const returnMessage = (email) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to J Miller Custom Cues</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 5px; text-align: center;">
                <h2 style="color: #333;">Welcome to J Miller Custom Cues!</h2>
                <p style="color: #666;">Thank you for creating an account with us. Your passion for precision-crafted cues starts here.</p>
                <p><strong>Account Details:</strong></p>
                <p>Email: ${email}</p>
                <p>Click the button below to access your account:</p>
                <a href="https://google.com" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to My Account</a>
                <p style="color: #666; margin-top: 20px;">If you did not create this account, please contact our support team.</p>
            </div>
        </body>
        </html>
        `
}


module.exports.returnMessage = returnMessage