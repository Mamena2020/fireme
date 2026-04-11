/**
 * Checking user that has particular permissions
 * @param {*} user user instance
 * @param {*} permissions ["product-access","product-stored"]
 * @returns boolean
 */
const gateAccess = (user, permissions = []) => {
    try {
        if (!Array.isArray(permissions)) throw Error('permissions must be an array');

        const role = user.getRole();
        if (!role) throw Error("user doesn't have role");

        // super role always has full access
        if (role.name === 'super') return true;

        const permissionNames = role.permissions;

        if (!permissionNames || permissionNames.length === 0) return false;
        let countValid = 0;
        permissionNames.forEach((permission) => {
            if (permissions.includes(permission)) {
                countValid += 1;
            }
        });
        if (countValid === permissions.length) return true;
    } catch (error) {
        console.error('Error: ', error);
    }
    return false;
};

export default gateAccess;
