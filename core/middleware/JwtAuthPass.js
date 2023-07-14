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
    const accessToken = authHeader && authHeader.split(' ')[1];
    if (!accessToken) {
        return res.status(403).json({ message: 'unauthorized' });
    }
    jwt.verify(accessToken, process.env.AUTH_JWT_ACCESS_TOKEN_SECRET, async (error, decoded) => {
        if (error) return res.status(403).json({ message: 'unauthorized' });
        const currentDate = new Date();
        if (decoded.exp * 1000 < currentDate.getTime()) { return res.status(410).json({ message: 'access token expired' }); }
        const email = decoded.email ?? null;
        if (AuthConfig.getUserOnRequest) {
            req.user = await JwtAuth.getUser(email);
        }

        return next();
    });
};

export default JwtAuthPass;
