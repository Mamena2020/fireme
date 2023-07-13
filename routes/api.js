import express from 'express';
import JwtAuthPass from '../core/middleware/JwtAuthPass.js';
import AuthController from '../controllers/AuthController.js';
import UserController from '../controllers/UserController.js';
// import BasicAuthPass from '../core/middleware/BasicAuthPass.js';

export default function api(app) {
    const routerGuest = express.Router();
    // const routerAuthBasic = express.Router();
    const routerAuth = express.Router();

    routerGuest.post('/login', AuthController.login);
    routerGuest.post('/register', AuthController.register);
    routerGuest.get('/token', AuthController.refreshToken);
    routerGuest.delete('/logout', AuthController.logout);
    routerGuest.get('/user', UserController.user);

    // routerAuthBasic.get('/user2', BasicAuthPass, AuthController.user);
    routerAuth.post('/user/avatar', JwtAuthPass, UserController.uploadAvatar);

    app.use('/api', routerGuest);
    // app.use('/api', routerAuthBasic);
    app.use('/api', routerAuth);
}
