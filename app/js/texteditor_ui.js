import * as APP from './texteditor_app.js';
import * as TR from './translate.js';
import { VERSION } from './constants.js';
export const init = (onConvertMarkdown) => {
    console.log('initiating ...');
    document.getElementById('ListItemDisplay').onclick = showList;
    document.getElementById('ListModal').onclick = hideList;
    document.getElementById('ConvertButton').onclick = onConvertMarkdown;
    document.getElementById('HelpButton').onclick = () => {
        alert(TR.tr('page_about', { 'version': VERSION }));
    };
    document.getElementById('MainHTMLOutput').onsubmit = (event) => {
        event?.preventDefault();
    };
    document.getElementById('MainTextEditor').onsubmit = (event) => {
        event?.preventDefault();
    };
    clearEditor();
    console.log('UI initiated.');
};
export const setOnSubmit = (onSubmit) => {
    document.getElementById('SubmitButton').onclick = () => {
        if (window.confirm(TR.tr('confirmation_save'))) {
            onSubmit();
        }
    };
};
export const setSource = (text) => {
    document.getElementById('MainTextEditor').value = text;
};
export const setOutput = (text) => {
    document.getElementById('MainHTMLOutput').innerHTML = text;
};
export const getSource = () => {
    return document.getElementById('MainTextEditor').value;
};
export const getOutput = () => {
    return document.getElementById('MainHTMLOutput').innerHTML;
};
export const showSubmitSuccess = () => {
    alert(TR.tr('success_saved'));
};
export const showSubmitError = () => {
    alert(TR.tr('error_not_saved'));
};
export const clearEditor = () => {
    const container = document.getElementById('MainTextEditor');
    container.textContent = '';
    return container;
};
export const generateListElements = (list, parent) => {
    list.forEach((item) => {
        addListItem(item, parent);
    });
};
const addListItem = (item, parent) => {
    const button = document.createElement('button');
    button.textContent = `${item.destination}${item.name}`;
    button.onclick = () => {
        APP.loadText(item);
        hideList();
    };
    button.classList.add('control', 'control_variable_width', 'item', 'item_def');
    parent.appendChild(button);
};
export const displayCurrentListItem = (label) => {
    const display = document.getElementById('ListItemDisplay');
    display.textContent = label.toUpperCase() + ' ▾';
};
const showList = () => {
    document.getElementById('ListModal').classList.remove('hidden');
};
const hideList = () => {
    document.getElementById('ListModal').classList.add('hidden');
};
