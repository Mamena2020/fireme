import Product from "../models/Product.js";


export default class ProductController {


    static async getByName(req, res) {
        const name = req.params.name
        console.log("name", name)
        const product = await Product.findOne({
            where: [
                { "field": "name", "operator": "==", "value": name }
            ]
        })



        res.json({ "message": "get single data", "product": product })
    }

    static async fetch(req, res) {
        const products = await Product.findAll({
            // where: [{ field: "name", operator: "like", value: "ona" }]
        })
        res.json({
            "message": "get products",
            "products": products
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

        const product = await Product.stored({ data: data })

        res.json({
            "message": "store product",
            "user": product
        })
    }

    static async delete(req, res) {
        const id = req.params.id
        const deleted = await Product.destroy(id)
        res.json({ "message": deleted ? "deleted" : "delete failed", })
    }
    static async update(req, res) {
        const id = req.params.id

        const { name, price } = req.body

        const product = await Product.findOne({
            where: [
                { "field": "id", "operator": "==", "value": id }
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
            fields:{
                "price": new_price
            },
            where: [
                { "field": "price", "operator": "<", "value": old_price }
            ]
        })
        res.json({ "message": updated ? "updated" : "update failed", })
    }

}