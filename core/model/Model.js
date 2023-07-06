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

class Model {

    fields = {};
    collection = ""

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
    }


    static #instance(doc, medias, collection, hasMedia) {
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
            __info: function () {
                return {
                    id: doc.id,
                    collection: collection,
                    hasMedia: hasMedia,
                    medias: medias
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
        const list = []
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
                })
            }
            if (typeof limit === "number" && limit > 0) {
                query = query.limit(limit)
            }

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
            //         Model.#instance(doc, medias, this.collection, this.hasMedia)
            //     )
            // }


            await query.get()
                .then(async (parentSnapshot) => {
                    // create array ref parent
                    var parentRefs = parentSnapshot.docs.map((parentDoc) => parentDoc.ref)
                    // init array promise for batch read
                    var batchGetPromises = []
                    // create batch read for every ref parent
                    parentRefs.forEach((parentRef) => {
                        var media = FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", parentRef)
                        var batchGetPromise = media.get()
                        batchGetPromises.push(batchGetPromise);
                    })
                    // run batch read at same time
                    return await Promise.all(batchGetPromises).then((batchResults) => {
                        batchResults.forEach((mediaSnapshot, index) => {
                            var parentDoc = parentSnapshot.docs[index];
                            var medias = []
                            mediaSnapshot.forEach((mediaDoc) => {
                                medias.push(mediaDoc.data())
                            });
                            list.push(
                                Model.#instance(parentDoc, medias, this.collection, this.hasMedia)
                            )
                        })
                    })
                        .catch((error) => {
                            console.error("Error parent & media", error);
                        })
                })
                .catch((error) => {
                    console.error("Error parent: ", error);
                })
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
                })
            }
            query = query.limit(1)
            // const snapshot = await query.get();
            const list = [];
            // for (var doc of snapshot.docs) {
            //     var medias = []
            //      await FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", doc.ref).get()
            //         .then((mediaSnapshot) => {
            //             for (var mediaDoc of mediaSnapshot.docs) {
            //                 medias.push(mediaDoc.data())
            //             }
            //         })
            //     list.push(
            //         Model.#instance(doc, medias, this.collection, this.hasMedia)
            //     )
            // }


            // Mengambil dokumen pengguna dari koleksi "users"
            await query.get()
                .then(async (parentSnapshot) => {
                    // Membuat array referensi pengguna
                    var parentRefs = parentSnapshot.docs.map((parentDoc) => parentDoc.ref);

                    // Menginisialisasi array promise untuk operasi batch read
                    var batchGetPromises = [];

                    // Membuat operasi batch read untuk setiap referensi pengguna
                    parentRefs.forEach((parentRef) => {
                        var media = FirebaseCore.admin.firestore().collection(mediaCollection).where("ref", "==", parentRef);
                        var batchGetPromise = media.get();
                        batchGetPromises.push(batchGetPromise);
                    });

                    // Menjalankan operasi batch read secara bersamaan
                    return await Promise.all(batchGetPromises).then((batchResults) => {
                        // Mengolah hasil operasi batch read
                        batchResults.forEach((mediaSnapshot, index) => {
                            var parentDoc = parentSnapshot.docs[index];
                            var medias = []
                            mediaSnapshot.forEach((mediaDoc) => {
                                medias.push(mediaDoc.data())
                            });
                            list.push(
                                Model.#instance(parentDoc, medias, this.collection, this.hasMedia)
                            )
                        });
                    })
                        .catch((error) => {
                            console.error("Error parent & media", error);
                        });
                })
                .catch((error) => {
                    console.error("Error parent: ", error);
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
            await docRef.set(dataToStore)
            const snapshot = await docRef.get()
            return Model.#instance(snapshot, [], this.collection, this.hasMedia)
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

        const info = instance.__info()

        var docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id);

        const oldMediaDoc = await FirebaseCore.admin.firestore().collection(mediaCollection)
            .where("ref", "==", docRef)
            .where("name", "==", name)
            .get()

        const media = await FirebaseCore.saveMedia(file)

        if (!media) return

        var newMediaData = {
            "name": name,
            "url": media.url,
            "path": media.path,
            "ref": docRef
        }

        // create new   
        if (oldMediaDoc.docs.length == 0) {
            await FirebaseCore.admin.firestore().collection(mediaCollection).add(newMediaData)
                .then((docRef) => {
                })
        }
        else {
            // remove old media
            await FirebaseCore.deleteMedia(oldMediaDoc.docs[0].data()["path"])
            // update 
            await oldMediaDoc.docs[0].ref.update(newMediaData)
        }
        return {
            "name": name,
            "url": media.url,
            "path": media.path,
        }
    }

    static #getMedia(instance, name) {
        if (!instance) return []
        const info = instance.__info()
        const medias = [];
        for (var media of info.medias) {
            var mediaData = {
                "name": media.name,
                "url": media.url,
                "path": media.path,
            }
            if (name == media.name) {
                return mediaData
            }
            medias.push(mediaData)
        }
        if(name) return null
        return medias
    }
}

export default Model
export {
    DataTypes
}