const getAllowedOrigins = () => {
    if (isDevelopment()) {
        return [process.env.DEV_ORIGIN_URL];
    }
    return [
        'https://jmillercustomcues.com',
        'https://www.jmillercustomcues.com'
    ];
};

const getPort = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? (process.env.PORT || 4000) : (process.env.DEV_PORT || 4500);
};

const getDatabaseUrl = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? process.env.PROD_DATABASE_URL : process.env.DEV_DATABASE_URL;
};

const getStripeKey = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? process.env.PROD_STRIPE_KEY : process.env.DEV_STRIPE_KEY;
};

const getStripeWebhookSecret = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? process.env.PROD_STRIPE_WEBHOOK_SECRET : process.env.DEV_STRIPE_WEBHOOK_SECRET;
};

const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd, // true in production, false in development
        sameSite: isProd ? "Strict" : "Lax", // Strict in production, Lax in development
        maxAge: 2 * (86400 * 1000), // 2 day expiration
    };
};

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

module.exports = {
    getAllowedOrigins,
    getPort,
    getDatabaseUrl,
    getStripeKey,
    getStripeWebhookSecret,
    getCookieOptions,
    isProduction,
    isDevelopment
};