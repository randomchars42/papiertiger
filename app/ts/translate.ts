import * as APP from './app.js';

let dictionary: {[key: string]: string} = {};

export const init = (params: APP.Params): void => {
    loadLanguage(params.language);
};

const loadLanguage = (code: string): void => {
    APP.load(`./lang/${code.substring(0, 2)}.json`, 'json')
    .then((data: any) => {
        console.log('Language data fetched.');
        let found_region: string = '';
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
        console.log('Language loaded')
        APP.emitEvent('languageloaded');
    });
};

interface Dictionary extends Iterable<string> {
    [key: string]: string
};

export const tr = (expr: string, variables: {[key: string]: string} = {},
                   def: string = ''): string => {
    if (expr in dictionary) {
        let result: string = dictionary[expr];
        for (let variable in variables) {
            result = result.replaceAll(
                '${' + variable + '}', variables[variable]);
        }
        return result;
    } else if (def !== '') {
        return def;
    } else {
        return expr;
    }
};

const translatePage = (): void => {
    document.querySelectorAll('[data-i18n-key]').forEach((element: Element) => {
        let def: string = element.textContent || '';
        element.textContent = tr(element.getAttribute('data-i18n-key') || '',
                                 {}, def);
    });
};

const setLanguage = (code: string): void => {
    document.querySelectorAll('[lang]').forEach((element: Element) => {
        (element as HTMLElement).lang = code;
    });
};
