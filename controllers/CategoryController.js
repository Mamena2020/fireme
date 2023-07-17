import { Operator } from '../core/model/Model.js';
import Category from '../models/Category.js';
import CategoryStoreRequest from '../requests/category/CategoryStoreRequest.js';

export default class CategoryController {
    static async fetch(req, res) {
        try {
            const categories = await Category.findAll();
            return res.json({ message: 'get categories', categories });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

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
