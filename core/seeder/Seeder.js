import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import Permission from '../service/RolePermission/Permission.js';
import Role from '../service/RolePermission/Role.js';

const permissions = [
    'user-access',
    'user-create',
    'user-stored',
    'user-edit',
    'user-update',
    'user-delete',
    'user-search',
    'product-access',
    'product-create',
    'product-stored',
    'product-edit',
    'product-update',
    'product-delete',
    'product-search',
];

/**
 * running seeder code in here
 *
 * Cli command: npx nodemi seed:run
 */
const Seeder = async () => {
    console.info('run seeder');
    const existPermission = await Permission.findOne();
    if (!existPermission) {
        const permissionData = [];
        permissions.forEach((e) => {
            permissionData.push({ name: e });
        });

        await Permission.bulkStored(permissionData);
    }

    const existRole = await Role.findOne();
    if (!existRole) {
        await Role.bulkStored([
            {
                name: 'super',
                permissions: [],
            },
            {
                name: 'admin',
                permissions,
            },
        ]);
    }

    const existUser = await User.findOne();
    if (!existUser) {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash('super', salt);
        const user = await User.stored({
            email: 'super@gmail.com',
            name: 'super user',
            password: hashPassword,
        });
        await user.setRole('super');
    }
};

export default Seeder;
