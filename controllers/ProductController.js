import { Operator } from '../core/model/Model.js';
import gateAccess from '../core/service/RolePermission/RolePermissionService.js';
import Product from '../models/Product.js';
import ProductRequest from '../requests/ProductRequest.js';

export default class ProductController {
    static async getByName(req, res) {
        const { name } = req.params;
        const product = await Product.findOne({
            where: [
                { field: 'name', operator: Operator.equal, value: name },
            ],
        });

        res.json({
            message: 'get single product',
            product,
            media: product?.getMedia(),
        });
    }

    static async fetch(req, res) {
        if (!gateAccess(req.user, ['product-access'])) {
            return res.json({ message: 'permission denied' });
        }

        const products = await Product.findAll({
            // orderBy: {
            //     "field": "updated_at",
            //     "sort": "desc"
            // }
            // where: [{ field: "name", operator: "like", value: "ona" }]
        });

        const productResource = [];

        products.forEach((e) => {
            productResource.push({
                id: e.id,
                name: e.name,
                price: e.price,
                created_at: e.created_at.toDate(),
                updated_at: e.updated_at.toDate(),
                medias: e.getMedia(),
            });
        });

        return res.json({
            message: 'get products',
            products: productResource,
        });
    }

    static async search(req, res) {
        const { name } = req.params;

        const products = await Product.findAll({
            where: [{ field: 'name', operator: Operator.like, value: name }],
        });

        const productResource = [];

        products.forEach((e) => {
            productResource.push({
                ...e,
                medias: e.getMedia(),
            });
        });

        res.json({
            message: 'search products',
            products: productResource,
        });
    }

    static async stored(req, res) {
        const { name, price } = req.body;

        const request = new ProductRequest(req);
        await request.check();
        if (request.isError) {
            return request.responseError(res);
        }

        if (!name || !price) { return res.status(422).json({ message: 'name and price required' }); }

        const data = {
            name,
            price,
        };

        const product = await Product.stored(data);

        if (!product) return res.json({ message: 'failed to stored' });

        return res.json({
            message: 'store product',
            user: product,
        });
    }

    static async delete(req, res) {
        const { id } = req.params;
        const deleted = await Product.destroy({
            where: [
                { field: 'id', operator: Operator.equal, value: id },
            ],
        });
        res.json({ message: deleted ? 'deleted' : 'delete failed' });
    }

    static async update(req, res) {
        const { id } = req.params;

        const { name, price } = req.body;

        const product = await Product.findOne({
            where: [
                { field: 'id', operator: Operator.equal, value: id },
            ],
        });
        if (!product) return res.json({ message: 'not found' });

        const updated = await product.update({
            name,
            price,
        });
        return res.json({ message: updated ? 'updated' : 'update failed' });
    }

    static async updateMany(req, res) {
        // eslint-disable-next-line camelcase
        const { new_price, old_price } = req.body;

        const updated = await Product.update({
            data: {
                // eslint-disable-next-line camelcase
                price: new_price,
            },
            where: [
                // eslint-disable-next-line camelcase
                { field: 'price', operator: Operator.lt, value: old_price },
            ],
        });
        res.json({ message: updated ? 'updated' : 'update failed' });
    }

    static async addImage(req, res) {
        const { id } = req.params;
        const { image, name } = req.body;

        const product = await Product.findOne({
            where: [{ field: 'id', operator: Operator.equal, value: id }],
        });

        if (!product) return res.json({ message: 'product not found' });

        const media = await product.saveMedia(image, name);

        return res.json({ message: media ? 'updated' : 'failed', media });
    }

    static async destroyImage(req, res) {
        const { id } = req.params;
        const { name } = req.params;

        const product = await Product.findOne({
            where: [{ field: 'id', operator: Operator.equal, value: id }],
        });

        if (!product) return res.json({ message: 'product not found' });

        const media = await product.destroyMedia(name);

        return res.json({ message: media ? 'image deleted' : 'failed delete' });
    }

    static async removeRole(req, res) {
        const { id } = req.params;

        const product = await Product.findOne({
            where: [{ field: 'id', operator: Operator.equal, value: id }],
        });

        if (!product) return res.json({ message: 'product not found' });

        const removed = await product.removeRole();

        return res.json({ message: removed ? 'role removed' : 'failed to remove role' });
    }
}
