import Model, { DataTypes } from '../../model/Model.js';

class Role extends Model {

}

Role.init({
    fields: {
        name: {
            type: DataTypes.string,
        },
        permissions: {
            type: DataTypes.array,
        },
    },
    collection: 'roles',
});

export default Role;
