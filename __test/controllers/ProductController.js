import { Operator } from '../../core/model/Model.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ProductStoreRequest from '../requests/product/ProductStoreRequest.js';
import ProductUpdateRequest from '../requests/product/ProductUpdateRequest.js';

export default class ProductController {
     /**
     * fetch
     *
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async fetch(req, res) {
        try {
            const products = await Product.findAll();
            // console.info(products);
            return res.json({ message: 'get products', products });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    /**
     * stored data
     *
     * required body {name, price, category_id}
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
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

    /**
     * update
     *
     * required params id
     * required body {name, category_id}
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async update(req, res) {
        try {
            const id = req.params.id ?? '';
            req.body.id = id; // use in ProductUpdateRequest
            const request = new ProductUpdateRequest(req);
            await request.check();
            if (request.isError) {
                return request.responseError(res);
            }
            const category = await Category.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: req.body.category_id },
                ],
            });

            const product = await Product.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: id },
                ],
            });
            if (!product) throw Error('product not found');
            const updated = await product.update(
                {
                    name: req.body.name,
                    category: category.info().ref,
                },
            );

            return res.json({ message: updated ? 'updated' : 'failed to update', product });
        } catch (error) {
            console.error(error);
        }
        return res.status(409).json({ message: 'Something wrong' });
    }

    /**
     * delete
     *
     * required params id
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async delete(req, res) {
        try {
            const id = req.params.id ?? '';
            const product = await Product.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: id },
                ],
            });
            if (!product) return res.status(404).json({ message: 'product not found' });
            const deleted = await product.destroy();
            return res.json({ message: deleted ? 'deleted' : 'failed to delete' });
        } catch (error) {
            console.error(error);
        }
        return res.status(409).json({ message: 'Something wrong' });
    }
}
