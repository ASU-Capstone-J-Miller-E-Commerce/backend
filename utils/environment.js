const getOriginUrl = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? process.env.PROD_ORIGIN_URL : process.env.DEV_ORIGIN_URL;
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

const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd, // true in production, false in development
        sameSite: isProd ? "Lax" : "Lax", // Strict in production, Lax in development
        maxAge: 2 * (86400 * 1000), // 2 day expiration
    };
};

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

module.exports = {
    getOriginUrl,
    getPort,
    getDatabaseUrl,
    getStripeKey,
    getCookieOptions,
    isProduction,
    isDevelopment
};