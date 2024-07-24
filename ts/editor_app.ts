/**
 *
 */
import * as UI from './editor_ui.js';
import * as TR from './translate.js';

console.log('Hello! This is the PAPIERTIGER going to work!');

const DEFAULT_LANGUAGE: string = 'de-DE';

export type Params = {
    language: string,
    list: string,
};

const run = (): void => {
    const params: Params = parseURL();
    UI.init();
    TR.initLanguage(params.language || DEFAULT_LANGUAGE);
    loadDataList(params.list);
};

export const parseURL = (): Params => {
    const parsedURL = new URL(window.location.href);
    const params: Params = {'language': '', 'list': ''};
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language')!;
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list')!;
    }
    return params;
};

export const loadData = (label: string, name: string): void => {
    fetch('./data/' + name + '.json')
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.json();})
    .then((data: any): void => {
        console.log('Data fetched.');
        UI.clearEditElements(document.getElementById('MainInput')!);
        UI.generateEditElements(data, document.getElementById('MainInput')!);
        UI.displayCurrentListItem(label);
        UI.setOnSubmit((): void => {
            //showEditSuccess();
            const xhr: XMLHttpRequest = new XMLHttpRequest();
            const url: string = `save_data.php?file=${name}`;
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = (): void => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    console.log(xhr.responseText);
                    //const json: any = JSON.parse(xhr.responseText);
                    //console.log(json);
                }
            };
            var data = JSON.stringify(UI.CONTENT);
            xhr.send(data);
        });
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

const loadDataList = (list: string): void => {
    fetch('./data/list.json')
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.json();})
    .then((data: any): void => {
        console.log('List fetched.');
        UI.generateListElements(data.list,
                                document.getElementById('MainList')!);
        if (data.list.length > 0) {
            let result: UI.ListItem[] = [];
            result = data.list.filter((col: UI.ListItem) => {
                return col.name === list;
            });
            if (result.length > 0) {
                loadData(result[0].label, result[0].name);
            } else {
                loadData(data.list[0].label, data.list[0].name);
            }
        }
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

if('serviceWorker' in navigator && navigator.userAgent.indexOf('Firefox') === -1) {
    navigator.serviceWorker
        .register('js/sw.js', { type: 'module' })
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.log('Error registering service worker!', err));
}

run();
