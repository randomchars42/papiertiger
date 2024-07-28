let dictionary: {[key: string]: string} = {};

const loadLanguage = (code: string): void => {
    fetch('./lang/' + code.substring(0, 2) + '.json')
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.json();})
    .then((data: any): void => {
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
    })
    .catch((reason: any): void => {
        console.error(reason);
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

export const initLanguage = (code: string): void => {
    loadLanguage(code);
};
