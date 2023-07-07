
import express from "express";
import defaultMiddleware from "./middleware/Middleware.js"
import { routeStoragePublic } from "./config/Media.js"
import api from "../routes/api.js";
import web from "../routes/web.js";
import FirebaseCore from "./firebase/FirebaseCore.js";
import Seeder from "./seeder/Seeder.js";


const Load = async (app) => {
    return await new Promise(async (resolve, reject) => {
        try {
            console.log("load core....")


            //------------------------------------------------------- firebase core
            await FirebaseCore.init()
            //------------------------------------------------------- 

            //------------------------------------------------------- seeder
            await Seeder()


            //------------------------------------------------------- 



            //------------------------------------------------------- Middleware

            defaultMiddleware(app)

            //------------------------------------------------------- 



            //------------------------------------------------------- Routers

            app.use(express.static("public"));

            routeStoragePublic(app)

            api(app)
            web(app)

            //------------------------------------------------------- 
            return resolve("Ready")

        } catch (error) {
            return reject(error)
        }

    }

    )
}

export default Load