/**
 *
 */
import * as UI from './texteditor_ui.js';
import * as TR from './translate.js';

console.log('Hello! This is the PAPIERTIGER going to work!');

const DEFAULT_LANGUAGE: string = 'de-DE';

export class Params {
    basedir: string = '../';
    language: string = DEFAULT_LANGUAGE;
    list: string = '';
    scrollmenu: string = 'enable';
};

const run = (): void => {
    const params: Params = parseURL();
    UI.init((): void => {
        const md = markdownit();
        UI.setOutput(md.render(UI.getSource()));
    });
    TR.init(params);
    loadTextList(params);
};

export const parseURL = (): Params => {
    const parsedURL = new URL(window.location.href);
    const params: Params = new Params();
    if (parsedURL.searchParams.has('language')) {
        params.list = parsedURL.searchParams.get('language')!;
    }
    if (parsedURL.searchParams.has('scrollmenu')) {
        params.scrollmenu = parsedURL.searchParams.get('scrollmenu')!;
    }
    if (parsedURL.searchParams.has('list')) {
        params.list = parsedURL.searchParams.get('list')!;
    }
    return params;
};

export const loadText = (item: UI.TextListItem): void => {
    const md = markdownit();
    fetch(`../texts/${item.source}`)
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.text();})
    .then((text: string): void => {
        console.log('Data fetched.');
        UI.displayCurrentListItem(`${item.source}`);
        UI.setSource(text);
        UI.setOutput(md.render(text));
    })
    .catch((reason: any): void => {
        console.error(reason);
    });

    UI.setOnSubmit((): void => {
        UI.setOutput(md.render(UI.getSource()));
        const xhr: XMLHttpRequest = new XMLHttpRequest();
        const url: string = `save_data.php`;
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onreadystatechange = (): void => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const json: any = JSON.parse(xhr.responseText);
                console.log(json);
                UI.clearEditor();
                if (json.status === 'success') {
                    UI.showSubmitSuccess();
                } else {
                    UI.showSubmitError();
                }
            }
        };
        xhr.send(JSON.stringify({...{
            "md": UI.getSource(),
            "html": md.render(UI.getSource())//UI.getOutput()
        }, ...item}));
    });
};

const loadTextList = (params: Params): void => {
    fetch(`${params.basedir}/texts/list.json`)
    .then((response: Response): Response => {
        if (! response.ok) {
            throw new Error(`Failed with HTTP code ${response.status}`);
        }
        return response;
    })
    .then((result: Response): Promise<any> => {return result.json();})
    .then((data: any): void => {
        console.log('List fetched.');
        UI.generateListElements(data.list,
                                document.getElementById('MainList')!);
        if (data.list.length > 0) {
            let result: UI.TextListItem[] = [];
            result = data.list.filter((col: UI.TextListItem) => {
                return col.source === params.list;
            });
            if (result.length > 0) {
                loadText(result[0]);
            } else {
                loadText(data.list[0]);
            }
        }
    })
    .catch((reason: any): void => {
        console.error(reason);
    });
};

run();
