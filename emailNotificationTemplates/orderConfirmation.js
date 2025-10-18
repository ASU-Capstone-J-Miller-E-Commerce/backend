const { getOriginUrl } = require('../utils/environment');

const orderConfirmationTemplate = (orderNumber) => {
  const originUrl = getOriginUrl();
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 5px; text-align: center;">
            <h2 style="color: #333;">Order Confirmation</h2>
            <p style="color: #666;">Thank you for your order!</p>
            <p style="color: #666;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin-top: 20px;">
              <a href="${originUrl}/account/orders/${orderNumber}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Your Order
              </a>
            </p>
            <p style="color: #666; margin-top: 20px;">If you have any questions, please contact us through our website.</p>
        </div>
    </body>
    </html>
  `;
};

module.exports = orderConfirmationTemplate;
