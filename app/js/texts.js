let BASEDIR = '';
let FETCH_TYPE = 'page';
export const init = (params) => {
    BASEDIR = params.basedir;
    if (BASEDIR === '../') {
        FETCH_TYPE = 'source';
    }
};
const loadText = (text, parent) => {
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
    })
        .catch((reason) => {
        console.error(reason);
    });
};
export const appendText = (text, parent) => {
    loadText(text, parent);
};
