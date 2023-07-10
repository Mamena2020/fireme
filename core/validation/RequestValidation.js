import validator from 'validator';
import localeConfig from '../config/Locale.js';
import Translate from '../locale/Dictionary.js';
import ValidationDB from './ValidationDB.js';
import langValidation from '../locale/LangValidation.js';

/**
 * For add new rule
 * [1]. add on ValidationType
 * [2]. add message LangValidation in `core/locale/LangValidation`
 * [3]. add params if has params -> createOptionsParams()
 * [4]. add check validation on -> ValidationCheck()
 */

const ValidationType = Object.freeze({
    required: 'required',
    email: 'email',
    match: 'match',
    string: 'string',
    float: 'float',
    integer: 'integer',
    max: 'max',
    min: 'min',
    date: 'date',
    array: 'array',
    exists: 'exists',
    unique: 'unique',
    mimetypes: 'mimetypes',
    mimes: 'mimes',
    max_file: 'max_file',
    image: 'image',
    date_after: 'date_after',
    date_after_or_equal: 'date_after_or_equal',
    date_before: 'date_before',
    date_before_or_equal: 'date_before_or_equal',
    boolean: 'boolean',
    in_array: 'in_array',
    not_in_array: 'not_in_array',
    ip: 'ip',
    url: 'url',
    json: 'json',
    digits: 'digits',
    max_digits: 'max_digits',
    min_digits: 'min_digits',
    digits_between: 'digits_between',
    age_lt: 'age_lt',
    age_lte: 'age_lte',
    age_gt: 'age_gt',
    age_gte: 'age_gte',
});

class RequestValidation {
    errors = {};

    isError = false;

    constructor(req) {
        this.body = req?.body ?? {};
        this.locale = req.locale || localeConfig.defaultLocale;
    }

    async load(child) {
        this.rules = child.rules();
        // await this.check()
    }

