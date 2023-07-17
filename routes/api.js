import express from 'express';
import JwtAuthPass from '../core/middleware/JwtAuthPass.js';
import AuthController from '../controllers/AuthController.js';
import UserController from '../controllers/UserController.js';
import CategoryController from '../controllers/CategoryController.js';
import ProductController from '../controllers/ProductController.js';
// import BasicAuthPass from '../core/middleware/BasicAuthPass.js';

export default function api(app) {
    const routerGuest = express.Router();
    // const routerAuthBasic = express.Router();
    const routerAuth = express.Router();

    routerGuest.post('/login', AuthController.login);
    routerGuest.post('/register', AuthController.register);
    routerGuest.get('/token', AuthController.refreshToken);
    routerGuest.delete('/logout', AuthController.logout);
    routerGuest.get('/users', UserController.users);
    // routerAuthBasic.get('/user2', BasicAuthPass, AuthController.user);
    routerAuth.get('/user', JwtAuthPass, UserController.user);
    routerAuth.post('/user/avatar', JwtAuthPass, UserController.uploadAvatar);
    routerAuth.delete('/user/avatar', JwtAuthPass, UserController.removeAvatar);

    // category
    routerAuth.get('/category', JwtAuthPass, CategoryController.fetch);
    routerAuth.post('/category', JwtAuthPass, CategoryController.stored);
    routerAuth.delete('/category/:id', JwtAuthPass, CategoryController.delete);
    // product
    routerAuth.get('/product', JwtAuthPass, ProductController.fetch);
    routerAuth.post('/product', JwtAuthPass, ProductController.stored);

    app.use('/api', routerGuest);
    // app.use('/api', routerAuthBasic);
    app.use('/api', routerAuth);
}
