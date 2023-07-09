import Model, { DataTypes } from "../core/model/Model.js";

class User extends Model {

}

User.init({
    fields: {
        name: {
            type: DataTypes.string
        },
        email: {
            type: DataTypes.string
        },
        password: {
            type: DataTypes.string
        },
        refresh_token: {
            type: DataTypes.string,
            nullable: true
        },
    },
    collection:"users",
    hasRole: true
})


export default User