import * as UI from './ui.js';
import * as TR from './translate.js';
console.log('Hello! This is the PAPIERTIGER going to work!');
const DEFAULT_LANGUAGE = 'de-DE';
const run = () => {
    const params = parseURL();
    UI.init();
    TR.initLanguage(params.language || DEFAULT_LANGUAGE);
    loadDataList(params.list);
};
export const parseURL = () => {
    const parsedURL = new URL(window.location.href);
    const params = { 'language': '', 'list': '' };
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language');
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list');
    }
    return params;
};
export const loadData = (label, name) => {
    fetch('./data/' + name + '.json')
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => { return result.json(); })
        .then((data) => {
        console.log('Data fetched.');
        UI.clearInputElements(document.getElementById('MainInput'));
        UI.generateInputElements(data, document.getElementById('MainInput'));
        UI.displayCurrentListItem(label);
        UI.toggleExtended();
    })
        .catch((reason) => {
        console.error(reason);
    });
};
const loadDataList = (list) => {
    fetch('./data/list.json')
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => { return result.json(); })
        .then((data) => {
        console.log('List fetched.');
        console.log('Requested list: ' + list);
        UI.generateListElements(data.list, document.getElementById('MainList'));
        if (data.list.length > 0) {
            let result = [];
            result = data.list.filter((col) => {
                return col.name === list;
            });
            if (result.length > 0) {
                loadData(result[0].label, result[0].name);
            }
            else {
                loadData(data.list[0].label, data.list[0].name);
            }
        }
    })
        .catch((reason) => {
        console.error(reason);
    });
};
if ('serviceWorker' in navigator && navigator.userAgent.indexOf('Firefox') === -1) {
    navigator.serviceWorker
        .register('js/sw.js', { type: 'module' })
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.log('Error registering service worker!', err));
}
run();
