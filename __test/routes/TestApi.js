import express from 'express';
import JwtAuthPass from '../../core/middleware/JwtAuthPass.js';
import AuthController from '../../controllers/AuthController.js';
import UserController from '../../controllers/UserController.js';
import BasicAuthPass from '../../core/middleware/BasicAuthPass.js';
import CategoryController from '../controllers/CategoryController.js';
import ProductController from '../controllers/ProductController.js';

export default function testApi(app) {
    const routerGuest = express.Router();
    const routerAuthBasic = express.Router();
    const routerAuth = express.Router();

    routerGuest.post('/login', AuthController.login);
    routerGuest.post('/register', AuthController.register);
    routerGuest.get('/token', AuthController.refreshToken);
    routerGuest.delete('/logout', AuthController.logout);
    routerGuest.get('/users', UserController.users);

    routerAuthBasic.get('/users2', BasicAuthPass, UserController.user);

    routerAuth.get('/user', JwtAuthPass, UserController.user);
    routerAuth.post('/user/avatar', JwtAuthPass, UserController.uploadAvatar);
    routerAuth.delete('/user/avatar', JwtAuthPass, UserController.removeAvatar);
    // category
    routerAuth.get('/category', JwtAuthPass, CategoryController.fetch);
    routerAuth.post('/category', JwtAuthPass, CategoryController.stored);
    routerAuth.put('/category/:id', JwtAuthPass, CategoryController.update);
    routerAuth.delete('/category/:id', JwtAuthPass, CategoryController.delete);
    // product
    routerAuth.get('/product', JwtAuthPass, ProductController.fetch);
    routerAuth.post('/product', JwtAuthPass, ProductController.stored);
    routerAuth.put('/product/:id', JwtAuthPass, ProductController.update);
    routerAuth.delete('/product/:id', JwtAuthPass, ProductController.delete);

    app.use('/api/test', routerGuest);
    app.use('/api/test', routerAuthBasic);
    app.use('/api/test', routerAuth);
}
