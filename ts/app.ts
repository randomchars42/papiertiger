/**
 *
 */
import * as UI from './ui.js';

console.log('Hello! This is the app going to work!');

type Item = {
    type: string,
    del: number,
    cat: string,
    label: string,
    text: string,
}

type ItemRow = Item[]

type ItemCollection = {
    label: string,
    items: ItemRow[],
}

const generateInputElements = (collection: ItemCollection[], parent: HTMLElement): void => {
    collection.forEach((collection: ItemCollection): void => {
        UI.addHeading(collection.label, parent);
        collection.items.forEach((itemrow: Item[]): void => {
            const row = UI.addRow(parent);
            itemrow.forEach((item: Item): void => {
                UI.addItem(item.label, item.text!, row, item.type, item.del, item.cat);
            });
        });
    });
};

const run = (): void => {
    fetch('./data/data.json')
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.json();})
    .then((data: any): void => {
        console.log('Data fetched.');
        UI.init();
        generateInputElements(data, document.getElementById('MainInput')!);
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

if('serviceWorker' in navigator && navigator.userAgent.indexOf('Firefox') === -1) {
    navigator.serviceWorker
        .register('js/sw.js', { type: 'module' })
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.log('Oh no!', err));
}

run();
