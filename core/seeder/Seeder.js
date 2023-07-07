import Permission from "../../models/Permission.js"
import Role from "../../models/Role.js"

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

    const existPermission = await Permission.findOne()
    if (!existPermission) {
        const permissionData = []
        permissions.forEach((e) => {
            permissionData.push({ "name": e })
        })
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

}

export default Seeder