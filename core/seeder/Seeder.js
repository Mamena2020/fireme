import Permission from "../../models/Permission.js"
import Role from "../../models/Role.js"
import User from "../../models/User.js"
import bcrypt from 'bcrypt'

const permissions = [
    "user-create",
    "user-stored",
    "user-edit",
    "user-update",
    "user-delete",
    "user-search"
]


/**
 * running seeder code in here
 * 
 * Cli command: npx nodemi seed:run
 * @returns 
 */
const Seeder = async () => {
    console.log("run seeder")
    const existPermission = await Permission.findOne()
    if (!existPermission) {
        console.log("permission")
        const permissionData = []
        permissions.forEach((e) => {
            permissionData.push({ "name": e })
        })
        console.log("permissionData: ",permissionData)
        await Permission.bulkStored({
            list: permissionData
        })
    }

    const existRole = await Role.findOne()
    if (!existRole) {
        await Role.bulkStored({
            list: [
                {
                    "name": "super",
                    "permissions": []
                },
                {
                    "name": "admin",
                    "permissions": permissions
                },
            ]
        })
    }

    const existUser = await User.findOne()
    if (!existUser) {
        const salt = await bcrypt.genSalt()
        const hashPassword = await bcrypt.hash("super", salt)
        const user = await User.stored({
            "email": "super@gmail.com",
            "name": "super user",
            "password": hashPassword,
        })
        await user.setRole("super")
    }

}

export default Seeder