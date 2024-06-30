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
        for (let key in data.region) {
            if (data.region[key].region === code) {
                found_region = code;
                dictionary = data.region[key].dict;
            }
        }

        if (found_region === '') {
            found_region = data.region[0].region;
            dictionary = data.region[0].dict;
        }

        translatePage();
        setLanguage(found_region);
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

export const tr = (expr: string, def: string = ''): string => {
    if (expr in dictionary) {
        return dictionary[expr];
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
                                 def);
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
