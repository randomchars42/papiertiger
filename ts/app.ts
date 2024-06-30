/**
 *
 */
import * as UI from './ui.js';
import * as TR from './translate.js';

console.log('Hello! This is the PAPIERTIGER going to work!');

const run = (): void => {
    UI.init();
    TR.initLanguage('de-DE');
    loadDataList();
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
        UI.clearInputElements(document.getElementById('MainInput')!);
        UI.generateInputElements(data, document.getElementById('MainInput')!);
        UI.displayCurrentListItem(label);
        UI.toggleExtended();
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

const loadDataList = (): void => {
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
        UI.generateListElements(data.list, document.getElementById('MainList')!);
        if (data.list.length > 0) {
            loadData(data.list[0].label, data.list[0].name);
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
