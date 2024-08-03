/**
 */
import * as APP from './app.js';
import * as TR from './translate.js';
import * as TXT from './texts.js';
import {VERSION} from './constants.js';

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

export type Text = {
    name: string,
    text: string,
}

export type ItemRow = Item[]

export type ItemCollection = {
    label: string,
    collapsed: boolean,
    items: (ItemRow|Text)[],
}

export let SCROLLPOSITION: number|null =
    document.getElementById('MainInput')!.scrollTop;

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
    console.log('initiating ...');

    document.getElementById('ListItemDisplay')!.onclick = showList;
    document.getElementById('ListModal')!.onclick = hideList;
    document.getElementById('NavModal')!.onclick = hideNav;
    document.getElementById('TextModal')!.onclick = hideNav;
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
        alert(TR.tr('page_about', {'version': VERSION}));
    };
    document.getElementById('MainInput')!.onscroll = (): void => {
        const currentPosition: number =
            document.getElementById('MainInput')!.scrollTop;
        if (SCROLLPOSITION !== null &&
            Math.abs(SCROLLPOSITION - currentPosition) > 650) {
            SCROLLPOSITION = null;
            showNav();
        }
        setTimeout((): void => {
            if (SCROLLPOSITION === null) {
                return;
            }
            SCROLLPOSITION = document.getElementById('MainInput')!.scrollTop;
        }, 250);
    };
    getMainOutput().blur();
    getMainInput().onsubmit = (event: Event) => {event?.preventDefault()};
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
    if (del && index > -1) {
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
    alert(TR.tr('success_copied'));
};

export const disableScrollMenu = (): void => {
    SCROLLPOSITION = null;
};

export const clearInputElements = (parent: HTMLElement): void => {
    parent.textContent = '';
}

export const generateInputElements = (collections: ItemCollection[],
                                      parent: HTMLElement): void => {
    resetNav();
    collections.forEach((collection: ItemCollection): void => {
        const id: string = generateCSSString(collection.label);
        const classname: string = 'collection_' + id;
        addHeading(collection.label, id, collection.collapsed, parent);
        addNavItem(collection.label, id, document.getElementById('MainNav')!);
        collection.items.forEach((entity: Item[]|Text): void => {
            if ('text' in entity) {
                addText(entity.name, parent);
            } else {
                const row = addRow(classname, collection.collapsed, parent);
                entity.forEach((item: Item): void => {
                    addItem(item.label, item.text, row, item.type, item.del,
                            item.cat);
                });
            }
        });
    });
};

export const generateListElements = (list: ListItem[],
                                     parent: HTMLElement): void => {
    list.forEach((item: ListItem): void => {
        addListItem(item.label, item.name, parent);
    });
};

export const generateCSSString = (string: string): string => {
    //Lower case everything
    string = string.toLowerCase();
    // remove all characters except alphanumeric and "-" / "_"
    string = string.replace(/[^a-zA-Z0-9_\-]/g, '');
    // remove multiple "-", "_" or whitespaces
    string = string.replace(/[\s_\-]+/g, '');
    // replace whitespaces and "_" by "-"
    string = string.replace(/[\s_]+/g, '-');
    return string;
};

export const addHeading = (label: string, id: string, hidden: boolean,
                           parent: HTMLElement): void => {
    const heading: HTMLHeadingElement = document.createElement('h1');
    heading.textContent = label;
    heading.classList.add('heading');
    heading.id = id;
    if (hidden) {
        heading.classList.add('collapsed');
    }
    heading.onclick = () => {
        toggleClass('.collection_' + id, 'hidden');
        toggleClass('#' + id, 'collapsed');
    };
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

    item.classList.add('item', 'item_' + cat, 'item_' + type);
    if (type === 'ext') {
        item.classList.add('hidden');
    }

    parent.appendChild(item);
};

export const addText = (name: string, parent: HTMLElement): void => {
    const textfield = document.createElement('div');
    TXT.appendText(name, textfield);
    parent.appendChild(textfield);
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

export const addNavItem = (label: string, target: string,
                           parent: HTMLElement): void => {
    const item: HTMLAnchorElement = document.createElement('a');
    item.textContent = label;
    item.href = '#' + target;
    item.classList.add('control');
    item.classList.add('item', 'item_def');
    item.onclick = (event: Event): void => {
        SCROLLPOSITION = null;
        hideNav();
        document.getElementById(target)!.scrollIntoView(
            {block: 'start', behavior: 'instant'});
        SCROLLPOSITION = document.getElementById('MainInput')!.scrollTop;
        event.preventDefault();
    };

    parent.appendChild(item);
};

export const resetNav = (): void => {
    document.getElementById('MainNav')!.textContent = '';
};

export const displayCurrentListItem = (label: string): void => {
    const display: HTMLElement = document.getElementById('ListItemDisplay')!;
    display.textContent = label.toUpperCase() + ' ▾';
};

export const showList = (): void => {
    document.getElementById('ListModal')!.classList.remove('hidden');
};

export const hideList = (): void => {
    document.getElementById('ListModal')!.classList.add('hidden');
};

export const showNav = (): void => {
    document.getElementById('NavModal')!.classList.remove('hidden');
};

export const hideNav = (): void => {
    document.getElementById('NavModal')!.classList.add('hidden');
};

export const showText = (): void => {
    document.getElementById('TextModal')!.classList.remove('hidden');
};

export const hideText = (): void => {
    document.getElementById('TextModal')!.classList.add('hidden');
};

export const displayText = (file: string): void => {
    const container: HTMLElement = document.getElementById('div')!;
    const modal: HTMLElement = document.getElementById('TextModal')!;
    modal.textContent = '';
    modal.appendChild(container);
    container.id = 'TextContainer';

    TXT.appendText(file, container);

    document.querySelectorAll('#TextContainer a').forEach(
        (element: Element): void => {
            (element as HTMLAnchorElement).onclick = (event: Event): void => {
                event.preventDefault();
                displayText(file);
            }
        });
};

export const addRow = (classname:string, hidden: boolean,
                       parent: HTMLElement): HTMLElement => {
    const row: HTMLElement = document.createElement('div');
    row.classList.add('pane');
    row.classList.add(classname);
    if (hidden) {
        row.classList.add('hidden');
    }
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

