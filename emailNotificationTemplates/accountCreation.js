const { getAllowedOrigins } = require('../utils/environment');

const accountCreationTemplate = (firstName, email) => {
  const originUrl = getAllowedOrigins()[0];
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Account Created</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 5px; text-align: center;">
            <h2 style="color: #333;">Account Created Successfully</h2>
            <p style="color: #666;">Welcome to J.Miller Custom Cues, ${firstName || 'there'}!</p>
            <p style="color: #666;">Your account has been created with the email: <strong>${email}</strong></p>
            <p style="margin-top: 20px;">
              <a href="${originUrl}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Visit Website
              </a>
            </p>
            <p style="color: #666; margin-top: 20px;">If you have any questions, please contact us through our website.</p>
        </div>
    </body>
    </html>
  `;
};

module.exports = accountCreationTemplate;