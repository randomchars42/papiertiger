/**
 *
 */
import * as UI from './ui.js';
import * as TR from './translate.js';
import * as CNT from './content.js';

console.log('Hello! This is the PAPIERTIGER going to work!');

const DEFAULT_LANGUAGE: string = 'de-DE';

export class Params {
    basedir: string = './';
    language: string = DEFAULT_LANGUAGE;
    list: string = '';
    scrollmenu: 'enable'|'disable' = 'enable';
    mode: 'App'|'EntityEditor'|'ContentEditor' = 'App';
};

type POSTRequest = {
    path: string,
    type: 'source'|'page'|'collection',
    content: UI.CollectionData|string,
}[];

let PARAMS: Params;

const run = (): void => {
    PARAMS = parseURL();
    TR.init(PARAMS);
    CNT.init(PARAMS);
    UI.init(PARAMS);
    if (PARAMS.mode === 'ContentEditor') {
        loadContentList();
    } else {
        loadSourceList(PARAMS.list);
    }
};

export const parseURL = (): Params => {
    const parsedURL = new URL(window.location.href);
    const params: Params = new Params();
    if (parsedURL.searchParams.has('mode')) {
        const mode: string|null = parsedURL.searchParams.get('mode');
        if (mode &&
            ['App', 'EntityEditor', 'ContentEditor'].indexOf(mode) > -1) {
            params.mode = (mode as 'App'|'EntityEditor'|'ContentEditor');
            console.log(`Mode: ${mode}`);
        }
    }
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language')!;
    }
    if (parsedURL.searchParams.has('scrollmenu')) {
        params.scrollmenu =
            parsedURL.searchParams.get('scrollmenu') === 'enable' ?
                'enable' : 'disable';
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list')!;
    }
    return params;
};

type LoadTypeNames = 'string' | 'json'

type LoadType<T> =
    T extends 'string' ? string :
    T extends 'json' ? any :
    never;

export const load = async <T extends LoadTypeNames>(file: string, type: T): Promise<T> => {
    return fetch(file)
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<LoadType<T>> => {
        return type === 'json' ? result.json() : result.text();
    })
    .catch((): Promise<T> => {
        console.error(`Processing of response to request for "${file}" failed`);
        return Promise.reject()
    });
}

export const loadCollection = async (name: string): Promise<UI.CollectionData> => {
    return load('./data/' + name + '.json', 'json')
    .then((data: any): UI.CollectionData => {
        console.log('Collection fetched.');
        return data;
    });
};

export const loadCollectionAndRun = (name: string, label: string): void => {
    loadCollection(name)
    .then((data: any): void => {
        UI.getComponent('EntityCollection').update(data, PARAMS.mode);
        UI.getComponent('Header').updateSourceIndicator(label);
    });
};

export const loadContent = (content: string): void => {
    UI.getComponent('ContentEditor').update(content);
    UI.getComponent('Header').updateSourceIndicator(content);
};

const loadSourceList = (list: string): void => {
    load('./data/list.json', 'json')
    .then((data: any): void => {
        console.log('List fetched.');
        UI.getComponent('SourceList').clear();
        if (data.list.length > 0) {
            let result: UI.SourceListItem[] = [];
            result = data.list.filter((item: UI.SourceListItem) => {
                UI.getComponent('SourceList').addSourceItem(
                    item.name, item.label, (): void => {
                    loadCollectionAndRun(item.name, item.label);
                });
                return item.name === list;
            });
            if (result.length > 0) {
                loadCollectionAndRun(result[0].name, result[0].label);
            } else {
                loadCollectionAndRun(data.list[0].name, data.list[0].label);
            }
        }
    });
};

const loadContentList = (): void => {
    load('./content/list.json', 'json')
    .then((data: any): void => {
        console.log('List fetched.');
        UI.getComponent('SourceList').clear();
        if (data.list.length > 0) {
            data.list.forEach((item: UI.ContentData) => {
                UI.getComponent('SourceList').addSourceItem(
                    item.source, item.source, (): void => {
                    loadContent(item.source);
                });
            });
            loadContent(data.list[0].source);
        }
    });
};

export const saveCollection = (): void => {
    const data: UI.CollectionData = UI.getComponent('EntityCollection').data;
    saveData([{
        path: `data/${data.name}.json`,
        type: 'collection',
        content: data
    }]);
};

export const saveContent = (): void => {
    const contentID: string = UI.getComponent('ContentEditor').contentID;
    saveData([
        {
            path: CNT.getAddress(contentID, true),
            type: 'source',
            content: UI.getComponent('ContentEditor').md,
        },
        {
            path: CNT.getAddress(contentID, false),
            type: 'page',
            content: UI.getComponent('ContentEditor').html,
        },
    ]);
};

export const saveData = (data: POSTRequest): void => {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const url: string = 'save_data.php';
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = (): void => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const json: any = JSON.parse(xhr.responseText);
            if (json.status === 'success') {
                UI.getComponent('Dialog').showInfo('success_saved');
            } else {
                UI.getComponent('Dialog').showInfo('error_not_saved');
            }
        }
    };
    xhr.send(JSON.stringify(data));
};

type EventCallback = () => void;

type EventListeners = {
    'languageloaded': EventCallback[]
};

let EVENTLISTENERS: EventListeners = {
    'languageloaded': [],
};

export const addEventListener = (on: keyof EventListeners, fn: EventCallback): void => {
    EVENTLISTENERS[on].push(fn);
};

export const emitEvent = (event: keyof EventListeners): void => {
    EVENTLISTENERS[event].forEach((fn: EventCallback) => {
        fn();
    });
};

if ('serviceWorker' in navigator && navigator.userAgent.indexOf('Firefox') === -1) {
    navigator.serviceWorker
        .register('js/sw.js', { type: 'module' })
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.log('Error registering service worker!', err));
};

run();
