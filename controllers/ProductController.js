import { Operator } from "../core/model/Model.js";
import Product from "../models/Product.js";


export default class ProductController {


    static async getByName(req, res) {
        const name = req.params.name
        const product = await Product.findOne({
            where: [
                { "field": "name", "operator": Operator.equal, "value": name }
            ]
        })

        res.json({
            "message": "get single data",
            "product": product,
            "media": product?.getMedia(),
            "role": product?.getRole()
        })
    }

    static async fetch(req, res) {
        const products = await Product.findAll({
            // orderBy: {
            //     "field": "updated_at",
            //     "sort": "desc"
            // }
            // where: [{ field: "name", operator: "like", value: "ona" }]
        })

        const productResource = []

        products.forEach((e) => {
            productResource.push({
                "id": e.id,
                "name": e.name,
                "price": e.price,
                "created_at":e.created_at.toDate(),
                "updated_at":e.updated_at.toDate(),
                "medias": e.getMedia(),
                "role": e.getRole()
            })
        })

        res.json({
            "message": "get products",
            "products": productResource
        })
    }
    static async search(req, res) {

        const name = req.params.name

        const products = await Product.findAll({
            where: [{ field: "name", operator: Operator.like, value: name }]
        })

        const productResource = []

        products.forEach((e) => {
            productResource.push({
                // "id": e.id,
                // "name": e.name,
                // "price": e.price,
                ...e,
                "medias": e.getMedia(),
                "role": e.getRole()
            })
        })

        res.json({
            "message": "search products",
            "products": productResource
        })
    }

    static async stored(req, res) {
        // console.log(req.body)
        const { name, price } = req.body
        if (!name || !price)
            return res.status(422).json({ "message": "name and price required" })

        const data = {
            "name": name,
            "price": price
        }

        const product = await Product.stored(data)

        if (!product) return res.json({ "message": "failed to stored" })

        if (product) {
            await product.setRole("admin")
        }

        res.json({
            "message": "store product",
            "user": product,
            "role": product.getRole()
        })
    }

    static async delete(req, res) {
        const id = req.params.id
        const deleted = await Product.destroy({
            where: [
                { "field": "price", "operator": Operator.lt, "value": parseInt(id) }
            ]
        })
        res.json({ "message": deleted ? "deleted" : "delete failed", })
    }
    static async update(req, res) {
        const id = req.params.id

        const { name, price } = req.body

        const product = await Product.findOne({
            where: [
                { "field": "id", "operator": Operator.equal, "value": id }
            ]
        })
        if (!product) return res.json({ "message": "not found", })

        const updated = await product.update({
            "name": name,
            "price": price
        })
        res.json({ "message": updated ? "updated" : "update failed", })
    }
    static async updateMany(req, res) {

        const { new_price, old_price } = req.body

        const updated = await Product.update({
            fields: {
                "price": new_price
            },
            where: [
                { "field": "price", "operator": Operator.lt, "value": old_price }
            ]
        })
        res.json({ "message": updated ? "updated" : "update failed", })
    }

    static async addImage(req, res) {

        const id = req.params.id
        const { image, name } = req.body

        const product = await Product.findOne({
            where: [{ "field": "id", "operator": Operator.equal, "value": id }]
        })

        if (!product) return res.json({ "message": "product not found" })

        const media = await product.saveMedia(image, name)

        res.json({ "message": media ? "updated" : "failed", "media": media })
    }
    static async destroyImage(req, res) {

        const id = req.params.id
        const name = req.params.name

        const product = await Product.findOne({
            where: [{ "field": "id", "operator": Operator.equal, "value": id }]
        })

        if (!product) return res.json({ "message": "product not found" })

        const media = await product.destroyMedia(name)

        res.json({ "message": media ? "image deleted" : "failed delete" })
    }

    static async removeRole(req, res) {

        const id = req.params.id

        const product = await Product.findOne({
            where: [{ "field": "id", "operator": Operator.equal, "value": id }]
        })

        if (!product) return res.json({ "message": "product not found" })

        const removed = await product.removeRole()

        res.json({ "message": removed ? "role removed" : "failed to remove role" })
    }

}














