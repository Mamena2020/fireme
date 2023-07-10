import jwt from 'jsonwebtoken';
import JwtAuth from '../auth/JwtAuth.js';
import AuthConfig from '../config/Auth.js';

/**
 * Jwt middleware checking access token from header bearer token
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */

// eslint-disable-next-line consistent-return
const JwtAuthPass = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'unauthorized' });
    }
    jwt.verify(token, process.env.AUTH_JWT_ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'unauthorized' });
        const currentDate = new Date();
        if (decoded.exp * 1000 < currentDate.getTime()) { return res.status(410).json({ message: 'access token expired' }); }

        if (AuthConfig.getUserOnRequest) {
            req.user = await JwtAuth.getUser(req);
        }

        return next();
    });
};

export default JwtAuthPass;
