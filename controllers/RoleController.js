import Role from '../core/service/RolePermission/Role.js';

export default class RoleController {
    static async fetch(req, res) {
        const roles = await Role.findAll();

        res.json({
            message: 'get roles',
            roles,
        });
    }
}
