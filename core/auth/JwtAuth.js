/* eslint-disable no-param-reassign */
import jwt from 'jsonwebtoken';
import AuthConfig from '../config/Auth.js';
import { Operator } from '../model/Model.js';

class JwtAuth {
    /**
     * Create access token & refresh token by using payload
     * @param {*} payload
     * @returns
     */

    static createToken(payload) {
        const accessToken = jwt.sign(payload, process.env.AUTH_JWT_ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRED,
        });
        const refreshToken = jwt.sign(payload, process.env.AUTH_JWT_REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.AUTH_JWT_REFRESH_TOKEN_EXPIRED,
        });
        return {
            accessToken,
            refreshToken,
        };
    }

    /**
     * generate access token using refresh token
     * @param {*} refreshToken
     * @returns
     */

    static regenerateAccessToken(refreshToken) {
        return jwt.verify(
            refreshToken,
            process.env.AUTH_JWT_REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err) return null;

                const currentDate = new Date();
                if (decoded.exp * 1000 < currentDate.getTime()) { return null; }

                delete decoded.exp;
                delete decoded.iat;

                const accessToken = jwt.sign(decoded, process.env.AUTH_JWT_ACCESS_TOKEN_SECRET, {
                    expiresIn: process.env.AUTH_JWT_ACCESS_TOKEN_EXPIRED,
                });
                return accessToken;
            },
        );
    }

    /**
     * Get user object using refresh token from cookies
     * @param {*} req request
     * @returns
     */
    static async getUser(req) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                throw Error('no refresh token');
            }
            const user = await AuthConfig.user.findOne({
                where: [{
                    field: 'refresh_token',
                    operator: Operator.equal,
                    value: refreshToken,
                }],
            });

            if (!user) {
                throw Error('auth user failed');
            }
            return user;
        } catch (error) {
            console.error(error);
        }
        return null;
    }
}

export default JwtAuth;
