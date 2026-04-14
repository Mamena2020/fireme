import xss from 'xss';

/**
 * Recursively sanitize all string values in an object against XSS
 * @param {*} value
 * @returns sanitized value
 */
function sanitize(value) {
    if (typeof value === 'string') return xss(value);
    if (Array.isArray(value)) return value.map(sanitize);
    if (value !== null && typeof value === 'object') {
        const result = {};
        Object.keys(value).forEach((key) => {
            result[key] = sanitize(value[key]);
        });
        return result;
    }
    return value;
}

/**
 * Middleware to sanitize all string fields in req.body against XSS
 */
const SanitizePass = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitize(req.body);
    }
    next();
};

export default SanitizePass;
