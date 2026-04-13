import FirebaseCore from '../firebase/FirebaseCore.js';

class ValidationDB {
    static async #checkExists(collection, field, data, exception, onError) {
        // exists return true
        let status = false;
        let query = FirebaseCore.admin.firestore().collection(collection).where(field, '==', data);
        if (exception) {
            query = query.where('id', '!=', exception);
        }
        await query.get().then((snapshoot) => {
            if (snapshoot.docs.length > 0) {
                status = true;
            }
        }).catch((error) => {
            console.error('ValidationDB: ', error);
            if (onError) onError(error);
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
    static async exists(collection, field, data, exception, onError) {
        const result = await this.#checkExists(collection, field, data, exception, onError);
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
    static async unique(collection, field, data, exception, onError) {
        const result = await this.#checkExists(collection, field, data, exception, onError);
        return !result;
    }
}

export default ValidationDB;
