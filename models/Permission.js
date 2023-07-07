import Model, { DataTypes } from "../core/model/Model.js";

class Permission extends Model {

}

Permission.init({
    fields: {
        name: {
            type: DataTypes.STRING
        },
    },
    collection: "permissions",
})


export default Permission