import localeConfig from '../config/Locale.js';

class Locale {
    /**
     * checking locale code
     * @param {*} locale
     * @returns bolean
     */
    static isLocale = (locale) => {
        if (Object.values(localeConfig.locales).includes(locale)) { return true; }

        return false;
    };

    /**
     * create rule base on locale
     * @param {*} param0
     * @returns
     */
    static createRule({ key = '', rules = [] }) {
        const req = {};
        Object.values(localeConfig.locales).forEach((e) => {
            req[`${key}_${e}`] = {};
            req[`${key}_${e}`].rules = rules;
        });
        return req;
    }

    /**
     * create field base on data format like
     * data { name_en :"data", name_id:"data"} to  {en:"data",id:"data"}
     * @param {*} param0
     */
    static createField({ key = '', data = {} }) {
        const fields = {};

        localeConfig.locales.forEach((locale) => {
            // for (const d in data) {
            data.forEach((d) => {
                const splitData = d.split('_');
                const lastChar = splitData.pop();
                const prefix = splitData.join('_');
                if (prefix === key && lastChar === locale) {
                    fields[locale] = data[d];
                }
            });
        });
        return fields;
    }
}

export default Locale;
