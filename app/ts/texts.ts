import * as APP from './app.js';

let BASEDIR: string = '';
let FETCH_TYPE: string = 'page';

export const init = (params: APP.Params): void => {
    BASEDIR = params.basedir;

    if (BASEDIR === '../') {
        FETCH_TYPE = 'source';
    }
};

const loadText = (text: string, parent: HTMLElement): void => {
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
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

export const appendText = (text: string, parent: HTMLElement): void => {
    loadText(text, parent);
};
