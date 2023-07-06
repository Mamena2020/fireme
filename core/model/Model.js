import FirebaseCore from "../firebase/FirebaseCore.js";


const DataTypes = Object.freeze({
    "STRING": "STRING",
    "NUMBER": "NUMBER",
    "BOOLEAN": "BOOLEAN",
    "DATE": "DATE",
    "ARRAY": "ARRAY",
    "MAP": "MAP",
    "REFERENCE": "REFERENCE",
    "LOCATION": "LOCATION",
});



class Model {

    fields = {};
    collection = ""
    hasMedia = false

    static init({ fields = {
        Object: {
            type: DataTypes,
            timeStamp: false,
            allowSearch: false,
            reference: ""
        }
    }, collection = "", hasMedia = false }) {

        this.fields = fields;
        this.collection = collection
        this.hasMedia = hasMedia
    }


    static #instance(doc, collection) {
        return {
            destroy: async function () {
                return await Model.#destroy(this)
            },
            update: async function (data) {
                return await Model.#update(this, data)
            },
            __info: function () {
                return {
                    id: doc.id,
                    collection: collection,
                }
            },
            ...doc.data()
        }
    }

    /**
     * get list of data
     * @param { where} : [  { field: 'age', operator: '>=', value: 18, and = true},  { field: 'city', operator: '==', value: "Timika", and = true },]
     * @param {limit} : numeric
     * @returns list || array
     */
    static async findAll({ where = [], limit = 0 } = {}) {
        const list = [];
        try {
            var query = FirebaseCore.admin.firestore().collection(this.collection)

            if (where && where.length > 0) {
                where.forEach(({ field, operator, value, and }) => {
                    var valueLike
                    if (operator.toLowerCase() === "like") {
                        valueLike = value + '\uf8ff'
                    }
                    if (and == undefined || and == true) {
                        if (valueLike) {
                            console.log(valueLike)
                            query = query.where(field, ">=", value).where(field, "<", valueLike)
                        }
                        else {
                            query = query.where(field, operator, value)
                        }
                    }
                    else {
                        if (valueLike) {
                            query = query.where(field, ">=", value).where(field, "<", valueLike)
                        }
                        else {
                            query = query.orWhere(field, operator, value)
                        }
                    }
                });
            }
            if (typeof limit === "number" && limit > 0) {
                query = query.limit(limit)
            }

            const snapshot = await query.get();

            snapshot.forEach((doc) => {
                list.push(
                    Model.#instance(doc, this.collection)
                );
            });
        } catch (error) {
            console.log(error)
        }
        return list
    }

    /**
    * get single data
    * @param { where} : [  { field: 'age', operator: '>=', value: 18, and = true},  { field: 'city', operator: '==', value: "Timika", and = true },]
    * @returns object | null
    */
    static async findOne({ where = [] }) {

        try {
            var query = FirebaseCore.admin.firestore().collection(this.collection)
            if (where.length > 0) {
                where.forEach(({ field, operator, value, and }) => {
                    if (and == undefined || and == true) {
                        query = query.where(field, operator, value)
                    }
                    else {
                        query = query.orWhere(field, operator, value)
                    }
                });
            }
            query = query.limit(1)
            const snapshot = await query.get();
            const list = [];
            snapshot.forEach((doc) => {
                list.push(Model.#instance(doc, this.collection));
            });

            return list[0] ?? null
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * 
     * @param {data} object of data 
     * @returns object of data
     */
    static async stored({ data = {} }) {
        try {
            const docRef = FirebaseCore.admin.firestore().collection(this.collection).doc();
            const dataToStore = {
                ...data,
                id: docRef.id
            }
            await docRef.set(dataToStore);
            const snapshot = await docRef.get()
            return Model.#instance(snapshot, this.collection)
        } catch (error) {
            console.error(error)
        }
        return null
    }

    /**
     * 
     * @param {intance} instance of model 
     * @returns boolean
     */
    static async #destroy(instance) {
        var status = false
        try {
            const info = instance.__info()
            const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id)

            await docRef.delete()
                .then(() => {
                    // console.log("deleted");
                    status = true
                })
        } catch (error) {
            console.log(error)
        }
        return status
    }

    /**
     * 
     * @param {*} id 
     * @returns boolean 
     */
    static async destroy(id) {
        var status = false
        try {
            const docRef = FirebaseCore.admin.firestore().collection(this.collection).doc(id);
            const docSnapshot = await docRef.get();
            if (docSnapshot.exists) {
                await docRef.delete();
                status = true
            } else {
                console.log("Not found");
            }
        } catch (error) {
            console.error("error:", error);
        }
        return status
    }


    /**
     * 
     * @param {instance} instance of model  
     * @returns boolean
     */
    static async #update(instance, newData) {

        var status = false
        try {
            if (!newData) throw 'invalid new data'

            const info = instance.__info()
            const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id)
            await docRef.update(newData)
                .then(() => {
                    // console.log("updated");
                    status = true
                })
                .catch((error) => {
                    // console.error("Error update", error);
                    reject(false)
                });
        } catch (error) {
            console.log(error)
        }
        return status
    }

    static async update({ fields = {}, where = [] }) {

        var status = false
        try {
            var query = FirebaseCore.admin.firestore().collection(this.collection)
            if (where.length > 0) {
                where.forEach(({ field, operator, value, and }) => {
                    if (and == undefined || and == true) {
                        query = query.where(field, operator, value)
                    }
                    else {
                        query = query.orWhere(field, operator, value)
                    }
                });
            }

            const snapshot = await query.get();
            if (snapshot.docs.length == 0 || !snapshot) return false

            var batch = FirebaseCore.admin.firestore().batch();
            snapshot.forEach((doc) => {
                var docRef = FirebaseCore.admin.firestore().collection(this.collection).doc(doc.id);
                batch.update(docRef, fields);
            })

            await batch.commit()
                .then(() => {
                    console.log("updated");
                    status = true
                })
                .catch((error) => {
                    console.error("Error: ", error);
                });

        } catch (error) {
            console.log(error)
        }
        return status
    }

    static async #saveMedia(instance, name = "") {

    }

    static async getMedia({ name = "" }) {

    }
}

export default Model
export {
    DataTypes
}