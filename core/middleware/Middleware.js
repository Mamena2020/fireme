import express from 'express';
import cookieParser from 'cookie-parser';
import CorsHandling from './CorsHandling.js';
import mediaRequestHandling from './MediaRequestHandling.js';
import localeConfig from '../config/Locale.js';
import LocalePass from './LocalePass.js';
import SanitizePass from './SanitizePass.js';

/**
 * Default middleware
 */
const defaultMiddleware = (app) => {
    CorsHandling(app);

    //-------------------------------------------------------
    // read cookie from client
    app.use(cookieParser());
    //-------------------------------------------------------

    // read reques body json & formData
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // ------------------------------------------------------- files upload handling & nested field
    app.use(mediaRequestHandling);
    // ------------------------------------------------------- sanitize req.body against XSS
    app.use(SanitizePass);
    // ------------------------------------------------------- locale
    if (localeConfig.useLocale) {
        app.use(LocalePass);
    }
    //-------------------------------------------------------
};

export default defaultMiddleware;
