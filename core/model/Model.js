import FirebaseCore from '../firebase/FirebaseCore.js';

const DataTypes = Object.freeze({
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    map: 'map',
    array: 'array',
    null: 'null',
    timestamp: 'timestamp',
    geopoint: 'geopoint',
    reference: 'reference',
});

const Operator = Object.freeze({
    equal: '==',
    notEqual: '!=',
    lt: '<',
    lte: '<=',
    gt: '>',
    gte: '>=',
    arrayContains: 'array-contains',
    in: 'in',
    like: 'like',
    arrayContainsAny: 'array-contains-any',
    startsWith: 'startsWith',
    endsWith: 'endsWith',
    contains: 'contains',
});

const mediaCollection = 'medias';
const roleCollection = 'roles';
// const permissionCollection = "permissions"
const hasRoleCollection = 'has_roles';

class Model {
    fields = {};

    collection = '';

    hasRole = false;

    static init({
        fields = {
            Object: {
                type: DataTypes,
                nullable: false,
            },
        }, collection = '', hasRole = false,
    }) {
        this.fields = fields;
        this.collection = collection;
        this.hasRole = hasRole;
    }

    static #instance(collection, fields, doc, role, medias = []) {
        return {
            async destroy() {
                return Model.#destroy(this);
            },
            async update(data) {
                return Model.#update(this, data);
            },
            async saveMedia(file, name) {
                return Model.#saveMedia(this, file, name);
            },
            getMedia(name) {
                return Model.#getMedia(this, name);
            },
            destroyMedia(name) {
                return Model.#destroyMedia(this, name);
            },
            async setRole(name) {
                return Model.#setRole(this, name);
            },
            getRole() {
                return Model.#getRole(this);
            },
            getPermission() {
                return Model.#getPermission(this);
            },
            async removeRole() {
                return Model.#removeRole(this);
            },
            info() {
                return {
                    collection,
                    fields,
                    doc,
                    id: doc.id,
                    ref: doc.ref,
                    role,
                    medias,
                };
            },
            ...doc.data(),
        };
    }

    /**
       * get list of data
       * @param { where} : [  { field: 'age', operator: '>=', value: 18, and = true}
       *  { field: 'city', operator: '===', value: "Timika", and = true },]
       * @param {limit} : numeric
       * @param {orderBy} : {"field":"name","sort":"asc"}
       * @returns list || array
       */
    static async findAll({ where = [], limit = 0, orderBy = {} } = {}) {
        let list = [];
        try {
            const { collection } = this;
            let query = FirebaseCore.admin.firestore().collection(collection);

            if (where && where.length > 0) {
                where.forEach(({
                    field, operator, value, and,
                }) => {
                    let valueLike;
                    if (operator === Operator.like) {
                        valueLike = `${value}\uf8ff`;
                    }
                    if (and === undefined || and === true) {
                        if (valueLike) {
                            // console.error("field: ", field)
                            // console.error("Operator.gte: ", Operator.gte)
                            // console.error("value: ", value)
                            // console.error("Operator.lt: ", Operator.lt)
                            // console.error('valueLike: ', valueLike)
                            query = query.where(field, Operator.gte, value)
                                .where(field, Operator.lte, valueLike);
                        } else {
                            query = query.where(field, operator, value);
                        }
                    } else if (valueLike) {
                        query = query.where(field, Operator.gte, value)
                            .where(field, Operator.lte, valueLike);
                    } else {
                        query = query.orWhere(field, operator, value);
                    }
                });
            }

            if (Object.keys(orderBy).length > 0) {
                let order = orderBy.field;
                if (order === 'created_at') {
                    order = 'createTime';
                }
                if (order === 'updated_at') {
                    order = 'updateTime';
                }
                query = query.orderBy(order, orderBy.sort);
            }

            if (typeof limit === 'number' && limit > 0) {
                query = query.limit(limit);
            }

            list = await Model.#batchFetch(collection, this.fields, this.hasRole, query);
        } catch (error) {
            console.error(error);
        }
        return list;
    }

    /**
      * get single data
      * @param { where} : [  { field: 'age', operator: Operator.gte, value: 18, and = true}
      *  { field: 'city', operator: Operator.equal, value: "Timika", and = true },]
      * @returns object | null
      */
    static async findOne({ where = [] } = {}) {
        try {
            const { collection } = this;
            let query = FirebaseCore.admin.firestore().collection(collection);
            if (where && where.length > 0) {
                where.forEach(({
                    field, operator, value, and,
                }) => {
                    if (and === undefined || and === true) {
                        query = query.where(field, operator, value);
                    } else {
                        query = query.orWhere(field, operator, value);
                    }
                });
            }
            query = query.limit(1);

            const list = await Model.#batchFetch(collection, this.fields, this.hasRole, query);

            return list[0] ?? null;
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    static async #batchFetch(
        collection,
        fields,
        hasRole,
        query = FirebaseCore.admin.firestore().collection(),
    ) {
        const list = [];

        await query.get()
            .then(async (parentSnapshot) => {
                // create array ref parent
                const parentRefs = parentSnapshot.docs.map((parentDoc) => parentDoc.ref);
                // init array promise for batch read
                const batchGetPromises = [];

                // fetch role data first
                if (hasRole) {
                    const rolesBatchPromise = FirebaseCore.admin.firestore()
                        .collection(roleCollection).get();
                    batchGetPromises.push(Promise.all([rolesBatchPromise]));
                }

                // create batch read for every ref parent
                parentRefs.forEach((parentRef) => {
                    // media
                    const media = FirebaseCore.admin.firestore().collection(mediaCollection).where('ref', Operator.equal, parentRef);
                    const mediaBatchPromise = media.get();
                    // has role
                    if (hasRole) {
                        const hasRoleBatchPromise = FirebaseCore.admin.firestore()
                            .collection(hasRoleCollection)
                            .where('ref', Operator.equal, parentRef)
                            .get();
                        batchGetPromises.push(Promise.all(
                            [
                                mediaBatchPromise,
                                hasRoleBatchPromise,
                            ],
                        ));
                    } else {
                        batchGetPromises.push(Promise.all([mediaBatchPromise]));
                    }
                });
                // run batch read at same time
                return Promise.all(batchGetPromises)
                    .then((batchResults) => {
                        if (hasRole) {
                            const roles = [];
                            for (let i = 0; i < batchResults.length; i += 1) {
                                if (i === 0) {
                                    // store roles data
                                    const [roleSnapshot] = batchResults[i];
                                    roleSnapshot.docs.forEach((doc) => {
                                        roles.push({
                                            ref: doc.ref,
                                            ...doc.data(),
                                        });
                                    });
                                }
                                if (i > 0) {
                                    const medias = [];
                                    const [mediaSnapshot, hasRoleSnapshot] = batchResults[i];
                                    const parentDoc = parentSnapshot
                                        .docs[i - 1]; // -1 -> i===0 used for roles
                                    mediaSnapshot.forEach((mediaDoc) => {
                                        if (mediaDoc) {
                                            medias.push(mediaDoc.data());
                                        }
                                    });
                                    // has role
                                    const hasRoles = [];
                                    hasRoleSnapshot.forEach((hasRoleDoc) => {
                                        if (hasRoleDoc.data() && hasRoleDoc.data().role_ref) {
                                            const role = roles.filter((item) => item.id
                                                === hasRoleDoc.data().role_ref.id);
                                            if (role) {
                                                hasRoles.push(role[0]);
                                            }
                                        }
                                    });

                                    list.push(
                                        Model.#instance(
                                            collection,
                                            fields,
                                            parentDoc,
                                            hasRoles[0] ?? null,
                                            medias,
                                        ),
                                    );
                                }
                            }
                        } else {
                            batchResults.forEach(([mediaSnapshot], index) => {
                                const parentDoc = parentSnapshot.docs[index];
                                const medias = [];
                                mediaSnapshot.forEach((mediaDoc) => {
                                    if (mediaDoc) {
                                        medias.push(mediaDoc.data());
                                    }
                                });

                                list.push(
                                    Model.#instance(collection, fields, parentDoc, null, medias),
                                );
                            });
                        }
                    })
                    .catch((error) => {
                        console.error('Error parent & media', error);
                    });
            })
            .catch((error) => {
                console.error('Error parent: ', error);
            });
        return list;
    }

    /**
       *
       * @param {data} object of data
       * @returns object of data || null
       */
    static async stored(data = {}) {
        try {
            if (!isValidData(data, this.fields)) throw Error('Invalid data');

            const docRef = FirebaseCore.admin.firestore().collection(this.collection).doc();
            const timestamp = FirebaseCore.getCurrentTimestamp();
            const dataToStore = {
                id: docRef.id,
                created_at: timestamp,
                updated_at: timestamp,
                ...data,
            };
            await docRef.set(dataToStore);
            const doc = await docRef.get();

            return Model.#instance(this.collection, this.fields, doc, null, []);
        } catch (error) {
            console.error(error);
        }
        return null;
    }

    /**
       *
       * @param {list} array of object
       * @returns object of data
       */
    static async bulkStored({ list = [] }) {
        let status = false;
        try {
            if (!list) throw new Error('invalid list');

            list.forEach((e) => {
                if (!isValidData(e, this.fields)) throw Error('Invalid data');
            });

            const collectionRef = FirebaseCore.admin.firestore().collection(this.collection);
            const batch = FirebaseCore.admin.firestore().batch();
            const timestamp = FirebaseCore.getCurrentTimestamp();
            list.forEach((data) => {
                const docRef = collectionRef.doc();
                const dataToStore = {
                    id: docRef.id,
                    created_at: timestamp,
                    updated_at: timestamp,
                    ...data,
                };
                batch.set(docRef, dataToStore);
            });
            await batch.commit()
                .then(() => {
                    status = true;
                })
                .catch((error) => {
                    console.error('Error: ', error);
                });
        } catch (error) {
            console.error(error);
        }
        return status;
    }

    /**
       *
       * @param {intance} instance of model
       * @returns boolean
       */
    static async #destroy(instance) {
        let status = false;
        try {
            const info = instance.info();
            const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id);

            // delete all medias
            if (info.medias.length > 0) {
                const paths = [];

                info.medias.forEach((media) => {
                    paths.push(media.path);
                });
                await FirebaseCore.deleteMedias(paths).finally(async () => {
                    await this.#destroyMedias(docRef);
                });
            }
            // delete roles
            if (info.role) {
                await this.#removeRole(instance);
            }

            await docRef.delete()
                .then(async () => {
                    status = true;
                });
        } catch (error) {
            console.error(error);
        }
        return status;
    }

    /**
       *
       * @param {where} [{field:'name', 'operator':Operator.equal, value:'foo'}]
       * @returns boolean
       */
    static async destroy({ where = [] } = {}) {
        let status = false;
        try {
            const instances = await this.findAll({
                where,
            });
            if (!instances || instances.length === 0) throw new Error('not found');
            let deletedCount = 0;
            instances.forEach((instance) => {
                const deleted = instance.destroy();
                if (deleted) {
                    deletedCount += 1;
                }
            });
            if (deletedCount === instances.length) {
                status = true;
            }
        } catch (error) {
            console.error('error:', error);
        }
        return status;
    }

    /**
       *
       * @param {instance} instance of model
       * @returns boolean
       */
    static async #update(instance, data) {
        let status = false;
        try {
            if (!instance) throw new Error('invalid new data');

            const info = instance.info();

            if (!isValidData(data, info.fields, true)) throw Error('Invalid data');

            const timestamp = FirebaseCore.getCurrentTimestamp();
            const newData = {
                ...data,
                updated_at: timestamp,
            };
            await info.ref.update(newData)
                .then(() => {
                    status = true;
                });
        } catch (error) {
            console.error(error);
        }
        return status;
    }

    /**
       *
       * @param {data} object of data
       * @param {where} array of condition
       * @returns boolean
       */
    static async update({ data = {}, where = [] }) {
        let status = false;
        try {
            if (!isValidData(data, this.fields, true)) throw Error('Invalid data');

            let query = FirebaseCore.admin.firestore().collection(this.collection);
            if (where.length > 0) {
                where.forEach(({
                    field, operator, value, and,
                }) => {
                    if (and === undefined || and === true) {
                        query = query.where(field, operator, value);
                    } else {
                        query = query.orWhere(field, operator, value);
                    }
                });
            }

            const snapshot = await query.get();

            if (snapshot.empty || !snapshot) return false;

            const timestamp = FirebaseCore.getCurrentTimestamp();

            const batch = FirebaseCore.admin.firestore().batch();

            snapshot.forEach((doc) => {
                batch.update(doc.ref, {
                    ...data,
                    updated_at: timestamp,
                });
            });

            await batch.commit()
                .then(() => {
                    // console.error("updated");
                    status = true;
                })
                .catch((error) => {
                    console.error('Error: ', error);
                });
        } catch (error) {
            console.error(error);
        }
        return status;
    }

    static async #saveMedia(instance, file, name = '') {
        if (!file || !file.extension || !name || !instance) {
            console.error('Save media failed: require all params, Please check file or name');
            return null;
        }

        const info = instance.info();

        const docRef = FirebaseCore.admin.firestore().collection(info.collection).doc(info.id);

        const oldMediaDoc = await FirebaseCore.admin.firestore().collection(mediaCollection)
            .where('ref', Operator.equal, docRef)
            .where('name', Operator.equal, name)
            .get();

        const media = await FirebaseCore.saveMedia(file);

        if (!media) return null;
        let mediaId;
        const newData = {
            name,
            url: media.url,
            path: media.path,
            ref: docRef,
        };
        const newMedias = info.medias ?? [];

        // create new
        if (oldMediaDoc.empty) {
            const mediaRef = FirebaseCore.admin.firestore().collection(mediaCollection).doc();
            mediaId = mediaRef.id;
            const dataToStored = {
                id: mediaId,
                ...newData,
            };
            await mediaRef.set(dataToStored);
            newMedias.push(dataToStored);
            Object.assign(
                instance,
                this.#instance(info.collection, info.fields, info.doc, info.role, newMedias),
            );
        } else {
            // remove old media
            await FirebaseCore.deleteMedia(oldMediaDoc.docs[0].data().path);
            // update
            await oldMediaDoc.docs[0].ref.update(newData);
            mediaId = oldMediaDoc.docs[0].ref.id;

            // update media iin info
            info.medias = info.medias.map((_media) => {
                if (_media.name === name) {
                    return {
                        id: mediaId,
                        ...newData,
                    };
                }
                return _media;
            });
            Object.assign(
                instance,
                this.#instance(info.collection, info.fields, info.doc, info.role, info.medias),
            );
        }
        return {
            id: mediaId,
            name,
            url: media.url,
            path: media.path,
        };
    }

    static #getMedia(instance, name) {
        if (!instance) return [];
        const info = instance.info();
        const medias = [];
        let mediaTemp = null;
        info.medias.forEach((media) => {
            const mediaData = {
                id: media.id,
                name: media.name,
                url: media.url,
                path: media.path,
            };
            if (name === media.name) {
                mediaTemp = mediaData;
            }
            medias.push(mediaData);
        });
        if (mediaTemp !== null) return mediaTemp;
        if (name) return null;
        return medias;
    }

    static async #destroyMedia(instance, name) {
        let status = false;
        try {
            const info = instance.info();
            let media;

            info.medias.forEach((_media) => {
                if (name === _media.name) {
                    media = _media;
                }
            });

            if (media === undefined) throw new Error('media not found');
            // remove old media
            await FirebaseCore.deleteMedia(media.path).finally(async () => {
                const mediaRef = FirebaseCore.admin.firestore()
                    .collection(mediaCollection).doc(media.id);
                const docSnapshot = await mediaRef.get();
                if (docSnapshot.exists) {
                    await mediaRef.delete().then(() => {
                        const newMedias = info.medias.filter((_media) => _media.name !== name);
                        Object.assign(
                            instance,
                            this.#instance(
                                info.collection,
                                info.fields,
                                info.doc,
                                info.role,
                                newMedias,
                            ),
                        );
                        status = true;
                    });
                }
            });
        } catch (error) {
            console.error('error: ', error);
        }
        return status;
    }

    static async #destroyMedias(instanceRef) {
        try {
            await FirebaseCore.admin.firestore().collection(mediaCollection).where('ref', Operator.equal, instanceRef).get()
                .then((snapshot) => {
                    // collect media doc ref
                    const batch = FirebaseCore.admin.firestore().batch();
                    snapshot.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    // run batch
                    return batch.commit();
                })
                .then(() => {
                    // console.error("deleted");
                })
                .catch((error) => {
                    console.error('Error: ', error);
                });
        } catch (error) {
            console.error('error: ', error);
        }
    }

    static async #setRole(instance, name) {
        let status = false;
        try {
            await FirebaseCore.admin.firestore().collection(roleCollection).where('name', Operator.equal, name).get()
                .then(async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const info = instance.info();
                        const oldHasRoleDoc = await FirebaseCore.admin.firestore()
                            .collection(hasRoleCollection)
                            .where('ref', Operator.equal, info.ref)
                            .where('role_ref', Operator.equal, querySnapshot.docs[0].ref)
                            .get();
                        const newData = {
                            ref: info.ref,
                            role_ref: querySnapshot.docs[0].ref,
                        };
                        if (oldHasRoleDoc.empty) {
                            // create new
                            const hasRoleRef = FirebaseCore.admin.firestore()
                                .collection(hasRoleCollection).doc();
                            await hasRoleRef.set({
                                id: hasRoleRef.id,
                                ...newData,
                            });
                        } else {
                            // update
                            await oldHasRoleDoc.docs[0].ref.update(newData);
                        }
                        // update role to instance
                        const roleData = {
                            ref: querySnapshot.docs[0].ref,
                            ...querySnapshot.docs[0].data(),
                        };
                        Object.assign(
                            instance,
                            this.#instance(
                                info.collection,
                                info.fields,
                                info.doc,
                                roleData,
                                info.medias,
                            ),
                        );
                        status = true;
                    }
                })
                .catch((error) => {
                    console.error('Error: ', error);
                });
        } catch (error) {
            console.error('error: ', error);
        }
        return status;
    }

    static #getRole(instance) {
        if (!instance) return null;
        const info = instance.info();
        if (!info.role) return null;

        return {
            id: info.role.id,
            name: info.role.name,
            permissions: info.role.permissions,
        };
    }

    static async #removeRole(instance) {
        let status = false;
        try {
            if (!instance) throw Error('no instance');
            const info = instance.info();
            if (!info.role) throw Error('no role');

            await FirebaseCore.admin.firestore().collection(hasRoleCollection)
                .where('ref', Operator.equal, info.ref)
                .where('role_ref', Operator.equal, info.role.ref)
                .get()
                .then((snapshot) => {
                    // collect media doc ref
                    const batch = FirebaseCore.admin.firestore().batch();
                    snapshot.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    // run batch
                    return batch.commit();
                })
                .then(() => {
                    Object.assign(
                        instance,
                        this.#instance(
                            info.collection,
                            info.fields,
                            info.doc,
                            null,
                            info.medias,
                        ),
                    );
                    status = true;
                })
                .catch((error) => {
                    console.error('Error: ', error);
                });
        } catch (error) {
            console.error('Error: ', error);
        }
        return status;
    }

    static #getPermission(instance) {
        if (!instance) return null;
        const info = instance.info();
        if (!info.role) return null;
        return info.role.permissions;
    }
}

