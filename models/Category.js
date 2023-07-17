/* eslint-disable linebreak-style */
import Model, { DataTypes } from '../core/model/Model.js';

class Category extends Model {
}

Category.init({
    fields: {
        name: {
            type: DataTypes.string,
            nullable: false,
        },
    },
    collection: 'categories',
    hasRole: false,
});

export default Category;
