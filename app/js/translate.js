import * as APP from './app.js';
let dictionary = {};
export const init = (params) => {
    loadLanguage(params.language);
};
const loadLanguage = (code) => {
    APP.load(`./lang/${code.substring(0, 2)}.json`, 'json')
        .then((data) => {
        console.log('Language data fetched.');
        let found_region = '';
        for (let key in data.regions) {
            if (data.regions[key].region === code) {
                found_region = code;
                dictionary = data.regions[key].dict;
            }
        }
        if (found_region === '') {
            found_region = data.regions[0].region;
            dictionary = data.regions[0].dict;
        }
        translatePage();
        setLanguage(found_region);
        console.log('Language loaded');
        APP.emitEvent('languageloaded');
    });
};
;
export const tr = (expr, variables = {}, def = '') => {
    if (expr in dictionary) {
        let result = dictionary[expr];
        for (let variable in variables) {
            result = result.replaceAll('${' + variable + '}', variables[variable]);
        }
        return result;
    }
    else if (def !== '') {
        return def;
    }
    else {
        return expr;
    }
};
const translatePage = () => {
    document.querySelectorAll('[data-i18n-key]').forEach((element) => {
        let def = element.textContent || '';
        element.textContent = tr(element.getAttribute('data-i18n-key') || '', {}, def);
    });
};
const setLanguage = (code) => {
    document.querySelectorAll('[lang]').forEach((element) => {
        element.lang = code;
    });
};
