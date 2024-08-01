import * as UI from './texteditor_ui.js';
import * as TR from './translate.js';
console.log('Hello! This is the PAPIERTIGER going to work!');
const DEFAULT_LANGUAGE = 'de-DE';
export class Params {
    constructor() {
        this.basedir = '../';
        this.language = DEFAULT_LANGUAGE;
        this.list = '';
        this.scrollmenu = 'enable';
    }
}
;
const run = () => {
    const params = parseURL();
    UI.init(() => {
        const md = markdownit();
        UI.setOutput(md.render(UI.getSource()));
    });
    TR.init(params);
    loadTextList(params);
};
export const parseURL = () => {
    const parsedURL = new URL(window.location.href);
    const params = new Params();
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language');
    }
    if (parsedURL.searchParams.has('scrollmenu')) {
        params.scrollmenu = parsedURL.searchParams.get('scrollmenu');
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list');
    }
    return params;
};
export const loadText = (item) => {
    const md = markdownit();
    fetch(`../texts/${item.source}${item.name}.md`)
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => { return result.text(); })
        .then((text) => {
        console.log('Data fetched.');
        UI.displayCurrentListItem(`${item.destination}${item.name}`);
        UI.setSource(text);
        UI.setOutput(md.render(text));
    })
        .catch((reason) => {
        console.error(reason);
    });
    UI.setOnSubmit(() => {
        UI.setOutput(md.render(UI.getSource()));
        const xhr = new XMLHttpRequest();
        const url = `save_data.php?file=${item.name}`;
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const json = JSON.parse(xhr.responseText);
                console.log(json);
                UI.clearEditor();
                if (json.status === 'success') {
                    UI.showSubmitSuccess();
                }
                else {
                    UI.showSubmitError();
                }
            }
        };
        xhr.send(JSON.stringify({ ...{
                "md": UI.getSource(),
                "html": md.render(UI.getSource())
            }, ...item }));
    });
};
const loadTextList = (params) => {
    fetch(`${params.basedir}/texts/list.json`)
        .then((response) => {
        if (!response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
        .then((result) => { return result.json(); })
        .then((data) => {
        console.log('List fetched.');
        UI.generateListElements(data.list, document.getElementById('MainList'));
        if (data.list.length > 0) {
            let result = [];
            result = data.list.filter((col) => {
                return col.name === params.list;
            });
            if (result.length > 0) {
                loadText(result[0]);
            }
            else {
                loadText(data.list[0]);
            }
        }
    })
        .catch((reason) => {
        console.error(reason);
    });
};
run();
