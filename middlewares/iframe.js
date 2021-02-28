module.exports = async (req, res, next) => {
    res.set('X-Frame-Options', 'DENY');
    res.set('Content-Security-Policy', "frame-ancestors 'none';");
    next();
};