import * as UI from './ui.js';
let BASEDIR = '';
let FETCH_TYPE = 'page';
export const init = (params) => {
    BASEDIR = params.basedir;
    if (BASEDIR === '../') {
        FETCH_TYPE = 'source';
    }
};
const loadText = (text, parent) => {
    console.log(`${BASEDIR}texts/${text}`);
    fetch(`${BASEDIR}texts/${text}`)
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => { return result.text(); })
        .then((data) => {
        console.log('Text fetched.');
        parent.innerHTML = data;
        parent.querySelectorAll('a').forEach((element) => {
            const anchor = element;
            anchor.onclick = (event) => {
                UI.displayText(anchor.getAttribute('href'));
                event.preventDefault();
                event.stopPropagation();
            };
        });
    })
        .catch((reason) => {
        console.error(reason);
    });
};
export const appendText = (text, parent) => {
    loadText(text, parent);
};
