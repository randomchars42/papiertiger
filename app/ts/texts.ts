import * as APP from './app.js';
import * as UI from './ui.js';

let BASEDIR: string = '';
let FETCH_TYPE: string = 'page';

export const init = (params: APP.Params): void => {
    BASEDIR = params.basedir;

    if (BASEDIR === '../') {
        FETCH_TYPE = 'source';
    }
};

const loadText = (text: string, parent: HTMLElement): void => {
    console.log(`${BASEDIR}texts/${text}`);
    fetch(`${BASEDIR}texts/${text}`)
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.text();})
    .then((data: any): void => {
        console.log('Text fetched.');
        parent.innerHTML = data;

        parent.querySelectorAll('a').forEach(
            (element: Element): void => {
                const anchor: HTMLAnchorElement = (element as HTMLAnchorElement);
                anchor.onclick = (event: Event): void => {
                    UI.displayText(anchor.getAttribute('href')!);
                    event.preventDefault();
                    event.stopPropagation();
                };
            });
        })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

export const appendText = (text: string, parent: HTMLElement): void => {
    loadText(text, parent);
};
