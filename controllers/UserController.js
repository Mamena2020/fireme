import User from '../models/User.js';
import UserResource from '../resources/UserResource.js';

export default class UserController {
    static async uploadAvatar(req, res) {
        let media;
        try {
            const { avatar } = req.body;
            const currentUser = req.user;
            if (!currentUser) return res.json({ message: 'user not found' });
            if (!avatar || !avatar.name) return res.json({ message: 'file not found' });
            media = await currentUser.saveMedia(avatar, 'avatar');
        } catch (error) {
            console.error(error);
        }
        return res.json({ message: media ? 'updated' : 'failed', media });
    }

    static async removeAvatar(req, res) {
        const currentUser = req.user;
        if (!currentUser) return res.json({ message: 'user not found' });
        const media = await currentUser.destroyMedia('avatar');
        return res.json({ message: media ? 'avatar removed' : 'failed to remove' });
    }

    static async users(req, res) {
        try {
            const users = await User.findAll();
            const userResources = new UserResource().collection(users);
            return res.json({ message: 'get users', users: userResources });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }

    static async user(req, res) {
        try {
            return res.json({ message: 'get user', user: req.user, media: req.user.getMedia() });
        } catch (error) {
            console.error(error);
        }
        return res.status(409);
    }
}
