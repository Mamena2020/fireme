import admin from 'firebase-admin';
import { v4 as uuid4 } from 'uuid';
import fse from 'fs-extra';
import firebaseConfig from '../config/Firebase.js';

class FirebaseCore {
    static admin = admin;

    /**
     * Init firebase service to firebase admin
     * @returns
     */
    static async init() {
        // already init return instance of admin
        if (this.admin.apps.length) { return; }

        // eslint-disable-next-line no-async-promise-executor
        await new Promise(async (resolve, reject) => {
            try {
                const jsonString = Buffer.from(firebaseConfig.ServiceAccountBase64, 'base64').toString('ascii');
                const jsonData = await JSON.parse(jsonString);

                this.admin.initializeApp({
                    credential: this.admin.credential.cert(jsonData),
                    storageBucket: firebaseConfig.firebaseBucket,
                });
                resolve(this.admin);
            } catch (error) {
                console.error(error);
                reject();
            }
        });
    }

    /**
   * Save single media to firebase storage
   * @param {*} file
   * @returns {} return url & path
   */
    static async saveMedia(file) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            await this.init();

            const bucket = this.admin.storage().bucket();

            const fileName = uuid4() + file.extension;

            const fileFirebase = bucket.file(fileName);

            const stream = fileFirebase.createWriteStream({
                resumable: true,
                public: true,
                timeout: 120000, //  2m
            });

            stream.on('error', (err) => {
                console.error(err);
                reject();
            });

            stream.on('finish', async () => {
                // uploaded
                resolve({
                    url: fileFirebase.publicUrl(),
                    path: `${firebaseConfig.firebaseBucket}/${fileName}`,
                });
            });

            fse.createReadStream(file.tempDir).pipe(stream);
        });
    }

    /**
     * Delete single file from firebase storage
     * @param {*} path ex: gs://xxxxx.appspot.com/6e2b7970-f56d-4009-b0cb-f3464d8cc847.jpg
     * @returns
     */
    static async deleteMedia(path) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            await this.init();
            const fileName = path.split('/').pop();
            const bucket = this.admin.storage().bucket();
            const file = bucket.file(fileName);

            file.delete().then(() => {
                // console.log(`File deleted successfully.`);
                resolve(true);
            }).catch((error) => {
                reject();
                console.error('Error deleting file:', error);
            });
        });
    }

    /**
     * Delete many media
     * @param {*} paths must be an array of path firebase storage
     * @returns
     */
    static async deleteMedias(paths) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            // console.log("start delete firebase files", paths)

            if (!Array.isArray(paths)) { reject(); }

            // eslint-disable-next-line no-restricted-syntax
            for (const path of paths) {
                // eslint-disable-next-line no-await-in-loop
                await this.deleteMedia(path);
            }
            resolve(true);
        });
    }

    static async sendMessage({
        title = '', body = '', data = {}, registrationTokens = [],
    }) {
        if (!Array.isArray(registrationTokens) || registrationTokens.length === 0) { return; }

        await this.init();

        const message = {};
        const notification = {};
        notification.title = title;
        notification.body = body;
        message.notification = notification;

        if (Object.keys(data).length > 0) {
            message.data = data;
        }
        message.token = registrationTokens.length === 1
            ? registrationTokens[0] : registrationTokens;

        if (registrationTokens.length === 1) {
            await this.admin.messaging().send(message)
                .then((response) => {
                    console.error('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
        } else {
            await this.admin.messaging().sendMulticast(message)
                .then((response) => {
                    console.info(`${response.successCount} messages were sent successfully`);
                })
                .catch((error) => {
                    console.error(`Error sending message: ${error}`);
                });
        }
    }

    static getCurrentTimestamp() {
        this.init();
        return this.admin.firestore.FieldValue.serverTimestamp();
    }
}

export default FirebaseCore;
