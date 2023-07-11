import Model, { DataTypes } from '../../model/Model.js';

class Permission extends Model {
}

Permission.init({
    fields: {
        name: {
            type: DataTypes.string,
        },
    },
    collection: 'permissions',
});

export default Permission;
