import dotenv from 'dotenv';
import express from 'express';
import Load from './core/Core.js';

dotenv.config();
const app = express();

const port = process.env.APP_PORT || 5000;

Load(app).then((msg) => {
    console.info(msg);
    app.listen(port, () => {
        console.info(`Server running on: ${port}`);
    });
}).catch((error) => {
    console.error('\x1b[31m', error, '\x1b[0m');
});
