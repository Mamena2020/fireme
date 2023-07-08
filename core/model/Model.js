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
})

const Operator = Object.freeze({
    "equal": "==",
    "notEqual": "!=",
    "lt": "<",
    "lte": "<=",
    "gt": ">",
    "gte": ">=",
    "arrayContains": "array-contains",
    "in": "in",
    "arrayContainsAny": "array-contains-any",
    "startsWith": "startsWith",
    "endsWith": "endsWith",
    "contains": "contains",
});

const mediaCollection = "medias"
const roleCollection = "roles"
const permissionCollection = "permissions"
const hasRoleCollection = "has_roles"


class Model {

    fields = {};
    collection = ""
    hasRole = false

    static init({ fields = {
        Object: {
            type: DataTypes,
            timeStamp: false,
            allowSearch: false,
            reference: ""
        }
    }, collection = "", hasRole = false }) {
        this.fields = fields;
        this.collection = collection
        this.hasRole = hasRole
    }


    static #instance(doc, medias = [], role, collection) {
        return {
            destroy: async function () {
                return await Model.#destroy(this)
            },
            update: async function (data) {
                return await Model.#update(this, data)
            },
            saveMedia: async function (file, name) {
                return await Model.#saveMedia(this, file, name)
            },
            getMedia: function (name) {
                return Model.#getMedia(this, name)
            },
            destroyMedia: function (name) {
                return Model.#destroyMedia(this, name)
            },
            setRole: async function (name) {
                return await Model.#setRole(this, name)
            },
            getRole: function () {
                return Model.#getRole(this)
            },
            removeRole: async function () {
                return await Model.#removeRole(this)
            },
            _info: function () {
                return {
                    id: doc.id,
                    ref: doc.ref,
                    doc: doc,
                    collection: collection,
                    medias: medias,
                    role: role,
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
        var list = []
        try {
            const collection = this.collection
            var query = FirebaseCore.admin.firestore().collection(collection)
            if (where && where.length > 0) {
                where.forEach(({ field, operator, value, and }) => {
                    var valueLike
                    if (operator.toLowerCase() === "like") {
                        valueLike = value + '\uf8ff'
                    }
                    if (and == undefined || and == true) {
                        if (valueLike) {
                            // console.log(valueLike)
                            query = query.where(field, Operator.gte, value).where(field, Operator.lt, valueLike)
                        }
                        else {
                            query = query.where(field, operator, value)
                        }
                    }
                    else {
                        if (valueLike) {
                            query = query.where(field, Operator.gte, value).where(field, Operator.lt, valueLike)
                        }
                        else {
                            query = query.orWhere(field, operator, value)
                        }
                    }
                })
            }
            if (typeof limit === "number" && limit > 0) {
                query = query.limit(limit)
            }

            list = await Model.#batchFetch(query, collection, this.hasRole)

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
    static async findOne({ where = [] } = {}) {

        try {
            const collection = this.collection
            var query = FirebaseCore.admin.firestore().collection(collection)
            if (where && where.length > 0) {
                where.forEach(({ field, operator, value, and }) => {
                    if (and == undefined || and == true) {
                        query = query.where(field, operator, value)
                    }
                    else {
                        query = query.orWhere(field, operator, value)
                    }
                })
            }
            query = query.limit(1)
            // const snapshot = await query.get();
            const list = await Model.#batchFetch(query, collection, this.hasRole)

            return list[0] ?? null
        } catch (error) {
            console.log(error)
        }
    }

    static async #batchFetch(query = FirebaseCore.admin.firestore().collection(), collection, hasRole) {
        const list = []

        await query.get()
            .then(async (parentSnapshot) => {
                // create array ref parent
                var parentRefs = parentSnapshot.docs.map((parentDoc) => parentDoc.ref)
                // init array promise for batch read
                var batchGetPromises = []

                // fetch role data first     
                if (hasRole) {
                    var rolesBatchPromise = FirebaseCore.admin.firestore().collection(roleCollection).get()
                    batchGetPromises.push(Promise.all([rolesBatchPromise]))
                }

                // create batch read for every ref parent
                parentRefs.forEach((parentRef, index) => {
                    // media
                    var media = FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", Operator.equal, parentRef)
                    var mediaBatchPromise = media.get()
                    // has role
                    if (hasRole) {
                        var hasRoleBatchPromise = FirebaseCore.admin.firestore().collection(hasRoleCollection)
                            .where("ref", Operator.equal, parentRef)
                            .get()
                        batchGetPromises.push(Promise.all([mediaBatchPromise, hasRoleBatchPromise]))
                    }
                    else {
                        batchGetPromises.push(Promise.all([mediaBatchPromise]))
                    }
                })
                // run batch read at same time
                return await Promise.all(batchGetPromises).then((batchResults) => {

                    if (hasRole) {
                        // console.log("has role")
                        var roles = []
                        for (var i = 0; i < batchResults.length; i++) {
                            if (i == 0) {
                                // store roles data
                                var [roleSnapshot] = batchResults[i]
                                roleSnapshot.docs.forEach((doc) => {
                                    roles.push({
                                        ref: doc.ref,
                                        ...doc.data()
                                    })
                                })
                            }
                            if (i > 0) {
                                var [mediaSnapshot, hasRoleSnapshot] = batchResults[i]
                                var parentDoc = parentSnapshot.docs[i - 1]; // -1 -> i==0 used for roles
                                var medias = []
                                mediaSnapshot.forEach((mediaDoc) => {
                                    if (mediaDoc) {
                                        medias.push(mediaDoc.data())
                                    }
                                })
                                // has role
                                var hasRoles = []
                                hasRoleSnapshot.forEach((hasRoleDoc) => {
                                    if (hasRoleDoc.data() && hasRoleDoc.data()["role_ref"]) {
                                        var role = roles.filter((item) => item.id === hasRoleDoc.data()["role_ref"].id);
                                        if (role) {
                                            hasRoles.push(role[0])
                                        }
                                    }
                                })
                                list.push(
                                    Model.#instance(parentDoc, medias, hasRoles[0] ?? null, collection)
                                )
                            }
                        }
                    }
                    else {
                        // console.log("has't role")
                        batchResults.forEach(([mediaSnapshot], index) => {
                            var parentDoc = parentSnapshot.docs[index];
                            var medias = []
                            mediaSnapshot.forEach((mediaDoc) => {
                                if (mediaDoc) {
                                    medias.push(mediaDoc.data())
                                }
                            })

                            list.push(
                                Model.#instance(parentDoc, medias, null, collection)
                            )
                        })
                    }
                })
                    .catch((error) => {
                        console.error("Error parent & media", error);
                    })
            })
            .catch((error) => {
                console.error("Error parent: ", error);
            })
        return list
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
            await docRef.set(dataToStore)
            const snapshot = await docRef.get()

            return Model.#instance(snapshot, [], this.collection)
        } catch (error) {
            console.error(error)
        }
        return null
    }

    /**
     * 
     * @param {list} array of object 
     * @returns object of data
     */
    static async bulkStored({ list = [] }) {
        var status = false
        try {
            if (list == undefined) throw 'invalid list'

            const collectionRef = FirebaseCore.admin.firestore().collection(this.collection)
            var batch = FirebaseCore.admin.firestore().batch();

            list.forEach((data) => {
                var docRef = collectionRef.doc()
                const dataToStore = {
                    id: docRef.id,
                    ...data,
                }
                batch.set(docRef, dataToStore)
            })
            await batch.commit()
                .then(() => {
                    status = true
                })
                .catch((error) => {
                    console.error("Error: ", error)
                })
        } catch (error) {
            console.error(error)
        }
        return status
    }

    /**
     * 
     * @param {intance} instance of model 
     * @returns boolean
     */
    static async #destroy(instance) {
        var status = false
        try {
            const info = instance._info()
            const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id)

            // delete all medias
            if (info.medias.length > 0) {
                const paths = []
                for (var media of info.medias) {
                    paths.push(media.path)
                }
                await FirebaseCore.deleteMedias(paths).finally(async () => {
                    await this.#destroyMedias(docRef)
                })
            }
            // delete roles
            if (info.role) {
                await this.#removeRole(instance)
            }

            await docRef.delete()
                .then(async () => {
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
            const instance = await this.findOne({
                where: [{ field: 'id', operator: Operator.equal, value: id, }]
            })
            if (!instance) throw 'not found'
            status = await instance.destroy()
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
            const info = instance._info()
            // const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id)
            await info.ref.update(newData)
                .then(() => {
                    status = true
                })

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
            if (snapshot.empty || !snapshot) return false

            var batch = FirebaseCore.admin.firestore().batch();
            snapshot.forEach((doc) => {
                batch.update(doc.ref, fields);
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

    static async #saveMedia(instance, file, name = "") {

        if (!file || !file.extension || !name || !instance) {
            console.log("Save media failed: require all params, Please check file or name")
            return
        }

        const info = instance._info()

        var docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id);

        const oldMediaDoc = await FirebaseCore.admin.firestore().collection(mediaCollection)
            .where("ref", Operator.equal, docRef)
            .where("name", Operator.equal, name)
            .get()

        const media = await FirebaseCore.saveMedia(file)

        if (!media) return
        var mediaId
        var newData = {
            "name": name,
            "url": media.url,
            "path": media.path,
            "ref": docRef
        }
        const newMedias = info.medias ?? []

        // create new   
        if (oldMediaDoc.empty) {
            const mediaRef = FirebaseCore.admin.firestore().collection(mediaCollection).doc()
            mediaId = mediaRef.id
            const dataToStored = {
                id: mediaId,
                ...newData,
            }
            await mediaRef.set(dataToStored)
            newMedias.push(dataToStored)
            Object.assign(instance, this.#instance(info.doc, newMedias, info.role, info.collection))
        }
        else {
            // remove old media
            await FirebaseCore.deleteMedia(oldMediaDoc.docs[0].data()["path"])
            // update 
            await oldMediaDoc.docs[0].ref.update(newData)
            mediaId = oldMediaDoc.docs[0].ref.id

            info.medias = info.medias.map(_media => {
                if (_media.name === name) {
                    return {
                        id: mediaId,
                        ...newData,
                    }
                }
                return _media;
            });
            Object.assign(instance, this.#instance(info.doc, info.medias, info.role, info.collection))
        }
        return {
            "id": mediaId,
            "name": name,
            "url": media.url,
            "path": media.path,
        }
    }

    static #getMedia(instance, name) {
        if (!instance) return []
        const info = instance._info()
        const medias = [];
        for (var media of info.medias) {
            var mediaData = {
                "id": media.id,
                "name": media.name,
                "url": media.url,
                "path": media.path,
            }
            if (name == media.name) {
                return mediaData
            }
            medias.push(mediaData)
        }
        if (name) return null
        return medias
    }


    static async #destroyMedia(instance, name) {

        var status = false
        try {
            const info = instance._info()
            var media
            for (var _media of info.medias) {
                if (name == _media.name) {
                    media = _media
                    break;
                }
            }
            if (media == undefined) throw 'media not found'
            // remove old media
            await FirebaseCore.deleteMedia(media.path).finally(async () => {
                const mediaRef = FirebaseCore.admin.firestore().collection(mediaCollection).doc(media.id);
                const docSnapshot = await mediaRef.get();
                if (docSnapshot.exists) {
                    await mediaRef.delete().then(() => {
                        const newMedias = info.medias.filter(_media => _media.name !== name)
                        Object.assign(instance, this.#instance(info.doc, newMedias, info.role, info.collection))
                        status = true
                    });
                }
            })
        } catch (error) {
            console.error("error: ", error);
        }
        return status
    }

    static async #destroyMedias(instanceRef) {
        try {
            await FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", Operator.equal, instanceRef).get()
                .then((snapshot) => {
                    // collect media doc ref
                    var batch = FirebaseCore.admin.firestore().batch();
                    snapshot.forEach((doc) => {
                        batch.delete(doc.ref)
                    })
                    // run batch 
                    return batch.commit();
                })
                .then(() => {
                    // console.log("deleted");
                })
                .catch((error) => {
                    console.error("Error: ", error);
                });

        } catch (error) {
            console.error("error: ", error)
        }
    }

    static async #setRole(instance, name) {
        var status = false
        try {
            await FirebaseCore.admin.firestore().collection(roleCollection).where("name", Operator.equal, name).get()
                .then(async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const info = instance._info()
                        const oldHasRoleDoc = await FirebaseCore.admin.firestore().collection(hasRoleCollection)
                            .where("ref", Operator.equal, info.ref)
                            .where("role_ref", Operator.equal, querySnapshot.docs[0].ref)
                            .get()
                        const newData = {
                            "ref": info.ref,
                            "role_ref": querySnapshot.docs[0].ref
                        }
                        if (oldHasRoleDoc.empty) {
                            // create new
                            const hasRoleRef = FirebaseCore.admin.firestore().collection(hasRoleCollection).doc()
                            await hasRoleRef.set({
                                "id": hasRoleRef.id,
                                ...newData
                            })
                        }
                        else {
                            // update
                            await oldHasRoleDoc.docs[0].ref.update(newData)
                            mediaId = oldHasRoleDoc.docs[0].ref.id
                        }

                        // update role to instance
                        const roleData = {
                            ref: querySnapshot.docs[0].ref,
                            ...querySnapshot.docs[0].data()
                        }
                        Object.assign(instance, this.#instance(info.doc, info.medias, roleData, info.collection))
                        status = true
                    }
                })
                .catch((error) => {
                    console.error("Error: ", error);
                });

        } catch (error) {
            console.error("error: ", error)
        }
        return status
    }

    static #getRole(instance) {
        if (!instance) return null
        const info = instance._info()
        if (!info.role) return null

        return {
            "id": info.role.id,
            "name": info.role.name,
            "permissions": info.role.permissions
        }
    }
    static async #removeRole(instance) {
        var status = false
        try {
            if (!instance) throw 'no instance'
            const info = instance._info()
            if (!info.role) throw 'no role'

            await FirebaseCore.admin.firestore().collection(hasRoleCollection)
                .where("ref", Operator.equal, info.ref)
                .where("role_ref", Operator.equal, info.role.ref).get()
                .then((snapshot) => {
                    // collect media doc ref
                    var batch = FirebaseCore.admin.firestore().batch();
                    snapshot.forEach((doc) => {
                        batch.delete(doc.ref)
                    })
                    // run batch 
                    return batch.commit();
                })
                .then(() => {
                    Object.assign(instance, this.#instance(info.doc, info.medias, null, info.collection))
                    status = true;
                })
                .catch((error) => {
                    console.error("Error: ", error);
                });
        } catch (error) {
            console.error("Error: ", error);
        }
        return status

    }

}

export default Model
export {
    DataTypes, Operator
}