// import bcrypt from 'bcrypt';
// import User from '../models/Product.js';
// import RegisterRequest from '../requests/auth/RegisterRequest.js';
// import JwtAuth from '../core/auth/JwtAuth.js';

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const user = await User.findOne({ where: { email } });

//         const match = await bcrypt.compare(password, user.password);

//         if (!match) return res.status(400).json({ message: 'wrong password' });

//         const payload = {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//         };
//         const token = JwtAuth.createToken(payload);

//         await user.update({
//             refresh_token: token.refreshToken,
//         });

//         res.cookie('refreshToken', token.refreshToken, {
//             httpOnly: true,
//             maxAge: 24 * 60 * 60 * 1000,
//             // secure: true
//         });
//         return res.json({ message: 'login success', accessToken: token.accessToken });
//     } catch (error) {
//         console.error(error);
//     }
//     return res.status(409);
// };

// const register = async (req, res) => {
//     try {
//         const valid = new RegisterRequest(req);
//         await valid.check();
//         if (valid.isError) { return valid.responseError(res); }

//         const { name, email, password } = req.body;
//         const salt = await bcrypt.genSalt();
//         const hashPassword = await bcrypt.hash(password, salt);
//         const user = await User.create({
//             name,
//             email,
//             password: hashPassword,
//         });

//         await user.setRole('customer');

//         res.json({ message: 'register success' }).status(200);
//     } catch (error) {
//         console.error(error);
//     }
//     return res.status(409);
// };

// const refreshToken = async (req, res) => {
//     try {
//         const { refreshToken } = req.cookies;

//         if (!refreshToken) return res.sendStatus(401);

//         const user = await User.findOne(
//             {
//                 where: {
//                     refresh_token: refreshToken,
//                 },
//             },
//         );

//         if (!user) return res.sendStatus(403);

//         const accessToken = JwtAuth.regenerateAccessToken(refreshToken);

//         if (!accessToken) { res.status(403); }

//         res.json({ message: 'get token success', accessToken });
//     } catch (error) {
//         console.log(error);
//     }
// };

// const logout = async (req, res) => {
//     try {
//         const { refreshToken } = req.cookies;
//         if (!refreshToken) return res.sendStatus(204);
//         const user = await User.findOne(
//             {
//                 where: {
//                     refresh_token: refreshToken,
//                 },
//             },
//         );

//         if (!user) return res.sendStatus(204);

//         await user.update({
//             refresh_token: null,
//         });

//         res.clearCookie('refreshToken');

//         res.status(200).json({ message: 'logout success' });
//     } catch (error) {
//         console.log(error);
//     }
// };

// export default {
//     login,
//     register,
//     refreshToken,
//     logout,
// };
