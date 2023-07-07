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

const mediaCollection = "medias"
const roleCollection = "roles"
const permissionCollection = "permissions"

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


    static #instance(doc, medias = [], roles, collection) {
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
            _info: function () {
                return {
                    id: doc.id,
                    collection: collection,
                    medias: medias,
                    roles: roles,
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
                })
            }
            if (typeof limit === "number" && limit > 0) {
                query = query.limit(limit)
            }
            list = await Model.#batchFetch(query, collection)
            // const snapshot = await query.get();
            // for (var doc of snapshot.docs) {
            //     var medias = []
            //     FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", doc.ref).get()
            //         .then((mediaSnapshot) => {
            //             for (var mediaDoc of mediaSnapshot.docs) {
            //                 medias.push(mediaDoc.data())
            //             }
            //         })
            //     list.push(
            //         Model.#instance(doc, medias, collection, this.hasMedia)
            //     )
            // }



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
            const list = await Model.#batchFetch(query, collection)

            return list[0] ?? null
        } catch (error) {
            console.log(error)
        }
    }

    static async #batchFetch(query = FirebaseCore.admin.firestore().collection(), collection) {
        const list = []

        await query.get()
            .then(async (parentSnapshot) => {
                // create array ref parent
                var parentRefs = parentSnapshot.docs.map((parentDoc) => parentDoc.ref)
                // init array promise for batch read
                var batchGetPromises = []
                // create batch read for every ref parent
                parentRefs.forEach((parentRef, index) => {
                    // media
                    var media = FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", parentRef)
                    var mediaBatchPromise = media.get()
                    // role
                    if (this.hasRole) {
                        var role = FirebaseCore.admin.firestore().collection(roleCollection).doc(parentSnapshot.docs[index].data()["role"])
                        var roleBatchPromise = role.get()
                        batchGetPromises.push(Promise.all([mediaBatchPromise, roleBatchPromise]))
                    }
                    else {
                        batchGetPromises.push(Promise.all([mediaBatchPromise]))
                    }
                })
                // run batch read at same time
                return await Promise.all(batchGetPromises).then((batchResults) => {

                    if (this.hasRole) {
                        console.log("has role")
                        batchResults.forEach(([mediaSnapshot, roleSnapshot], index) => {
                            var parentDoc = parentSnapshot.docs[index];
                            var medias = []
                            if (mediaSnapshot) {
                                mediaSnapshot.forEach((mediaDoc) => {
                                    if (mediaDoc && mediaDoc.id) {
                                        medias.push(mediaDoc.data())
                                    }
                                });
                            }
                            list.push(
                                Model.#instance(parentDoc, medias, roleSnapshot?.data() ?? null, collection)
                            )
                        })
                    }
                    else {
                        console.log("has't role")
                        batchResults.forEach((mediaSnapshot, index) => {
                            var parentDoc = parentSnapshot.docs[index];
                            var medias = []
                            if (mediaSnapshot) {
                                mediaSnapshot.forEach((mediaDoc) => {
                                    if (mediaDoc && mediaDoc.id) {
                                        medias.push(mediaDoc.data())
                                    }
                                });
                            }
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
    static async bulkStored({ list= [] }) {
        var status = false
        try {
            if(list==undefined) throw 'invalid list'

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
                where: [{ field: 'id', operator: '==', value: id, }]
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
            console.log(info.collection)
            const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id)
            await docRef.update(newData)
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

    static async #saveMedia(instance, file, name = "") {



        if (!file || !file.extension || !name || !instance) {
            console.log("Save media failed: require all params, Please check file or name")
            return
        }

        const info = instance._info()

        var docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id);

        const oldMediaDoc = await FirebaseCore.admin.firestore().collection(mediaCollection)
            .where("ref", "==", docRef)
            .where("name", "==", name)
            .get()

        const media = await FirebaseCore.saveMedia(file)

        if (!media) return
        var mediaId
        var newMediaData = {
            "name": name,
            "url": media.url,
            "path": media.path,
            "ref": docRef
        }

        // create new   
        if (oldMediaDoc.docs.length == 0) {

            const mediaRef = FirebaseCore.admin.firestore().collection(mediaCollection).doc();
            const dataToStore = {
                id: mediaRef.id,
                ...newMediaData,
            }
            await mediaRef.set(dataToStore)
            mediaId = mediaRef.id
        }
        else {
            // remove old media
            await FirebaseCore.deleteMedia(oldMediaDoc.docs[0].data()["path"])
            // update 
            await oldMediaDoc.docs[0].ref.update(newMediaData)
            mediaId = oldMediaDoc.docs[0].ref.id
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
            await FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", instanceRef).get()
                .then((querySnapshot) => {
                    // collect media doc ref
                    var batch = FirebaseCore.admin.firestore().batch();
                    querySnapshot.forEach((doc) => {
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

}

export default Model
export {
    DataTypes
}