import FirebaseCore from '../firebase/FirebaseCore.js';

class ValidationDB {
    static async #checkExists(collection, field, data, exception) {
        // exists return true
        let status = false;
        let query = FirebaseCore.admin.firestore().collection(collection).where(field, '==', data);
        if (exception) {
            query = query.where('id', '!=', exception);
        }
        await query.get().then((snapshoot) => {
            if (snapshoot.docs.length > 0) {
                status = true;
                console.info('status', status);
            }
        }).catch((error) => {
            console.error(error);
        });
        return status;
    }

    /**
     * check if data is exists in db
     * @param {*} collection collection name
     * @param {*} field fields
     * @param {*} data data to check
     * @param {*} exception exception data id
     * @returns boolean
     */
    static async exists(collection, field, data, exception) {
        const result = await this.#checkExists(collection, field, data, exception);
        return result;
    }

    /**
     * check if data is unique and never exists in db
     * @param {*} collection collection name
     * @param {*} field fields
     * @param {*} data data to check
     * @param {*} exception exception data id
     * @returns boolean
     */
    static async unique(collection, field, data, exception) {
        const result = await this.#checkExists(collection, field, data, exception);
        return !result;
    }
}

export default ValidationDB;
