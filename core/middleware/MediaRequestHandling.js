import fse from 'fs-extra';
import path from 'path';
import os from 'os';
import busboy from 'busboy';

// the body - parser middleware is configured to handle application / json
// and application / x - www - form - urlencoded content types.
// To handle form - data using middleware like multer or busboy

const isArray = (name) => {
    const a = name.indexOf('[');
    const b = name.indexOf(']');
    if (a !== -1 && b !== -1) {
        if (b - 1 === a || b - 2 === a) {
            return true;
        }
    }
    return false;
};

const isArrayNested = (name) => {
    const a = name.indexOf('[');
    const b = name.indexOf(']');
    if (a !== -1 && b !== -1) {
        if (b - 1 === a) {
            return true;
        }
    }
    return false;
};

/**
 * start remove all temp files after response is send back to client
 * @param {*} res response of expres
 * @param {*} files files
 */
const clearTempFiles = (res, files) => {
    res.on('finish', () => {
        try {
            // eslint-disable-next-line no-restricted-syntax
            for (const fieldName of Object.keys(files)) {
                try {
                    if (fse.pathExistsSync(files[fieldName].tempDir)) {
                        fse.removeSync(files[fieldName].tempDir);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        } catch (error) {
            console.error(error);
        }
    });
};

const parseFields = (fieldName, value, req) => {
    // eslint-disable-next-line no-useless-escape
    const keys = fieldName.split(/[\[\]]+/).filter((key) => key);
    let current = req.body;
    // console.log(keys)
    for (let i = 0; i < keys.length; i += 1) {
        let key = keys[i];
        if (key.endsWith(']')) {
            key = key.slice(0, -1);
        }
        if (i === keys.length - 1) {
            if (Array.isArray(current)) {
                current.push(value);
                // console.log(key, 1)
            } else if (typeof current[key] === 'string') {
                current[key] = [current[key], value];
                // console.log(key, 2)
            } else if (Array.isArray(current[key])) {
                current[key].push(value);
                // console.log(key, 3)
            } else {
                // eslint-disable-next-line no-lonely-if
                if (isArrayNested(fieldName)) {
                    if (!current[key]) {
                        current[key] = [value];
                    } else {
                        current[key].push(value);
                    }
                } else {
                    current[key] = value;
                }
                // console.log(key, 4)
            }
        } else {
            // eslint-disable-next-line no-restricted-globals
            current[key] = current[key] || (isNaN(keys[i + 1]) ? {} : []);
            current = current[key];
            // console.log(key, 5)
        }
        // console.log("req body")
        // console.dir(req.body)
    }
};

/**
 * request handling for handling nested fields or file request
 * @param {*} req express
 * @param {*} res express
 * @param {*} next next express
 */
const mediaRequestHandling = async (req, res, next) => {
    if (
        ((req.method === 'POST' && req.headers['content-type']) && req.headers['content-type'].startsWith('multipart/form-data'))
        || (req.method === 'POST' && req.headers['content-type'] && req.headers['content-type'].startsWith('application/x-www-form-urlencoded'))
        || (req.method === 'PUT' && req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data'))
        || (req.method === 'PUT' && req.headers['content-type'] && req.headers['content-type'].startsWith('application/x-www-form-urlencoded'))
    ) {
        const bb = busboy({ headers: req.headers });
        const tempFiles = {};

        bb.on('file', (fieldName, file, info) => {
            // ex: file[]
            if (isArray(fieldName)) {
                if (!req.body[fieldName]) {
                    req.body[fieldName] = [];
                    tempFiles[fieldName] = [];
                }
            }

            const tempDir = path.join(os.tmpdir(), info.filename ?? 'temp.temp');

            let fileSize = 0;
            file.pipe(fse.createWriteStream(tempDir));

            file.on('data', (data) => {
                fileSize += data.length;
            });
            file.on('end', () => {
                const newFile = {
                    name: info.filename,
                    encoding: info.encoding,
                    type: info.mimeType,
                    size: fileSize,
                    sizeUnit: 'bytes',
                    extension: path.extname(info.filename ?? 'temp.temp'),
                    tempDir,
                };

                if (isArray(fieldName) && Array.isArray(req.body[fieldName])) {
                    if (info.filename) {
                        req.body[fieldName].push(newFile);
                    }
                    tempFiles[fieldName].push(newFile);
                } else {
                    if (info.filename) {
                        req.body[fieldName] = newFile;
                    }
                    tempFiles[fieldName] = newFile;
                }
            });
        });

        bb.on('field', (fieldName, value) => {
            parseFields(fieldName, value, req);
        });

        bb.on('finish', () => {
            // console.log(body)
            clearTempFiles(res, tempFiles);
            next();
        });
        req.pipe(bb);
    } else {
        next();
    }
};

export default mediaRequestHandling;
