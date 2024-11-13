import * as UI from './ui.js';
import * as TR from './translate.js';
import * as CNT from './content.js';
console.log('Hello! This is the PAPIERTIGER going to work!');
const DEFAULT_LANGUAGE = 'de-DE';
export class Params {
    constructor() {
        this.basedir = './';
        this.language = DEFAULT_LANGUAGE;
        this.list = '';
        this.scrollmenu = 'enable';
        this.mode = 'App';
    }
}
;
let PARAMS;
const run = () => {
    PARAMS = parseURL();
    TR.init(PARAMS);
    CNT.init(PARAMS);
    UI.init(PARAMS);
    if (PARAMS.mode === 'ContentEditor') {
        loadContentList();
    }
    else {
        loadSourceList(PARAMS.list);
    }
};
export const parseURL = () => {
    const parsedURL = new URL(window.location.href);
    const params = new Params();
    if (parsedURL.searchParams.has('mode')) {
        const mode = parsedURL.searchParams.get('mode');
        if (mode &&
            ['App', 'EntityEditor', 'ContentEditor'].indexOf(mode) > -1) {
            params.mode = mode;
            console.log(`Mode: ${mode}`);
        }
    }
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language');
    }
    if (isIOS()) {
        params.scrollmenu = 'disable';
    }
    if (parsedURL.searchParams.has('scrollmenu')) {
        params.scrollmenu =
            parsedURL.searchParams.get('scrollmenu') === 'enable' ?
                'enable' : 'disable';
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list');
    }
    return params;
};
export const load = async (file, type) => {
    return fetch(file)
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => {
        return type === 'json' ? result.json() : result.text();
    })
        .catch(() => {
        console.error(`Processing of response to request for "${file}" failed`);
        return Promise.reject();
    });
};
export const loadCollection = async (name) => {
    return load('./data/' + name + '.json', 'json')
        .then((data) => {
        console.log('Collection fetched.');
        return data;
    });
};
export const loadCollectionAndRun = (name, label) => {
    loadCollection(name)
        .then((data) => {
        UI.getComponent('EntityCollection').update(data, PARAMS.mode);
        UI.getComponent('Header').updateSourceIndicator(label);
    });
};
export const loadContent = (content) => {
    UI.getComponent('ContentEditor').update(content);
    UI.getComponent('Header').updateSourceIndicator(content);
};
const loadSourceList = (list) => {
    load('./data/list.json', 'json')
        .then((data) => {
        console.log('List fetched.');
        UI.getComponent('SourceList').clear();
        if (data.list.length > 0) {
            let result = [];
            result = data.list.filter((item) => {
                UI.getComponent('SourceList').addSourceItem(item.name, item.label, () => {
                    loadCollectionAndRun(item.name, item.label);
                });
                return item.name === list;
            });
            if (result.length > 0) {
                loadCollectionAndRun(result[0].name, result[0].label);
            }
            else {
                loadCollectionAndRun(data.list[0].name, data.list[0].label);
            }
        }
    });
};
const loadContentList = () => {
    load('./content/list.json', 'json')
        .then((data) => {
        console.log('List fetched.');
        UI.getComponent('SourceList').clear();
        if (data.list.length > 0) {
            data.list.forEach((item) => {
                UI.getComponent('SourceList').addSourceItem(item.source, item.source, () => {
                    loadContent(item.source);
                });
            });
            loadContent(data.list[0].source);
        }
    });
};
export const saveCollection = () => {
    const data = UI.getComponent('EntityCollection').data;
    saveData([{
            path: `data/${data.name}.json`,
            type: 'collection',
            content: data
        }]);
};
export const saveContent = () => {
    const contentID = UI.getComponent('ContentEditor').contentID;
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
export const saveData = (data) => {
    const xhr = new XMLHttpRequest();
    const url = 'save_data.php';
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const json = JSON.parse(xhr.responseText);
            if (json.status === 'success') {
                UI.getComponent('Dialog').showInfo('success_saved');
            }
            else {
                UI.getComponent('Dialog').showInfo('error_not_saved');
            }
        }
    };
    xhr.send(JSON.stringify(data));
};
let EVENTLISTENERS = {
    'languageloaded': [],
};
export const addEventListener = (on, fn) => {
    EVENTLISTENERS[on].push(fn);
};
export const emitEvent = (event) => {
    EVENTLISTENERS[event].forEach((fn) => {
        fn();
    });
};
if ('serviceWorker' in navigator && navigator.userAgent.indexOf('Firefox') === -1) {
    navigator.serviceWorker
        .register('js/sw.js', { type: 'module' })
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.log('Error registering service worker!', err));
}
;
const isIOS = () => {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};
run();