function isValidFieldType(fieldType, fieldValue) {
    switch (fieldType) {
        case DataTypes.string:
            return typeof fieldValue === 'string';
        case DataTypes.number:
            return typeof fieldValue === 'number';
        case DataTypes.boolean:
            return typeof fieldValue === 'boolean';
        case DataTypes.map:
            return typeof fieldValue === 'object' && !Array.isArray(fieldValue);
        case DataTypes.array:
            return Array.isArray(fieldValue);
        case DataTypes.null:
            return fieldValue === null;
        case DataTypes.timestamp:
            return fieldValue instanceof FirebaseCore.admin.firestore.Timestamp;
        case DataTypes.geopoint:
            return fieldValue instanceof FirebaseCore.admin.firestore.GeoPoint;
        case DataTypes.reference:
            return fieldValue instanceof FirebaseCore.admin.firestore.DocumentReference;
        default:
            return false;
    }
}

function isValidData(data, fields, isUpdate = false) {
    // if is update then ignore empty fields to using data keys for checking,
    // if stored then using fields keys for checking
    try {
        const fieldNames = isUpdate ? Object.keys(data) : Object.keys(fields);

        fieldNames.forEach((fieldName) => {
            const { nullable } = fields[fieldName];
            // if (!data.hasOwnProperty(fieldName) && !nullable) {
            if (!Object.prototype.hasOwnProperty.call(data, fieldName) && !nullable) {
                throw Error(`Field '${fieldName}' is missing in the data.`);
            }
            const fieldType = fields[fieldName].type;
            const fieldValue = data[fieldName];
            const dataType = typeof fieldValue;
            const isValid = isValidFieldType(fieldType, fieldValue);
            if (!isValid) {
                if ((nullable && fieldValue !== undefined) || (nullable && fieldValue != null)) {
                    throw new Error(`Invalid data type for field '${fieldName}'. Expected '${fieldType}', but got '${dataType}'.`);
                }
            }
        });
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}

export default Model;
export {
    DataTypes, Operator,
};
