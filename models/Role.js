import Model, { DataTypes } from "../core/model/Model.js";

class Role extends Model {

}

Role.init({
    fields: {
        name: {
            type: DataTypes.STRING
        },
        permissions: {
            type: DataTypes.ARRAY
        },
    },
    collection:"roles",
})


export default Role