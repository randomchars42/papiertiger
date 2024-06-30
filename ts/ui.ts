/**
 */
import * as APP from './app.js';
import * as TR from './translate.js';

export type ListItem = {
    name: string,
    label: string,
}

export type Item = {
    type: string,
    del: number,
    cat: string,
    label: string,
    text: string,
}

export type ItemRow = Item[]

export type ItemCollection = {
    label: string,
    items: ItemRow[],
}

const getMainInput = (): HTMLFormElement => {
    return document.getElementById('MainInput') as HTMLFormElement;
};

const getMainOutput = (): HTMLTextAreaElement => {
    return document.getElementById('MainOutput') as HTMLTextAreaElement;
};

const getCopyStatus = (): HTMLTextAreaElement => {
    return document.getElementById('CopyStatus') as HTMLTextAreaElement;
};

export const init = (): void => {
    console.log('initiating ..');

    document.getElementById('ListItemDisplay')!.onclick = showList;
    document.getElementById('ListModal')!.onclick = hideList;
    document.getElementById('CopyButton')!.onclick = copyToClipboard;
    document.getElementById('ClearButton')!.onclick = (): void => {
        if (window.confirm(TR.tr('confirmation_clear'))) {
            getMainOutput().value = '';
        }
    };
    document.getElementById('NewLineButton')!.onclick = (): void => {
        addToOutput('\n');
    };
    (document.getElementById('ExtendedToggle') as HTMLInputElement).checked =
        false;
    document.getElementById('ExtendedToggle')!.onclick = toggleExtended;
    document.getElementById('ColorButton')!.onclick = toggleColourMode;
    document.getElementById('HelpButton')!.onclick = (): void => {
        alert(TR.tr('page_about'));
    };
    getMainOutput().oninput = hideCopySuccess;
    getMainOutput().blur();
    getMainInput().onsubmit = (event: Event) => {event?.preventDefault()};
    hideCopySuccess();
    console.log('UI initiated.')
}

const addToOutput = (text: string): void => {
    const output: HTMLTextAreaElement = getMainOutput();
    const [start, end] = [output.selectionStart, output.selectionEnd];
    output.setRangeText(text, end, end, 'select');
    output.selectionStart = output.selectionEnd;
};

const toggleItem = (text: string, del: number): void => {
    const output: HTMLTextAreaElement = getMainOutput();
    const index = output.value.indexOf(text);
    output.focus();
    if (del === 1 && index > -1) {
        const [start, end] = [output.selectionStart, output.selectionEnd];
        output.value = output.value.replace(text, '');
        if (index < start) {
            output.selectionStart = start - text.length;
            output.selectionEnd = end - text.length;
        } else {
            output.selectionStart = start;
            output.selectionEnd = end;
        }
    } else {
        addToOutput(text);
    }
};

const copyToClipboard = (): void => {
    const output: HTMLTextAreaElement = getMainOutput();
    output.focus();
    output.select();
    document.execCommand('copy');
    showCopySuccess();
};

const showCopySuccess = (): void => {
    getCopyStatus().style.display = 'inline';
};

const hideCopySuccess = (): void => {
    getCopyStatus().style.display = 'none';
};

export const clearInputElements = (parent: HTMLElement): void => {
    parent.textContent = '';
}

export const generateInputElements = (collection: ItemCollection[],
                                      parent: HTMLElement): void => {
    collection.forEach((collection: ItemCollection): void => {
        addHeading(collection.label, parent);
        collection.items.forEach((itemrow: Item[]): void => {
            const row = addRow(parent);
            itemrow.forEach((item: Item): void => {
                addItem(item.label, item.text, row, item.type, item.del,
                        item.cat);
            });
        });
    });
};

export const generateListElements = (list: ListItem[],
                                     parent: HTMLElement): void => {
    list.forEach((item: ListItem): void => {
        addListItem(item.label, item.name, parent);
    });
};

export const addHeading = (label: string, parent: HTMLElement): void => {
    const heading: HTMLHeadingElement = document.createElement('h1');
    heading.textContent = label;
    heading.classList.add('heading');
    parent.appendChild(heading);
};

export const addItem = (label: string, text: string, parent: HTMLElement,
                        type: string = 'def', del: number = 0,
                        cat: string = 'ref'): void => {
    const item: HTMLButtonElement = document.createElement('button');
    item.textContent = label;
    item.title = text;
    item.onclick = () => {
        toggleItem(text, del);
    };
    item.classList.add('control', 'control_variable_width');

    if (cat === 'cap') {
        item.classList.add('control_highlight');
    }

    item.classList.add('item', 'item_' + cat, 'item_' + type);
    if (type === 'ext') {
        item.classList.add('hidden');
    }

    parent.appendChild(item);
};

export const addListItem = (label: string, name: string,
                            parent: HTMLElement): void => {
    const item: HTMLButtonElement = document.createElement('button');
    item.textContent = label;
    item.onclick = () => {
        APP.loadData(label, name);
        hideList();
    };
    item.classList.add('control', 'control_variable_width');

    item.classList.add('item', 'item_def');

    parent.appendChild(item);
};

export const displayCurrentListItem = (label: string): void => {
    const display: HTMLElement = document.getElementById('ListItemDisplay')!;
    display.textContent = label.toUpperCase() + ' ▼';
};

export const showList = (): void => {
    document.getElementById('ListModal')!.classList.remove('hidden');
};

export const hideList = (): void => {
    document.getElementById('ListModal')!.classList.add('hidden');
};

export const addRow = (parent: HTMLElement): HTMLElement => {
    const row: HTMLElement = document.createElement('div');
    row.classList.add('pane');
    return parent.appendChild(row);
};

export const toggleClass = (selector: string, classname: string): void => {
    document.querySelectorAll(selector).forEach((element: Element): void => {
        element.classList.toggle(classname);
    });
};

export const addClass = (selector: string, classname: string): void => {
    document.querySelectorAll(selector).forEach((element: Element): void => {
        element.classList.add(classname);
    });
};

export const removeClass = (selector: string, classname: string): void => {
    document.querySelectorAll(selector).forEach((element: Element): void => {
        element.classList.remove(classname);
    });
};

export const toggleExtended = (): void => {
    if ((document.getElementById('ExtendedToggle') as HTMLInputElement).checked) {
        removeClass('.item_ext', 'hidden');
    } else {
        addClass('.item_ext', 'hidden');
    }
};

let colourState: number = 1;

export const toggleColourMode = (): void => {
    if (colourState === 0) {
        document.querySelectorAll('.item').forEach((element: Element): void => {
            element.classList.remove('item_no_colour');
        });
        colourState = 1;
    } else if (colourState === 1) {
        document.querySelectorAll('.item').forEach((element: Element): void => {
            element.classList.add('item_no_colour');
            element.classList.add('item_border');
        });
        colourState = 2;
        document.querySelector('html')!.classList.add('dark_mode');
    } else if (colourState === 2) {
        document.querySelectorAll('.item').forEach((element: Element): void => {
            element.classList.add('item_no_colour');
            element.classList.remove('item_border');
        });
        colourState = 0;
        document.querySelector('html')!.classList.remove('dark_mode');
    }
};

