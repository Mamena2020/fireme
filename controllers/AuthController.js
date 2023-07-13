import bcrypt from 'bcrypt';
import User from '../models/User.js';
import RegisterRequest from '../requests/RegisterRequest.js';
import LoginRequest from '../requests/LoginRequest.js';
import JwtAuth from '../core/auth/JwtAuth.js';
import { Operator } from '../core/model/Model.js';

export default class AuthController {
    static async register(req, res) {
        try {
            const request = new RegisterRequest(req);
            await request.check();
            if (request.isError) { return request.responseError(res); }

            const { name, email, password } = req.body;
            const salt = await bcrypt.genSalt();
            const hashPassword = await bcrypt.hash(password, salt);
            const user = await User.stored({
                name,
                email,
                password: hashPassword,
            });

            await user.setRole('admin');

            return res.json({ message: 'register success' }).status(200);
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    static async login(req, res) {
        try {
            const request = new LoginRequest(req);
            await request.check();
            if (request.isError) { return request.responseError(res); }

            const { email, password } = req.body;

            const user = await User.findOne({
                where: [
                    { field: 'email', operator: Operator.equal, value: email },
                ],
            });
            if (!user) return res.status(404).json({ message: 'user not found' });

            const match = await bcrypt.compare(password, user.password);

            if (!match) return res.status(400).json({ message: 'wrong password' });

            const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
            };
            const token = JwtAuth.createToken(payload);

            await user.update({
                refresh_token: token.refreshToken,
            });

            res.cookie('refreshToken', token.refreshToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                // secure: true
            });
            return res.json({ message: 'login success', accessToken: token.accessToken });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.cookies;

            if (!refreshToken) return res.sendStatus(401);

            const user = await User.findOne(
                {
                    where: [{
                        field: 'refresh_token', operator: Operator.equal, value: refreshToken,
                    }],
                },
            );

            if (!user) return res.sendStatus(403);

            const accessToken = JwtAuth.regenerateAccessToken(refreshToken);

            if (!accessToken) { res.status(403); }

            return res.json({ message: 'get token success', accessToken });
        } catch (error) {
            console.error(error);
        }
        return res.sendStatus(409);
    }

    static async logout(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) return res.sendStatus(204);
            const user = await User.findOne(
                {
                    where: [
                        { field: 'refresh_token', operator: Operator.equal, value: refreshToken },
                    ],
                },
            );

            if (!user) return res.sendStatus(204);

            await user.update({
                refresh_token: null,
            });

            return res.clearCookie('refreshToken').status(200).json({ message: 'logout success' });
        } catch (error) {
            console.error(error);
        }
        return res.sendStatus(409);
    }
}
