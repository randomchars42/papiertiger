/**
 */
import * as APP from './texteditor_app.js';
import * as TR from './translate.js';
import {VERSION} from './constants.js';

export type TextListItem = {
    source: string,
    page: string;
}

export const init = (onConvertMarkdown: () => void): void => {
    console.log('initiating ...');

    document.getElementById('ListItemDisplay')!.onclick = showList;
    document.getElementById('ListModal')!.onclick = hideList;
    document.getElementById('ConvertButton')!.onclick = onConvertMarkdown;
    document.getElementById('HelpButton')!.onclick = (): void => {
        alert(TR.tr('page_about', {'version': VERSION}));
    };
    document.getElementById('MainHTMLOutput')!.onsubmit = (event: Event) => {
        event?.preventDefault()
    };
    document.getElementById('MainTextEditor')!.onsubmit = (event: Event) => {
        event?.preventDefault()
    };
    clearEditor();
    console.log('UI initiated.')
};

export const setOnSubmit = (onSubmit: () => void): void => {
    document.getElementById('SubmitButton')!.onclick = (): void => {
        if (window.confirm(TR.tr('confirmation_save'))) {
            onSubmit();
        }
    }
};

export const setSource = (text: string): void => {
    (document.getElementById('MainTextEditor') as HTMLTextAreaElement).value = text;
};

export const setOutput = (text: string): void => {
    document.getElementById('MainHTMLOutput')!.innerHTML = text;
};

export const getSource = (): string => {
    return (document.getElementById('MainTextEditor') as HTMLTextAreaElement).value;
};

export const getOutput = (): string => {
    return document.getElementById('MainHTMLOutput')!.innerHTML;
};

export const showSubmitSuccess = (): void => {
    alert(TR.tr('success_saved'));
};

export const showSubmitError = (): void => {
    alert(TR.tr('error_not_saved'));
};

export const clearEditor = (): HTMLElement => {
    const container: HTMLElement = document.getElementById('MainTextEditor')!;
    container.textContent = '';
    return container;
};

export const generateListElements = (list: TextListItem[],
                                     parent:HTMLElement): void => {
    list.forEach((item: TextListItem): void => {
        addListItem(item, parent);
    });
};


const addListItem = (item: TextListItem,
                     parent: HTMLElement): void => {
    const button: HTMLButtonElement = document.createElement('button');
    button.textContent = item.source;
    button.onclick = () => {
        APP.loadText(item);
        hideList();
    };
    button.classList.add('control', 'control_variable_width', 'item',
                         'item_def');

    parent.appendChild(button);
};

export const displayCurrentListItem = (label: string): void => {
    const display: HTMLElement = document.getElementById('ListItemDisplay')!;
    display.textContent = label.toUpperCase() + ' ▾';
};

const showList = (): void => {
    document.getElementById('ListModal')!.classList.remove('hidden');
};

const hideList = (): void => {
    document.getElementById('ListModal')!.classList.add('hidden');
};
