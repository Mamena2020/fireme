import nodemailer from 'nodemailer';
import ejs from 'ejs';
import mailConfig from '../config/Mail.js';

/**
 * Store testing account
 */
let testingAccount;
const mailAccount = async () => {
    if (mailConfig.testing) {
        if (!testingAccount) {
            testingAccount = await nodemailer.createTestAccount();
        }
        return {
            user: testingAccount.user, // generated ethereal user
            pass: testingAccount.pass, // generated ethereal password
        };
    }
    return {
        user: mailConfig.username,
        pass: mailConfig.password,
    };
};

/**
 * create transporter for email
 * @returns
 */
const transporter = async () => {
    const mailAuth = await mailAccount();
    if (!mailAuth.user || !mailAuth.pass) {
        console.error('\x1b[31m', 'Mail credential invalid, Check your credential mail username or password', '\x1b[0m');
        throw Error('Credential invalid');
    }
    const transport = {
        host: mailConfig.host || 'smtp.ethereal.email',
        port: mailConfig.port || 587,
        secure: mailConfig.port === 465, // true for 465, false for other ports
        auth: mailAuth,
    };
    return nodemailer.createTransport(transport);
};

class Mail {
    /**
     * Load message options
     * @param {*} param0
     */
    async load({
        // ------------------- common fields
        from = '',
        to = [],
        subject = '',
        text = '',
        html = {
            path: '',
            data: {},
        },
        attachments = [],
        cc = [],
        bcc = [],
        // ------------------- advance fields
        sender = '',
        replyTo = [],
        alternatives = [],
        encoding = '',
        // -------------------
    }) {
        if (!from) { throw Error('from email address is required'); }
        if (!Array.isArray(to) || to.length === 0) { throw Error('receivers is required and must be an array'); }
        if (!Array.isArray(attachments)) { throw Error('attachments must be an array of object, see doc: https://nodemailer.com/message/attachments'); }
        if (!Array.isArray(cc) || !Array.isArray(bcc)) { throw Error('cc & bcc must be an array email'); }
        if (!Array.isArray(alternatives)) { throw Error('alternatives must be an array of object, see doc: https://nodemailer.com/message/alternatives'); }
        if (!Array.isArray(replyTo)) { throw Error('replyTo must be an array of string'); }

        // ------------------- common fields
        this.from = from;
        this.to = to;
        this.subject = subject;
        this.text = text;
        this.attachments = attachments;
        this.cc = cc;
        this.bcc = bcc;

        if (html && html.path) {
            // this.html = await this. #renderHtml({ path: html.path.toString(), data: html.data });
            this.html = await this.#renderHtml({ path: html.path.toString(), data: html.data });
        }
        // ------------------- advance fields
        this.sender = sender;
        this.replyTo = replyTo;
        this.encoding = encoding;
        this.alternatives = alternatives;
    }

    /**
     * rendering html to string with data if exist
     * @param {*} {path and data}
     * @returns html string
     */
    // eslint-disable-next-line class-methods-use-this
    async #renderHtml({ path = String, data }) {
        return new Promise((resolve, reject) => {
            ejs.renderFile(path, data || {}, (err, html) => {
                if (err) {
                    console.error('\x1b[31m', 'Error render html', err, '\x1b[0m');
                    reject(err);
                }
                resolve(html);
            });
        });
    }

    /**
     * preparing message options
     * @returns
     */
    #messageOptions() {
        // ------------------- common fields
        const message = {};

        if (this.from) {
            message.from = this.from;
        }
        if (this.to) {
            let toTemp = '';
            this.to.forEach((e, i) => {
                if (i > 0) {
                    toTemp = `${toTemp}, ${e}`;
                } else {
                    toTemp += e;
                }
            });
            message.to = toTemp;
        }
        if (this.subject) {
            message.subject = this.subject;
        }
        if (this.text) {
            message.text = this.text;
        }
        if (this.attachments) {
            message.attachments = this.attachments;
        }
        if (this.html) {
            message.html = this.html;
        }

        if (this.cc) {
            let ccTemp = '';
            this.cc.forEach((e, i) => {
                if (i > 0) {
                    ccTemp = `${ccTemp}, ${e}`;
                } else {
                    ccTemp += e;
                }
            });
            message.cc = ccTemp;
        }

        if (this.bcc) {
            let bccTemp = '';
            this.bcc.forEach((e, i) => {
                if (i > 0) {
                    bccTemp = `${bccTemp}, ${e}`;
                } else {
                    bccTemp += e;
                }
            });
            message.bcc = bccTemp;
        }
        // ------------------- advance fields
        if (this.sender) {
            message.sender = this.sender;
        }
        if (this.replyTo) {
            let replyToTemp = '';
            this.replyTo.forEach((e, i) => {
                if (i > 0) {
                    replyToTemp = `${replyToTemp}, ${e}`;
                } else {
                    replyToTemp += e;
                }
            });
            message.replyTo = replyToTemp;
        }
        if (this.encoding) {
            message.encoding = this.encoding;
        }
        if (this.alternatives) {
            message.alternatives = this.alternatives;
        }

        return message;
    }

    /**
     * sending mail
     * @returns
     */
    async send() {
        const newTransporter = await transporter();
        return newTransporter.sendMail(this.#messageOptions());
    }
}

export default Mail;
