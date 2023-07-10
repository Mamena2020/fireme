
/**
 * Checking user that has particular permissions
 * @param {*} user user instance
 * @param {*} permissions ["product-access","product-stored"]
 * @returns 
 */
const gateAccess = function (user, permissions = []) {

    try {
        if (!Array.isArray(permissions))
            throw "permissions must be an array"

        const role = user.getRole()
        if (!role) throw "user does't have role"

        const permissionNames = role.permissions

        if (!permissions)
            return false
        let countValid = 0
        for (let permission of permissionNames) {
            if (permissions.includes(permission)) {
                countValid++
            }
        }
        if (countValid === permissions.length)
            return true

    } catch (error) {
        console.error("Error: ", error)
    }
    return false
}

export default gateAccess
