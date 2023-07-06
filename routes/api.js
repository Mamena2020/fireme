import express from "express";
import JwtAuthPass from "../core/middleware/JwtAuthPass.js";
import ProductController from "../controllers/ProductController.js";



export default function api(app) {

    const routerGuest = express.Router()
    // routerGuest.post("/login", Requests.login, AuthController.login)
    // routerGuest.post("/register", AuthController.register)
    // routerGuest.get("/token", AuthController.refreshToken)
    // routerGuest.delete("/logout", AuthController.logout)
    // routerGuest.get("/users", UserController.getUsers)
    
    routerGuest.get("/product", ProductController.fetch)
    routerGuest.get("/product/:name", ProductController.getByName)
    routerGuest.post("/product", ProductController.stored)
    routerGuest.delete("/product/:id", ProductController.delete)
    routerGuest.put("/product/:id", ProductController.update)
    routerGuest.put("/product", ProductController.updateMany)
    
    
    app.use("/api", routerGuest)
    // routerGuest.get("/:locale/users", LocalePass, UserController.getUsers)





    // const routerAuth = express.Router()
    // routerAuth.use(JwtAuthPass)
    // routerAuth.get("/user", UserController.getUser)
    // routerAuth.post("/upload", UserController.upload)

    // app.use("/api", routerAuth)

}