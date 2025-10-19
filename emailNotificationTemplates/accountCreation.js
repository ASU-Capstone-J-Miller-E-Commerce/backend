const { getOriginUrl } = require('../utils/environment');

const accountCreationTemplate = (firstName, email) => {
  const originUrl = getOriginUrl();
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to J.Miller Custom Cues</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8B4513; margin: 0; font-size: 28px;">J.Miller Custom Cues</h1>
                <div style="height: 3px; background: linear-gradient(90deg, #8B4513, #D2691E); margin: 10px auto; width: 100px;"></div>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to the Family!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Hello ${firstName || 'there'},
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Welcome to J.Miller Custom Cues! Your account has been successfully created with the email address: <strong>${email}</strong>
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 25px 0; border-left: 4px solid #8B4513;">
                <h3 style="color: #8B4513; margin-top: 0;">What's Next?</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>Browse our collection of handcrafted custom cues</li>
                    <li>Explore premium accessories and cases</li>
                    <li>Contact us for custom orders and personalization</li>
                    <li>Manage your orders and account settings</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${originUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #8B4513, #D2691E); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);">
                    Start Shopping
                </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #888; font-size: 14px; margin: 0;">
                    Questions? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color: #8B4513;">${process.env.EMAIL_USER}</a>
                </p>
                <p style="color: #888; font-size: 14px; margin: 10px 0 0 0;">
                    Thank you for choosing J.Miller Custom Cues - Where craftsmanship meets passion.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = accountCreationTemplate;