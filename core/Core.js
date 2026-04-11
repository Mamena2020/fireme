import express from 'express';
import defaultMiddleware from './middleware/Middleware.js';
import FirebaseCore from './firebase/FirebaseCore.js';
import Seeder from './seeder/Seeder.js';
import api from '../routes/api.js';
import web from '../routes/web.js';
// import testApi from '../__test/routes/TestApi.js'; // for testing purpose, should be removed in production

// eslint-disable-next-line no-async-promise-executor
const Load = (app) => new Promise(async (resolve, reject) => {
    try {
        console.info('load core....');
        // ------------------------------------------------------- firebase core
        await FirebaseCore.init();
        // ------------------------------------------------------- seeder
        await Seeder();

        // ------------------------------------------------------- Middleware

        defaultMiddleware(app);

        // ------------------------------------------------------- Routers

        app.use(express.static('public')); // for serving static files in public folder

        api(app);
        web(app);

        // testApi(app); // test api should be removed in production

        // -------------------------------------------------------
        resolve('Ready');
    } catch (error) {
        reject(error);
    }
});

export default Load;
