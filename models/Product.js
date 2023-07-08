import Model, { DataTypes } from "../core/model/Model.js";

class Product extends Model {

}

Product.init({
    fields: {
        name: {
            allowSearch: true,
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.NUMBER
        },
    },
    collection:"products",
    hasRole: true
})


export default Product