    async #checkError() {
        this.isError = true;
        if (JSON.stringify(this.errors) === JSON.stringify({})) {
            this.isError = false;
        }
    }

    responseError(res) {
        return res.status(422).json(this.errors);
    }

    async check() {
        this.errors = {};
        // console.log("--------------------------------------------------- field")
        // console.log(this.body)
        // console.log("--------------------------------------------------- rules")
        // console.log(this.rules)
        // console.log("=================================================== Checking")

        const keys = Object.keys(this.rules);

        for (let i = 0; i < keys.length; i += 1) {
            const fieldKey = keys[i];
            if (this.#isNested(fieldKey)) {
                await this.#nestedProcess(fieldKey);
            } else if (this.#hasData(fieldKey)) {
                await this.#checking(fieldKey, this.body[fieldKey]);
            } else if (this.#hasRuleRequired(fieldKey)) this.#setError(fieldKey, 'required');
        }
        await this.#checkError();
        // console.log("this.isError", this.isError)
        return this.isError;
    }

    #hasRuleRequired(fieldKey) {
        const { rules } = this.rules[fieldKey];
        for (let i = 0; i < rules.length; i += 1) {
            if (rules[i] === 'required') {
                return true;
            }
        }
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    #isNested(fieldKey) {
        if (fieldKey.indexOf('.') !== -1) return true;
        return false;
    }

    #hasData(fieldKey) {
        const bodyKeys = Object.keys(this.body);
        for (let i = 0; i < bodyKeys.length; i += 1) {
            if (bodyKeys[i].toString() === fieldKey.toString()) {
                return true;
            }
        }
        return false;
    }

    #getData(key) {
        const bodyKeys = Object.keys(this.body);
        for (let i = 0; i < bodyKeys.length; i += 1) {
            if (key.toString() === bodyKeys[i].toString()) {
                return this.body[key];
            }
        }
        return null;
    }

    /**
     *
     * @param {*} fieldKey  ex: name, email, username
     * @param {*} rule  ex: required, exist, match
     * @param {*} options params of rule that has params. ex: match:password, return password
     */
    #setError(fieldKey, rule, attribute, options) {
        const message = this.#setErrorMessage(fieldKey, rule, attribute, options);

        const keyError = attribute ?? fieldKey;

        this.addError(keyError, message);
    }

    addError(keyError, message) {
        if (Object.keys(this.errors).length === 0) {
            this.errors.errors = {};
        }
        if (!this.errors.errors[keyError]) {
            this.errors.errors[keyError] = [];
        }
        this.errors.errors[keyError].push(message);
    }

    /**
     *
     * @param {*} fieldKey ex: name, username, birthdate
     * @param {*} rule ex: required, email, max,min
     * @param {*} options params of rule that has params. ex: match:password
     * @returns
     */
    #setErrorMessage(fieldKey, rule, attribute, options) {
        const newAttribute = this.rules[fieldKey].attribute ?? (attribute ?? fieldKey);
        // ---------- set custom message
        if (this.rules[fieldKey].messages && this.rules[fieldKey].messages[rule]) {
            return this.rules[fieldKey].messages[rule].replace('_attribute_', newAttribute);
        }
        // ---------- set default message
        return this.#defaultErrorMessage(rule, newAttribute, options);
    }

    /**
     *
     * @param {*} rule  ex: required, match,float, min, max
     * @param {*} attribute ex: name, birthdate
     * @param {*} options   ex: match:password -> ['password'] | digit_between:1,2 -> [1,2]
     */
    #defaultErrorMessage(rule, attribute, options) {
        if (!langValidation[rule] || !langValidation[rule][this.locale]) { throw Error('message no exist'); }
        const newAttribute = attribute[0].toUpperCase() + attribute.slice(1);

        let message = langValidation[rule][this.locale].replace('_attribute_', newAttribute);

        if (options && Array.isArray(options)) {
            for (let i = 0; i < options.length; i += 1) {
                const translateParam = Translate(options[i], this.locale);
                message = message.replace((`_param${i + 1}_`).toString(), translateParam);
            }
        }

        return message.split('_').join(' ');
    }

    /**
     * checking proccess by create params from rule, get rule name, and check validation of value
     * @param {*} fieldKey  ex: name, birthdate, id,
     * @param {*} value  value of field
     * @param {*} attribute  attribute
     * @returns void
     */
    // eslint-disable-next-line consistent-return
    async #checking(fieldKey, value, attribute) {
        const { rules } = this.rules[fieldKey]; // ["required","match:password","min:1","max:2"]
        // console.log(">>>>--------------------------------------->>>>")
        // console.log(rules)
        if (!Array.isArray(rules)) {
            console.error('\x1b[31m', 'validations not an array', fieldKey, '\x1b[0m');
            return null;
        }
        let isValid = false;

        for (let i = 0; i < rules.length; i += 1) {
            // val, ex: float, required, date etc...
            // console.log("--------------")
            // console.log(rule, value)
            const rule = rules[i];

            if (typeof rule === 'object') {
                // custom rule
                await this.#processCustomRule(rule, fieldKey, value, attribute);
            }
            if (typeof rule === 'string') {
                let options;
                let ruleName;
                const hasParams = this.#isValidationHasParam(rule);
                let ruleParams;
                // ex: max:3, min:5
                if (hasParams) {
                    // console.log("CREATE PARAMS")
                    options = this.#createOptionsParams(fieldKey, rule);
                    ruleName = this.#getValidateNameFromValidationWithParams(rule);
                } else {
                    ruleName = rule;
                }
                isValid = await this.ValidationCheck(ruleName, value, { options });
                if (!isValid) {
                    if (hasParams) {
                        ruleParams = this.#getValidateParams(rule);
                        // console.info('validationParams', ruleParams);
                    }
                    this.#setError(fieldKey, ruleName, attribute, ruleParams);
                }
            }
        }
    }

    /**
     * checking custom rule validation
     * @param {*} rule
     * @param {*} fieldKey
     * @param {*} value
     * @param {*} attribute
     * @returns
     */
    async #processCustomRule(rule, fieldKey, value, attribute) {
        if (typeof rule.passes === 'undefined') throw Error('Invalid Custom rule, dont have passes() method');

        if (typeof rule.message === 'undefined') throw Error('Invalid Custom rule, dont have passes() message');
        const message = rule.message();
        if (typeof message !== 'string') throw Error('Invalid Custom rule, message() have to return string');

        const newAttribute = attribute ?? fieldKey;
        const valid = await rule.passes(newAttribute, value);
        if (typeof valid !== 'boolean') throw Error('Invalid Custom rule, passes() have to return boolean');

        if (!valid) {
            this.addError(newAttribute, message.replace('_attribute_', newAttribute));
        }
    }

    /**
    * check if a rule has params
    * @param {*} rule ex: match:oldPassword
    * @returns
    */
    // eslint-disable-next-line class-methods-use-this
    #isValidationHasParam(rule) {
        if (rule.indexOf(':') !== -1) return true;
        return false;
    }

    /**
     * get rule name if rule has params
     * @param {*} rule ex: match:oldPassword
     * @returns match
     */
    // eslint-disable-next-line class-methods-use-this
    #getValidateNameFromValidationWithParams(rule) {
        const arr = rule.split(':');
        return arr[0];
    }

    /**
     * get rule params
     * @param {*} rule ex: digit_between:1,2
     * @returns [1,2]
     */
    // eslint-disable-next-line class-methods-use-this
    #getValidateParams(rule) {
        let arr = rule.split(':');
        arr = arr.splice(1, 1);
        // console.log("arr", arr)
        // console.log("rule", rule)
        if (arr[0].indexOf(',') !== -1) {
            return arr[0].split(',');
        }
        return arr;
    }

    /**
     * create options from rule params
     * @param {*} rule ex: match:password, max:2, min:3
     * @param {*} fieldKey
     */
    #createOptionsParams(fieldKey, rule) {
        const arr = rule.split(':');
        const options = {};
        try {
            if (arr.length > 1) {
                if (arr[0] === ValidationType.match) {
                    const fieldMatch = this.#getData(arr[1]);
                    options.fieldMatch = fieldMatch;
                }
                if (arr[0] === ValidationType.max || arr[0] === ValidationType.min) {
                    const param = arr[1];
                    if (!param) throw Error(`Not right format of validation: ${rule}`);

                    if (arr[0] === ValidationType.max) { options.fieldMax = param; }
                    if (arr[0] === ValidationType.min) { options.fieldMin = param; }
                }
                if (arr[0] === ValidationType.exists) {
                    const params = arr[1].split(',');
                    if (params.length < 2) throw Error(`Not right format of validation: ${rule}`);
                    const [fieldCollectionName, fieldName, fieldException] = params;
                    options.fieldCollectionName = fieldCollectionName;
                    options.fieldName = fieldName;

                    if (params[2]) { options.fieldException = fieldException; }
                }
                if (arr[0] === ValidationType.unique) {
                    const params = arr[1].split(',');
                    if (params.length < 2) throw Error(`Not right format of validation: ${rule}`);
                    const [fieldCollectionName, fieldName, fieldException] = params;
                    options.fieldCollectionName = fieldCollectionName;
                    options.fieldName = fieldName;

                    if (params[2]) { options.fieldException = fieldException; }
                }

                if (arr[0] === ValidationType.mimetypes || arr[0] === ValidationType.mimes) {
                    const params = arr[1].split(',');
                    options.fieldMimetypes = params;
                }

                if (arr[0] === ValidationType.max_file) {
                    const params = arr[1].split(',');
                    if (params.length < 1) throw Error(`Not right format of validation: ${rule}`);

                    if (!validator.isInt(params[0]) || !this.#isValidFileUnit(params[1])) { throw Error(`Not right format of validation: ${rule}. Valid max_file:1000,MB -> [GB,MB,KB,Byte]`); }
                    const [fieldMaxSize, fieldUnit] = params;
                    options.fieldMaxSize = fieldMaxSize;
                    options.fieldUnit = fieldUnit;
                }

                if (arr[0] === ValidationType.date_after || arr[0] === ValidationType.date_before
                    || arr[0] === ValidationType.date_after_or_equal
                    || arr[0] === ValidationType.date_before_or_equal) {
                    const params = arr[1];
                    let targetDate = this.#getData(params);
                    if (!targetDate && params === 'now') { targetDate = new Date(); }
                    options.fieldDate = targetDate;
                }

                if (arr[0] === ValidationType.in_array || arr[0] === ValidationType.not_in_array) {
                    const params = arr[1].split(',');
                    if (!params) { throw Error(`Not right format of validation: ${rule}`); }
                    options.fieldArray = params;
                }

                if (arr[0] === ValidationType.digits
                    || arr[0] === ValidationType.max_digits
                    || arr[0] === ValidationType.min_digits) {
                    const params = arr[1];
                    if (!validator.isInt(params)) { throw Error(`Not right format of validation: ${rule}`); }
                    options.fieldDigits = params;
                }

                if (arr[0] === ValidationType.digits_between) {
                    const params = arr[1].split(',');
                    if (!params || params.length < 2
                        || !validator.isInt(params[0])
                        || !validator.isInt(params[1])) { throw Error(`Not right format of validation: ${rule}`); }
                    const [fieldDigitsFirst, fieldDigitsLast] = params;
                    options.fieldDigitsFirst = fieldDigitsFirst;
                    options.fieldDigitsLast = fieldDigitsLast;
                }
                if (arr[0] === ValidationType.age_lt
                    || arr[0] === ValidationType.age_lte
                    || arr[0] === ValidationType.age_gt
                    || arr[0] === ValidationType.age_gte) {
                    const params = arr[1];
                    if (!params || params < 1 || !validator.isInt(params)) { throw Error(`Not right format of validation: ${rule}`); }
                    options.fieldAge = params;
                }
            } else {
                throw Error(`Not right format of validation: ${rule}`);
            }
        } catch (error) {
            console.error('\x1b[31m', error, '\x1b[0m');
        }

        return options;
    }

    /**
     * Validation check value and rule
     * @param {*} ruleName ex: required, float
     * @param {*} value value
     * @param {*} options  ex: {fieldMax: 3 }
     * @returns boolean -> true valid, false not valid
     */
    async ValidationCheck(ruleName, value, { options }) {
        // console.log("ruleName...", ruleName)
        // console.log("field...", field)
        // console.log("options...", options)

        // ------------------------------------------------------ database
        if (ruleName === ValidationType.exists) {
            const result = await ValidationDB.exists(
                options.fieldCollectionName,
                options.fieldName,
                value,
                options.fieldException,
            );
            return result;
        }
        if (ruleName === ValidationType.unique) {
            const result = await ValidationDB.unique(
                options.fieldCollectionName,
                options.fieldName,
                value,
                options.fieldException,
            );
            return result;
        }

        // ------------------------------------------------------ has params

        if (ruleName === ValidationType.digits) {
            if (!value) { return true; }
            return (value.toString().length === parseInt(options.fieldDigits, 10));
        }
        if (ruleName === ValidationType.digits_between) {
            if (!value) { return true; }
            return (value.toString().length >= parseInt(options.fieldDigitsFirst, 10)
                && value.toString().length <= parseInt(options.fieldDigitsLast, 10));
        }
        if (ruleName === ValidationType.max_digits || ruleName === ValidationType.min_digits) {
            if (!value) { return false; }
            if (ruleName === ValidationType.max_digits) {
                return (value.toString().length <= parseInt(options.fieldDigits, 10));
            }
            return (value.toString().length >= parseInt(options.fieldDigits, 10));
        }

        if (ruleName === ValidationType.max_file) {
            if (!value) { return true; }
            const size = this.#convertByteToAnyUnit(value.size, options.fieldUnit);
            return parseFloat(size) <= parseFloat(options.fieldMaxSize);
        }

        if (ruleName === ValidationType.match) {
            if ((!value && options.fieldMatch)
                || (value && !options.fieldMatch)
                || (!value && !options.fieldMatch)) return false;
            return value.toString() === options.fieldMatch.toString();
        }

        if (ruleName === ValidationType.max) {
            if (value === null || value === undefined) { return false; }
            if (Array.isArray(value)) { return value.length <= options.fieldMax; }
            if (validator.isNumeric(value.toString())) { return validator.isFloat(value.toString() ?? '0', { max: options.fieldMax ?? ' ' }); }

            return value.toString().length <= options.fieldMax;
        }

        if (ruleName === ValidationType.min) {
            if (value === null || value === undefined) { return false; }
            if (Array.isArray(value)) { return value.length >= options.fieldMin; }
            if (validator.isNumeric(value.toString())) { return validator.isFloat(value.toString() ?? '0', { min: options.fieldMin ?? ' ' }); }

            return value.toString().length >= options.fieldMax;
        }

        if (ruleName === ValidationType.mimetypes) {
            if (!Array.isArray(options.fieldMimetypes) || !value.type) {
                return false;
            }
            return validator.isIn(value.type, options.fieldMimetypes);
        }

        if (ruleName === ValidationType.mimes) {
            if (!Array.isArray(options.fieldMimetypes) || !value.extension) return false;

            return validator.isIn(value.extension.split('.').join(''), options.fieldMimetypes);
        }
        if (ruleName === ValidationType.date_after || ruleName === ValidationType.date_before) {
            if (!options.fieldDate || !value) return false;
            const date = this.#formatDate(value);
            const dateCompare = this.#formatDate(options.fieldDate);
            if (ruleName === ValidationType.date_before) {
                return validator.isBefore(date, dateCompare);
            }
            return validator.isAfter(date, dateCompare);
        }
        if (ruleName === ValidationType.date_after_or_equal
            || ruleName === ValidationType.date_before_or_equal) {
            if (!options.fieldDate || !value) return false;

            const date = this.#formatDate(value);
            const dateCompare = this.#formatDate(options.fieldDate);

            if (ruleName === ValidationType.date_before_or_equal) {
                const isBefore = validator.isBefore(date, dateCompare);
                if (isBefore || (!isBefore && validator.equals(date, dateCompare))) { return true; }
                return false;
            }
            const isAfter = validator.isAfter(date, dateCompare);
            if (isAfter || (!isAfter && validator.equals(date, dateCompare))) { return true; }
            return false;
        }

        if (ruleName === ValidationType.in_array) {
            return validator.isIn(value, options.fieldArray);
        }
        if (ruleName === ValidationType.not_in_array) {
            return !validator.isIn(value, options.fieldArray);
        }

        if (ruleName === ValidationType.age_lt) {
            const newDate = this.#formatDate(value);
            if (!validator.isDate(newDate.toString())) { return false; }
            return this.#getAge(value) < options.fieldAge;
        }
        if (ruleName === ValidationType.age_lte) {
            const newDate = this.#formatDate(value);
            if (!validator.isDate(newDate.toString())) { return false; }
            return this.#getAge(value) <= options.fieldAge;
        }
        if (ruleName === ValidationType.age_gt) {
            const newDate = this.#formatDate(value);
            if (!validator.isDate(newDate.toString())) { return false; }
            return this.#getAge(value) > options.fieldAge;
        }
        if (ruleName === ValidationType.age_gte) {
            const newDate = this.#formatDate(value);
            if (!validator.isDate(newDate.toString())) { return false; }
            return this.#getAge(value) >= options.fieldAge;
        }

        // ------------------------------------------------------ has no params

        if (ruleName === ValidationType.image) {
            if (!value || !value.extension) { return false; }
            return validator.isIn(value.extension.split('.').join('').toLowerCase(), Object.values(this.imageFormats));
        }

        if (ruleName === ValidationType.required) {
            if (value === undefined || value === null || value === '') { return false; }
        }

        if (ruleName === ValidationType.email) { return validator.isEmail(value.toString()); }

        if (ruleName === ValidationType.boolean) { return validator.isBoolean(value.toString()); }

        if (ruleName === ValidationType.float) { return validator.isFloat((value ?? '').toString()); }

        if (ruleName === ValidationType.integer) { return validator.isInt((value ?? '').toString()); }

        if (ruleName === ValidationType.date) {
            const newDate = this.#formatDate(value);
            return validator.isDate(newDate.toString());
        }

        if (ruleName === ValidationType.string) { return (typeof value === 'string'); }

        if (ruleName === ValidationType.array) { return (Array.isArray(value)); }

        if (ruleName === ValidationType.ip) { return validator.isIP(value); }

        if (ruleName === ValidationType.url) { return validator.isURL(value); }

        if (ruleName === ValidationType.json) { return validator.isJSON(value); }

        return true;
    }

    /**
     * change date format so can be using for validation check
     * @param {*} date
     * @returns
     */
    // eslint-disable-next-line class-methods-use-this
    #formatDate(date) {
        try {
            const d = new Date(date);
            let month = `${d.getMonth() + 1}`;
            let day = `${d.getDate()}`;
            const year = d.getFullYear();

            if (month.length < 2) { month = `0${month}`; }
            if (day.length < 2) { day = `0${day}`; }
            return [year, month, day].join('/');
        } catch (error) {
            console.error(Error);
        }
        return date;
    }

    /**
     * file size units
     */
    fileUnits = {
        GB: 'GB', MB: 'MB', KB: 'KB', Byte: 'Byte',
    };

    /**
     * image formats
     */
    imageFormats = {
        jpg: 'jpg',
        jpeg: 'jpeg',
        png: 'png',
        bmp: 'bmp',
        gif: 'gif',
        svg: 'svg',
        webp: 'webp',
    };

    // eslint-disable-next-line class-methods-use-this
    #getAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }
        return age;
    }

    /**
     * check if unit input is valid
     * @param {*} unitFile
     * @returns
     */
    #isValidFileUnit(unitFile) {
        const unitKeys = Object.keys(this.fileUnits);
        for (let i = 0; i < unitKeys.length; i += 1) {
            const unit = unitKeys[i];
            if (unitFile === unit) { return true; }
        }
        return false;
    }

    /**
     * convert size in byte to any unit
     * @param {*} sizeInByte
     * @param {*} unit
     * @returns
     */
    #convertByteToAnyUnit(sizeInByte, unit) {
        if (unit === this.fileUnits.KB) {
            return (sizeInByte / 1024).toFixed(2);
        }

        if (unit === this.fileUnits.MB) { return (sizeInByte / 1048576).toFixed(2); }

        if (unit === this.fileUnits.GB) { return (sizeInByte / 1073741824).toFixed(2); }

        return sizeInByte;
    }

    // --------------------------------------------------------------------------- nested process

    /**
     * If rule is nested, then proccess to get value begins here
     * @param {*} fieldKey
     */
    async #nestedProcess(fieldKey) {
        // console.log("start nested validation for " + fieldKey)
        const fieldArray = fieldKey.split('.');
        await this.#recursizeNested(fieldKey, fieldArray, this.body, '', 0);
    }

    /**
     * recursive function to check into deep nested value.
     * the purpose is found the value from field body
     * @param {*} fieldKey item.*.name
     * @param {*} fieldArray [item, * , name]
     * @param {*} attribute  default is ""
     * @param {*} currentField this.body[item] |  this.body[item][0] | this.body[item][0][name]
     * @param {*} indexNested default is 0
     * @returns
     */
    async #recursizeNested(fieldKey, fieldArray, currentField, attribute, indexNested) {
        // console.log("-----------------------------------" + indexNested)
        // console.log("fieldArray", fieldArray)
        // console.log("currentField", currentField)
        // console.log("----------------------------------.")
        // if (!currentField) {
        //     console.log("field not found", currentField)
        //     return
        // }

        if (!indexNested <= fieldArray.length) {
            // validation in here
            if (indexNested === fieldArray.length) {
                // console.log("validation: ",)
                // console.log("data-> ", currentField)
                // console.log("attribute-> ",)

                // fieldKey -> item.*.name -> used for get validation rule
                // currentField -> value of name from this.body object
                // attribute slice 1 means-> .item.0.name -> item.0.name
                await this.#checking(fieldKey, currentField, attribute.slice(1));
            } else if (fieldArray[indexNested] === '*') {
                if (!Array.isArray(currentField)) {
                    // console.log("current field not an array")
                    return;
                }
                for (let i = 0; i < currentField.length; i += 1) {
                    await this.#recursizeNested(fieldKey, fieldArray, currentField[i], `${attribute}.${i}`, indexNested + 1);
                }
            } else if (currentField) {
                // eslint-disable-next-line consistent-return
                return this.#recursizeNested(
                    fieldKey,
                    fieldArray,
                    currentField[fieldArray[indexNested]],
                    `${attribute}.${fieldArray[indexNested]}`,
                    indexNested + 1,
                );
            }
        }
    }
}

export default RequestValidation;
