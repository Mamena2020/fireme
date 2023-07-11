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

const roleCollection = 'roles';
// const permissionCollection = "permissions"

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

    static #instance(collection, fields, hasRole, doc, data, role, medias = []) {
        return {
            async destroy() {
                return Model.#destroy(this);
            },
            async update(newData) {
                return Model.#update(this, newData);
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
                    hasRole,
                    doc,
                    id: doc.id,
                    ref: doc.ref,
                    role,
                    medias,
                };
            },
            ...data,
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
            if (!Array.isArray(where)) throw Error('Invalid where');

            await FirebaseCore.init();
            const { collection } = this;
            let query = FirebaseCore.admin.firestore().collection(collection);

            if (where && where.length > 0) {
                where.forEach(({
                    field, operator, value, and,
                }) => {
                    if (field === undefined || operator === undefined || value === undefined) {
                        throw Error(`Invalid where field: ${field}, operator: ${operator}, value: ${value} `);
                    }

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
            if (!Array.isArray(where)) throw Error('Invalid where');

            await FirebaseCore.init();
            const { collection } = this;
            let query = FirebaseCore.admin.firestore().collection(collection);
            if (where && where.length > 0) {
                where.forEach(({
                    field, operator, value, and,
                }) => {
                    if (field === undefined || operator === undefined || value === undefined) {
                        throw Error(`Invalid where field: ${field}, operator: ${operator}, value: ${value} `);
                    }

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
        const batchGetPromises = [];
        if (hasRole) {
            const rolesBatchPromise = FirebaseCore.admin.firestore()
                .collection(roleCollection).get();
            batchGetPromises.push(Promise.all([rolesBatchPromise]));
        }
        batchGetPromises.push(Promise.all([query.get()]));
        // run batch read at same time
        await Promise.all(batchGetPromises)
            .then((batchResults) => {
                let roles;
                let snapshot;
                if (hasRole) {
                    const [roleSnapshoot, querySnapshot] = batchResults;
                    roles = roleSnapshoot;
                    snapshot = querySnapshot;
                } else {
                    const [querySnapshot] = batchResults;
                    snapshot = querySnapshot;
                }
                snapshot[0].docs.forEach((doc) => {
                    // eslint-disable-next-line camelcase
                    const { medias, role_ref, ...data } = doc.data();
                    let role = null;
                    // eslint-disable-next-line camelcase
                    if (hasRole && Array.isArray(roles) && role_ref) {
                        roles[0].docs.forEach((r) => {
                            // eslint-disable-next-line camelcase
                            if (role_ref.path === r.ref.path) {
                                role = r.data();
                            }
                        });
                    }
                    list.push(
                        Model.#instance(
                            collection,
                            fields,
                            hasRole,
                            doc,
                            data,
                            role,
                            medias ?? [],
                        ),
                    );
                });
            });
        return list;
    }

    /**
       *
       * @param {data} object of data {name:"bar"}
       * @returns object of data || null
       */
    static async stored(data = {}) {
        try {
            await FirebaseCore.init();
            removeUnregisteredData(data, this.fields);
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
            return Model.#instance(
                this.collection,
                this.fields,
                this.hasRole,
                doc,
                doc.data(),
                null,
                [],
            );
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
            await FirebaseCore.init();
            if (!list) throw new Error('invalid list');

            list.forEach((e) => {
                removeUnregisteredData(e, this.fields);
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
            await FirebaseCore.init();
            const instances = await this.findAll({
                where,
            });
            if (!instances || instances.length === 0) throw new Error('not found');
            let deletedCount = 0;
            for (let i = 0; i < instances.length; i += 1) {
                const deleted = await instances[i].destroy();
                if (deleted) {
                    deletedCount += 1;
                }
            }
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
            removeUnregisteredData(data, info.fields);
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
            await FirebaseCore.init();
            removeUnregisteredData(data, this.fields);
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
        const media = await FirebaseCore.saveMedia(file);

        if (!media) return null;
        const oldData = Object.keys(instance).reduce((result, key) => {
            if (typeof instance[key] !== 'function') {
                // eslint-disable-next-line no-param-reassign
                result[key] = instance[key];
            }
            return result;
        }, {});

        const newData = {
            name,
            url: media.url,
            path: media.path,
        };
        const medias = info.medias ?? [];
        const oldMedia = instance.getMedia(name);
        // create new
        if (!oldMedia) {
            medias.push(newData);
            await docRef.update({
                medias,
            });

            Object.assign(
                instance,
                this.#instance(
                    info.collection,
                    info.fields,
                    info.hasRole,
                    info.doc,
                    oldData,
                    info.role,
                    medias,
                ),
            );
        } else {
            // remove old media
            await FirebaseCore.deleteMedia(oldMedia.path);
            // update media in info
            info.medias = info.medias.map((_media) => {
                if (_media.name === name) {
                    return newData;
                }
                return _media;
            });
            // update to firestore
            await docRef.update({
                medias: info.medias,
            });
            Object.assign(
                instance,
                this.#instance(
                    info.collection,
                    info.fields,
                    info.hasRole,
                    info.doc,
                    oldData,
                    info.role,
                    info.medias,
                ),
            );
        }
        return {
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
            if (name === media.name) {
                mediaTemp = media;
            }
            medias.push(media);
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
                const docRef = FirebaseCore.admin.firestore()
                    .collection(info.collection).doc(info.id);
                const newMedias = info.medias.filter((_media) => _media.name !== name);
                await docRef.update({ medias: newMedias }).then(() => {
                    const oldData = Object.keys(instance).reduce((result, key) => {
                        if (typeof instance[key] !== 'function') {
                            // eslint-disable-next-line no-param-reassign
                            result[key] = instance[key];
                        }
                        return result;
                    }, {});
                    Object.assign(
                        instance,
                        this.#instance(
                            info.collection,
                            info.fields,
                            info.hasRole,
                            info.doc,
                            oldData,
                            info.role,
                            newMedias,
                        ),
                    );
                    status = true;
                });
            });
        } catch (error) {
            console.error('error: ', error);
        }
        return status;
    }

    static async #setRole(instance, name) {
        let status = false;
        try {
            const info = instance.info();
            if (!info.hasRole) throw Error('model doesn\'t have role');
            await FirebaseCore.admin.firestore().collection(roleCollection).where('name', Operator.equal, name).get()
                .then(async (querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const roleRef = querySnapshot.docs[0].ref;
                        const roleData = querySnapshot.docs[0].data();
                        await info.ref.update({
                            role_ref: roleRef,
                        });
                        const oldData = Object.keys(instance).reduce((result, key) => {
                            if (typeof instance[key] !== 'function') {
                                // eslint-disable-next-line no-param-reassign
                                result[key] = instance[key];
                            }
                            return result;
                        }, {});
                        Object.assign(
                            instance,
                            this.#instance(
                                info.collection,
                                info.fields,
                                info.hasRole,
                                info.doc,
                                oldData,
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

            const updateData = {
                role_ref: FirebaseCore.admin.firestore.FieldValue.delete(),
            };

            info.ref.update(updateData)
                .then(() => {
                    const oldData = Object.keys(instance).reduce((result, key) => {
                        if (typeof instance[key] !== 'function') {
                            // eslint-disable-next-line no-param-reassign
                            result[key] = instance[key];
                        }
                        return result;
                    }, {});
                    Object.assign(
                        instance,
                        this.#instance(
                            info.collection,
                            info.fields,
                            info.hasRole,
                            info.doc,
                            oldData,
                            null,
                            info.medias,
                        ),
                    );
                    status = true;
                })
                .catch((error) => {
                    console.error('Error:', error);
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
            const nullable = fields[fieldName].nullable ?? false;
            // if nullable -> pass data check
            if ((!Object.prototype.hasOwnProperty.call(data, fieldName) && !nullable)
                || (Object.prototype.hasOwnProperty.call(data, fieldName) && !nullable
                    && data[fieldName] === undefined
                )
            ) {
                throw Error(`Field '${fieldName}' is missing in the data.`);
            }
            const fieldType = fields[fieldName].type;
            const fieldValue = data[fieldName];
            const dataType = typeof fieldValue;
            const isValid = isValidFieldType(fieldType, fieldValue);
            if (!isValid) {
                if (nullable && fieldValue !== undefined && fieldValue !== null) {
                    throw Error(`Invalid data type for field '${fieldName}'. Expected '${fieldType}', but got '${dataType}'.`);
                }
            }
        });
        return true;
    } catch (error) {
        console.error(error);
    }
    return false;
}
function removeUnregisteredData(data = {}, fields = {}) {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in data) {
        if (!(key in fields) && data[key]) {
            // eslint-disable-next-line no-param-reassign
            delete data[key];
        }
    }
}

export default Model;
export {
    DataTypes, Operator,
};
