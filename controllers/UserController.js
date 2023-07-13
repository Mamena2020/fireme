import { Operator } from '../core/model/Model.js';
import User from '../models/User.js';
import UserResource from '../resources/UserResource.js';

export default class UserController {
    static async uploadAvatar(req, res) {
        let media;
        try {
            const { id } = req.params;
            const { avatar } = req.body;
            const product = await User.findOne({
                where: [{ field: 'id', operator: Operator.equal, value: id }],
            });
            if (!product) return res.json({ message: 'product not found' });
            media = await product.saveMedia(avatar, 'avatar');
        } catch (error) {
            console.error(error);
        }
        return res.json({ message: media ? 'updated' : 'failed', media });
    }

    static async user(req, res) {
        try {
            const users = await User.findAll();
            const userResources = new UserResource().collection(users);
            return res.json({ message: 'get users', users: userResources });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }
}
