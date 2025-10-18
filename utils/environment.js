const getOriginUrl = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? process.env.PROD_ORIGIN_URL : process.env.DEV_ORIGIN_URL;
};

const getPort = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? (process.env.PORT || 4000) : (process.env.DEV_PORT || 4500);
};

const isProduction = () => process.env.NODE_ENV === 'production';
const isDevelopment = () => process.env.NODE_ENV === 'development';

module.exports = {
    getOriginUrl,
    getPort,
    isProduction,
    isDevelopment
};