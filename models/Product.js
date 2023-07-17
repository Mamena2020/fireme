/* eslint-disable linebreak-style */
import Model, { DataTypes } from '../core/model/Model.js';

class Product extends Model {
}

Product.init({
    fields: {
        name: {
            type: DataTypes.string,
            nullable: false,
        },
        price: {
            type: DataTypes.number,
            nullable: false,
        },
        category: {
            type: DataTypes.reference,
            nullable: false,
        },
    },
    collection: 'products',
    hasRole: false,
});

export default Product;
