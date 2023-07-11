import express from 'express';
import JwtAuthPass from '../core/middleware/JwtAuthPass.js';
import ProductController from '../controllers/ProductController.js';
import RoleController from '../controllers/RoleController.js';
import AuthController from '../controllers/AuthController.js';

export default function api(app) {
    const routerGuest = express.Router();
    routerGuest.post('/login', AuthController.login);
    routerGuest.post('/register', AuthController.register);
    routerGuest.get('/token', AuthController.refreshToken);
    routerGuest.delete('/logout', AuthController.logout);
    // routerGuest.get("/users", UserController.getUsers)
    routerGuest.get('/role', RoleController.fetch);

    routerGuest.get('/product/search/:name', ProductController.search);
    routerGuest.get('/product/:name', ProductController.getByName);
    routerGuest.post('/product', ProductController.stored);
    routerGuest.delete('/product/:id', ProductController.delete);
    routerGuest.put('/product/:id', ProductController.update);
    routerGuest.put('/product', ProductController.updateMany);
    routerGuest.post('/product/:id/image', ProductController.addImage);
    routerGuest.delete('/product/:id/image/:name', ProductController.destroyImage);
    routerGuest.delete('/product/:id/role', ProductController.removeRole);

    app.use('/api', routerGuest);
    // routerGuest.get("/:locale/users", LocalePass, UserController.getUsers)

    const routerAuth = express.Router();
    routerAuth.use(JwtAuthPass);
    routerAuth.get('/product', ProductController.fetch);
    app.use('/api', routerAuth);
}
