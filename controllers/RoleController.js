import Role from '../models/Role.js';

export default class RoleController {
    static async fetch(req, res) {
        const roles = await Role.findAll();
        // const productResource = []
        // products.forEach((e) => {
        //     productResource.push({
        //         "id": e.id,
        //         "name": e.name,
        //         "price": e.price,
        //         "medias": e.getMedia()
        //     })
        // })

        res.json({
            message: 'get roles',
            roles,
        });
    }
}
