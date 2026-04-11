import admin from 'firebase-admin';
import { v4 as uuid4 } from 'uuid';
import fse from 'fs-extra';
import firebaseConfig from '../config/Firebase.js';

class FirebaseCore {
    static admin = admin;

    static #initPromise = null;

    /**
     * Init firebase service to firebase admin
     * @returns
     */
    static async init() {
        // already init return instance of admin
        if (this.admin.apps.length) { return; }

        // prevent race condition: reuse the same init promise
        if (this.#initPromise) {
            await this.#initPromise;
            return;
        }

        this.#initPromise = (async () => {
            try {
                const jsonString = Buffer.from(firebaseConfig.ServiceAccountBase64, 'base64').toString('ascii');
                const jsonData = JSON.parse(jsonString);

                this.admin.initializeApp({
                    credential: this.admin.credential.cert(jsonData),
                    storageBucket: firebaseConfig.firebaseBucket,
                });
            } catch (error) {
                this.#initPromise = null;
                throw error;
            }
        })();

        await this.#initPromise;
    }

    /**
     * Save single media to firebase storage
     * @param {*} file
     * @returns {} return url & path
     */
    static async saveMedia(file, isPublic = true) {
        await this.init();

        const bucket = this.admin.storage().bucket();
        const fileName = uuid4() + file.extension;
        const fileFirebase = bucket.file(fileName);

        return new Promise((resolve, reject) => {
            const stream = fileFirebase.createWriteStream({
                resumable: true,
                public: isPublic,
                timeout: 120000, // 2m
            });

            stream.on('error', (err) => {
                reject(new Error(`Failed to upload media: ${err.message}`));
            });

            stream.on('finish', () => {
                resolve({
                    url: isPublic ? fileFirebase.publicUrl() : null,
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
        await this.init();
        const fileName = path.split('/').pop();
        const bucket = this.admin.storage().bucket();
        const file = bucket.file(fileName);

        try {
            await file.delete();
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error(`Failed to delete media: ${error.message}`);
        }
    }

    /**
     * Delete many media
     * @param {*} paths must be an array of path firebase storage
     * @returns
     */
    static async deleteMedias(paths) {
        if (!Array.isArray(paths)) {
            throw new Error('paths must be an array');
        }

        for (const path of paths) {
            await this.deleteMedia(path);
        }
        return true;
    }

    /**
     * Get file byte data from firebase storage (for private files)
     * @param {string} path ex: gs://xxxxx.appspot.com/filename.jpg
     * @returns {Buffer} file content as Buffer
     */
    static async getMediaBytes(path) {
        await this.init();
        const fileName = path.split('/').pop();
        const bucket = this.admin.storage().bucket();
        const file = bucket.file(fileName);

        const [buffer] = await file.download();
        return buffer;
    }

    /**
     * Generate a temporary signed URL for private files
     * @param {string} path ex: gs://xxxxx.appspot.com/filename.jpg
     * @param {number} expiresInMs expiration in milliseconds (default: 15 minutes)
     * @returns {string} signed URL
     */
    static async getSignedUrl(path, expiresInMs = 15 * 60 * 1000) {
        await this.init();
        const fileName = path.split('/').pop();
        const bucket = this.admin.storage().bucket();
        const file = bucket.file(fileName);

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresInMs,
        });
        return signedUrl;
    }

    static async sendMessage({
        title = '', body = '', data = {}, registrationTokens = [],
    }) {
        if (!Array.isArray(registrationTokens) || registrationTokens.length === 0) { return; }

        await this.init();

        const notification = { title, body };

        if (registrationTokens.length === 1) {
            const message = { notification, token: registrationTokens[0] };
            if (Object.keys(data).length > 0) {
                message.data = data;
            }
            try {
                const response = await this.admin.messaging().send(message);
                console.info('Successfully sent message:', response);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        } else {
            const message = { notification, tokens: registrationTokens };
            if (Object.keys(data).length > 0) {
                message.data = data;
            }
            try {
                const response = await this.admin.messaging().sendMulticast(message);
                console.info(`${response.successCount} messages were sent successfully`);
            } catch (error) {
                console.error(`Error sending message: ${error}`);
            }
        }
    }

    static getCurrentTimestamp() {
        return this.admin.firestore.FieldValue.serverTimestamp();
    }
}

export default FirebaseCore;
