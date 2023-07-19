import { Operator } from '../../core/model/Model.js';
import Category from '../models/Category.js';
import CategoryStoreRequest from '../requests/category/CategoryStoreRequest.js';
import CategoryUpdateRequest from '../requests/category/CategoryUpdateRequest.js';

export default class CategoryController {
    /**
     * fetch
     *
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async fetch(req, res) {
        try {
            const categories = await Category.findAll();
            return res.json({ message: 'get categories', categories });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    /**
     * stored
     *
     * required body {name}
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async stored(req, res) {
        try {
            const request = new CategoryStoreRequest(req);
            await request.check();
            if (request.isError) {
                return request.responseError(res);
            }
            const category = await Category.stored(req.body);
            return res.json({ message: category ? 'stored' : 'failed', category });
        } catch (error) {
            console.error(error);
        }
        return res.status(409).json({ message: 'Something wrong' });
    }

    /**
     * update
     *
     * required params id
     * required body {name}
     * @param {*} req express req
     * @param {*} res express res
     * @returns
     */
    static async update(req, res) {
        try {
            const id = req.params.id ?? '';
            req.body.id = id; // use id in CategoryUpdateRequest
            const request = new CategoryUpdateRequest(req);
            await request.check();
            if (request.isError) {
                return request.responseError(res);
            }

            const category = await Category.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: id },
                ],
            });

            if (!category) throw Error('category not found');

            const updated = await category.update({
                name: req.body.name,
            });

            return res.json({ message: updated ? 'updated' : 'failed to update', category });
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
            const category = await Category.findOne({
                where: [
                    { field: 'id', operator: Operator.equal, value: id },
                ],
            });
            if (!category) return res.status(404).json({ message: 'category not found' });
            const deleted = await category.destroy();
            return res.json({ message: deleted ? 'deleted' : 'failed to delete' });
        } catch (error) {
            console.error(error);
        }
        return res.status(409).json({ message: 'Something wrong' });
    }
}
