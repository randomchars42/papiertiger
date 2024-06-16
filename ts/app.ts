/**
 *
 */
import * as UI from './ui.js';

console.log('Hello! This is the app going to work!');

type ListItem = {
    name: string,
    label: string,
}

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

const clearInputElements = (parent: HTMLElement): void => {
    parent.textContent = '';
}

const generateInputElements = (collection: ItemCollection[], parent: HTMLElement): void => {
    collection.forEach((collection: ItemCollection): void => {
        UI.addHeading(collection.label, parent);
        collection.items.forEach((itemrow: Item[]): void => {
            const row = UI.addRow(parent);
            itemrow.forEach((item: Item): void => {
                UI.addItem(item.label, item.text, row, item.type, item.del, item.cat);
            });
        });
    });
};

const generateListElements = (list: ListItem[], parent: HTMLElement): void => {
    list.forEach((item: ListItem): void => {
        UI.addListItem(item.label, item.name, parent);
    });
};

const run = (): void => {
    UI.init();
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
        clearInputElements(document.getElementById('MainInput')!);
        generateInputElements(data, document.getElementById('MainInput')!);
        UI.displayCurrentListItem(label);
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
        console.log(data);
        generateListElements(data.list, document.getElementById('MainList')!);
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
        .catch(err => console.log('Oh no!', err));
}

run();
