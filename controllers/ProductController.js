import { Operator } from '../core/model/Model.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ProductStoreRequest from '../requests/product/ProductStoreRequest.js';

export default class ProductController {
    static async fetch(req, res) {
        try {
            const products = await Product.findAll();
            return res.json({ message: 'get products', products });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    static async stored(req, res) {
        try {
            const request = new ProductStoreRequest(req);
            await request.check();
            if (request.isError) {
                return request.responseError(res);
            }
            const category = await Category.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: req.body.category_id },
                ],
            });
            const product = await Product.stored({
                name: req.body.name,
                price: req.body.price,
                category: category.info().ref,
            });
            return res.json({ message: product ? 'stored' : 'failed', product });
        } catch (error) {
            console.error(error);
        }
        return res.status(409).json({ message: 'Something wrong' });
    }

    // static async delete(req, res) {
    //     try {
    //         const id = req.params.id ?? '';
    //         const category = await Category.findOne({
    //             where: [
    //                 { field: 'id', operator: Operator.equal, value: id },
    //             ],
    //         });
    //         if (!category) return res.status(404).json({ message: 'category not found' });
    //         const deleted = await category.destroy();
    //         return res.json({ message: deleted ? 'deleted' : 'failed to delete' });
    //     } catch (error) {
    //         console.error(error);
    //     }
    //     return res.status(409).json({ message: 'Something wrong' });
    // }
}
