import Model, { DataTypes } from '../core/model/Model.js';

class Product extends Model {

}

Product.init({
    fields: {
        name: {
            type: DataTypes.string,
        },
        price: {
            type: DataTypes.number,
        },
    },
    collection: 'products',
    hasRole: false,
});

export default Product;
