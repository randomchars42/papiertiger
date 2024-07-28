import * as APP from './app.js';
import * as TR from './translate.js';
import { VERSION } from './constants.js';
export let SCROLLPOSITION = document.getElementById('MainInput').scrollTop;
const getMainInput = () => {
    return document.getElementById('MainInput');
};
const getMainOutput = () => {
    return document.getElementById('MainOutput');
};
const getCopyStatus = () => {
    return document.getElementById('CopyStatus');
};
export const init = () => {
    console.log('initiating ...');
    document.getElementById('ListItemDisplay').onclick = showList;
    document.getElementById('ListModal').onclick = hideList;
    document.getElementById('NavModal').onclick = hideNav;
    document.getElementById('CopyButton').onclick = copyToClipboard;
    document.getElementById('ClearButton').onclick = () => {
        if (window.confirm(TR.tr('confirmation_clear'))) {
            getMainOutput().value = '';
        }
    };
    document.getElementById('NewLineButton').onclick = () => {
        addToOutput('\n');
    };
    document.getElementById('ExtendedToggle').checked =
        false;
    document.getElementById('ExtendedToggle').onclick = toggleExtended;
    document.getElementById('ColorButton').onclick = toggleColourMode;
    document.getElementById('HelpButton').onclick = () => {
        alert(TR.tr('page_about', { 'version': VERSION }));
    };
    document.getElementById('MainInput').onscroll = () => {
        const currentPosition = document.getElementById('MainInput').scrollTop;
        if (SCROLLPOSITION !== null &&
            Math.abs(SCROLLPOSITION - currentPosition) > 650) {
            SCROLLPOSITION = null;
            showNav();
        }
        setTimeout(() => {
            if (SCROLLPOSITION === null) {
                return;
            }
            SCROLLPOSITION = document.getElementById('MainInput').scrollTop;
        }, 250);
    };
    getMainOutput().blur();
    getMainInput().onsubmit = (event) => { event?.preventDefault(); };
    console.log('UI initiated.');
};
const addToOutput = (text) => {
    const output = getMainOutput();
    const [start, end] = [output.selectionStart, output.selectionEnd];
    output.setRangeText(text, end, end, 'select');
    output.selectionStart = output.selectionEnd;
};
const toggleItem = (text, del) => {
    const output = getMainOutput();
    const index = output.value.indexOf(text);
    output.focus();
    if (del && index > -1) {
        const [start, end] = [output.selectionStart, output.selectionEnd];
        output.value = output.value.replace(text, '');
        if (index < start) {
            output.selectionStart = start - text.length;
            output.selectionEnd = end - text.length;
        }
        else {
            output.selectionStart = start;
            output.selectionEnd = end;
        }
    }
    else {
        addToOutput(text);
    }
};
const copyToClipboard = () => {
    const output = getMainOutput();
    output.focus();
    output.select();
    document.execCommand('copy');
    showCopySuccess();
};
const showCopySuccess = () => {
    alert(TR.tr('success_copied'));
};
export const disableScrollMenu = () => {
    SCROLLPOSITION = null;
};
export const clearInputElements = (parent) => {
    parent.textContent = '';
};
export const generateInputElements = (collections, parent) => {
    resetNav();
    collections.forEach((collection) => {
        const id = generateCSSString(collection.label);
        const classname = 'collection_' + id;
        addHeading(collection.label, id, collection.collapsed, parent);
        addNavItem(collection.label, id, document.getElementById('MainNav'));
        collection.items.forEach((itemrow) => {
            const row = addRow(classname, collection.collapsed, parent);
            itemrow.forEach((item) => {
                addItem(item.label, item.text, row, item.type, item.del, item.cat);
            });
        });
    });
};
export const generateListElements = (list, parent) => {
    list.forEach((item) => {
        addListItem(item.label, item.name, parent);
    });
};
export const generateCSSString = (string) => {
    string = string.toLowerCase();
    string = string.replace(/[^a-zA-Z0-9_\-]/g, '');
    string = string.replace(/[\s_\-]+/g, '');
    string = string.replace(/[\s_]+/g, '-');
    return string;
};
export const addHeading = (label, id, hidden, parent) => {
    const heading = document.createElement('h1');
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
export const addItem = (label, text, parent, type = 'def', del = 0, cat = 'ref') => {
    const item = document.createElement('button');
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
export const addListItem = (label, name, parent) => {
    const item = document.createElement('button');
    item.textContent = label;
    item.onclick = () => {
        APP.loadData(label, name);
        hideList();
    };
    item.classList.add('control', 'control_variable_width');
    item.classList.add('item', 'item_def');
    parent.appendChild(item);
};
export const addNavItem = (label, target, parent) => {
    const item = document.createElement('a');
    item.textContent = label;
    item.href = '#' + target;
    item.classList.add('control');
    item.classList.add('item', 'item_def');
    item.onclick = (event) => {
        SCROLLPOSITION = null;
        hideNav();
        document.getElementById(target).scrollIntoView({ block: 'start', behavior: 'instant' });
        SCROLLPOSITION = document.getElementById('MainInput').scrollTop;
        event.preventDefault();
    };
    parent.appendChild(item);
};
export const resetNav = () => {
    document.getElementById('MainNav').textContent = '';
};
export const displayCurrentListItem = (label) => {
    const display = document.getElementById('ListItemDisplay');
    display.textContent = label.toUpperCase() + ' ▾';
};
export const showList = () => {
    document.getElementById('ListModal').classList.remove('hidden');
};
export const hideList = () => {
    document.getElementById('ListModal').classList.add('hidden');
};
export const showNav = () => {
    document.getElementById('NavModal').classList.remove('hidden');
};
export const hideNav = () => {
    document.getElementById('NavModal').classList.add('hidden');
};
export const addRow = (classname, hidden, parent) => {
    const row = document.createElement('div');
    row.classList.add('pane');
    row.classList.add(classname);
    if (hidden) {
        row.classList.add('hidden');
    }
    return parent.appendChild(row);
};
export const toggleClass = (selector, classname) => {
    document.querySelectorAll(selector).forEach((element) => {
        element.classList.toggle(classname);
    });
};
export const addClass = (selector, classname) => {
    document.querySelectorAll(selector).forEach((element) => {
        element.classList.add(classname);
    });
};
export const removeClass = (selector, classname) => {
    document.querySelectorAll(selector).forEach((element) => {
        element.classList.remove(classname);
    });
};
export const toggleExtended = () => {
    if (document.getElementById('ExtendedToggle').checked) {
        removeClass('.item_ext', 'hidden');
    }
    else {
        addClass('.item_ext', 'hidden');
    }
};
let colourState = 1;
export const toggleColourMode = () => {
    if (colourState === 0) {
        document.querySelectorAll('.item').forEach((element) => {
            element.classList.remove('item_no_colour');
        });
        colourState = 1;
    }
    else if (colourState === 1) {
        document.querySelectorAll('.item').forEach((element) => {
            element.classList.add('item_no_colour');
            element.classList.add('item_border');
        });
        colourState = 2;
        document.querySelector('html').classList.add('dark_mode');
    }
    else if (colourState === 2) {
        document.querySelectorAll('.item').forEach((element) => {
            element.classList.add('item_no_colour');
            element.classList.remove('item_border');
        });
        colourState = 0;
        document.querySelector('html').classList.remove('dark_mode');
    }
};
