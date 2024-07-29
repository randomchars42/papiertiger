import * as APP from './editor_app.js';
import * as TR from './translate.js';
import { VERSION } from './constants.js';
class Entity {
    constructor(type, entityHTML) {
        this.parent = null;
        this.entity = null;
        this.children = [];
        this.type = '';
        this.type = type;
        this.entityHTML = entityHTML;
        this.entityHTML.classList.add(this.type);
    }
    getEntityIndex() {
        if (this.parent === null) {
            return -1;
        }
        return this.parent.children.indexOf(this.entity);
    }
    removeEntity() {
        const currentIndex = this.getEntityIndex();
        if (currentIndex > -1 && this.parent !== null) {
            this.parent.children.splice(currentIndex, 1);
        }
    }
    appendEntity(parent) {
        this.removeEntity();
        this.parent = parent;
        parent.children.push(this.entity);
    }
    moveEntityBefore(beforeEntity) {
        if (beforeEntity.parent === null) {
            return;
        }
        this.removeEntity();
        this.parent = beforeEntity.parent;
        beforeEntity.parent.children.splice(beforeEntity.getEntityIndex(), 0, this.entity);
    }
    moveEntityAfter(afterEntity) {
        if (afterEntity.parent === null) {
            return;
        }
        this.removeEntity();
        this.parent = afterEntity.parent;
        afterEntity.parent.children.splice(afterEntity.getEntityIndex() + 1, 0, this.entity);
    }
    appendHTML(parent) {
        parent.entityHTML.appendChild(this.entityHTML);
    }
    moveHTMLBefore(beforeEntityHTML) {
        beforeEntityHTML.entityHTML.before(this.entityHTML);
    }
    moveHTMLAfter(afterEntityHTML) {
        afterEntityHTML.entityHTML.after(this.entityHTML);
    }
    createNewBefore(entity) {
        entity.moveEntityBefore(this);
        entity.moveHTMLBefore(this);
        entity.createEditor();
        console.log(this.getContentEntity());
    }
    createNewAfter(entity) {
        entity.moveEntityAfter(this);
        entity.moveHTMLAfter(this);
        entity.createEditor();
        console.log(this.getContentEntity());
    }
    createEditor() { }
    getContentEntity() { }
    delete() {
        this.entityHTML.parentNode?.removeChild(this.entityHTML);
        this.removeEntity();
    }
}
class CollectionsEntity extends Entity {
    constructor(entity, entityHTML, name) {
        super('collections', entityHTML);
        this.parent = null;
        if (entity === null) {
            entity = [];
            this.entity = entity;
            this.children = entity;
        }
        else {
            this.entity = entity;
            this.children = entity;
        }
        this.entityHTML.onclick = (event) => {
            this.createEditor();
            event.stopPropagation();
        };
        const label = document.createElement('h2');
        label.textContent = name;
        this.entityHTML.appendChild(label);
        let i = 0;
        for (i = 0; i < this.children.length; i++) {
            const id = generateCSSString(this.children[i].label);
            const entity = new CollectionEntity(this, this.children[i]);
        }
        if (i === 0) {
            const newEntity = new CollectionEntity(this);
        }
    }
    createEditor() {
        const editor = createEditor(this, ['editor_collections'], {
            label: 'button_append_collection',
            onclick: (event) => {
                const entity = new CollectionEntity(this);
            }
        });
        openEditor(editor);
        return editor;
    }
    getContentEntity() {
        return this.entity;
    }
    delete() {
        this.entityHTML.textContent = '';
        this.children.length = 0;
        const newEntity = new CollectionEntity(this);
        console.log(this.getContentEntity());
    }
}
class CollectionEntity extends Entity {
    constructor(parent, entity = null) {
        super('collection', document.createElement('div'));
        this.parent = parent;
        if (entity === null) {
            entity = {
                label: '',
                collapsed: false,
                items: []
            };
            this.entity = entity;
            this.children = entity.items;
            this.appendEntity(parent);
        }
        else {
            this.entity = entity;
            this.children = entity.items;
        }
        this.appendHTML(parent);
        this.entityNavHTML = this.addNavItem();
        this.id = entity.label;
        this.entityHTML.onclick = (event) => {
            this.createEditor();
            event.stopPropagation();
        };
        const label = document.createElement('h2');
        label.textContent = entity.label;
        this.entityHTML.appendChild(label);
        let i = 0;
        for (i = 0; i < this.children.length; i++) {
            if ('text' in this.children[i]) {
                const newEntity = new TextEntity(this, this.children[i]);
            }
            else {
                const newEntity = new RowEntity(this, this.children[i]);
            }
        }
        if (i === 0) {
            const newEntity = new RowEntity(this);
        }
    }
    get label() {
        return this.entity.label;
    }
    set label(label) {
        this.entity.label = label;
        this.entityHTML.firstElementChild.textContent = label;
        this.id = label;
        this.entityNavHTML.textContent = label;
    }
    get id() {
        return this.entityHTML.id;
    }
    set id(id) {
        id = generateCSSString(id);
        this.entityHTML.id = id;
        this.entityNavHTML.href = `#${id}`;
    }
    get collapsed() {
        return this.entity.collapsed;
    }
    set collapsed(collapsed) {
        this.entity.collapsed = collapsed;
    }
    addNavItem() {
        const item = document.createElement('a');
        item.textContent = this.label;
        item.href = '#' + this.id;
        item.classList.add('control', 'item', 'item_def');
        item.onclick = (event) => {
            SCROLLPOSITION = null;
            hideNav();
            document.getElementById(this.id).scrollIntoView({ block: 'start', behavior: 'instant' });
            SCROLLPOSITION = document.getElementById('MainInput').scrollTop;
            event.preventDefault();
        };
        document.getElementById('MainNav').appendChild(item);
        return item;
    }
    createEditor() {
        const editor = createEditor(this, ['editor_collection'], {
            label: 'button_new_collection_before',
            onclick: (event) => {
                const entity = new CollectionEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_collection_after',
            onclick: (event) => {
                const entity = new CollectionEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        }, {
            label: 'button_append_row',
            onclick: (event) => {
                const entity = new RowEntity(this);
            },
        }, {
            label: 'button_append_text',
            onclick: (event) => {
                const entity = new TextEntity(this);
            }
        });
        createTextfield(TR.tr('label_label'), this.label, this, 'label', editor, 'text', []);
        createCheckbox(TR.tr('label_collapsed'), this.collapsed, this, 'collapsed', editor, []);
        openEditor(editor);
        return editor;
    }
    getContentEntity() {
        return this.parent.getContentEntity();
    }
    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity = new CollectionEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}
class RowEntity extends Entity {
    constructor(parent, entity = null) {
        super('row', document.createElement('div'));
        this.parent = parent;
        if (entity === null) {
            entity = [];
            this.entity = entity;
            this.children = entity;
            this.appendEntity(parent);
        }
        else {
            this.entity = entity;
            this.children = entity;
        }
        this.appendHTML(parent);
        this.entityHTML.onclick = (event) => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.classList.add('pane', 'row');
        let i = 0;
        for (i = 0; i < this.children.length; i++) {
            const newEntity = new ItemEntity(this, this.children[i]);
        }
        if (i === 0) {
            const newEntity = new ItemEntity(this);
        }
    }
    createEditor() {
        const editor = createEditor(this, ['editor_row'], {
            label: 'button_new_row_before',
            onclick: (event) => {
                const entity = new RowEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_text_before',
            onclick: (event) => {
                const entity = new TextEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_row_after',
            onclick: (event) => {
                const entity = new RowEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        }, {
            label: 'button_new_text_after',
            onclick: (event) => {
                const entity = new TextEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        }, {
            label: 'button_append_item',
            onclick: (event) => {
                const entity = new ItemEntity(this);
            },
        });
        openEditor(editor);
        return editor;
    }
    getContentEntity() {
        return this.parent.getContentEntity();
    }
    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity = new RowEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}
class TextEntity extends Entity {
    constructor(parent, entity = null) {
        super('text', document.createElement('div'));
        this.parent = parent;
        if (entity === null) {
            entity = { 'text': '' };
            this.entity = entity;
            this.appendEntity(parent);
        }
        else {
            this.entity = entity;
        }
        this.appendHTML(parent);
        this.entityHTML.textContent = 'Some super helpful text!';
        this.entityHTML.onclick = (event) => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.classList.add('text');
    }
    createEditor() {
        const editor = createEditor(this, ['editor_text'], {
            label: 'button_new_row_before',
            onclick: (event) => {
                const entity = new RowEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_text_before',
            onclick: (event) => {
                const entity = new TextEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_row_after',
            onclick: (event) => {
                const entity = new RowEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        }, {
            label: 'button_new_text_after',
            onclick: (event) => {
                const entity = new TextEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        });
        openEditor(editor);
        return editor;
    }
    getContentEntity() {
        return this.parent.getContentEntity();
    }
    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity = new TextEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}
class ItemEntity extends Entity {
    constructor(parent, entity = null) {
        super('item', document.createElement('div'));
        this.parent = parent;
        if (entity === null) {
            entity = {
                type: 'def',
                del: false,
                cat: 'txt',
                label: '',
                text: ''
            };
            this.entity = entity;
            this.appendEntity(parent);
        }
        else {
            this.entity = entity;
        }
        this.appendHTML(parent);
        this.entityHTML.onclick = (event) => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.textContent = entity.label;
        this.entityHTML.classList.add('control', 'control_variable_width', 'item', `item_${this.cat}`, `item_${this.entityType}`);
    }
    get label() {
        return this.entity.label;
    }
    set label(label) {
        this.entity.label = label;
        this.entityHTML.textContent = label;
    }
    get cat() {
        return this.entity.cat;
    }
    set cat(cat) {
        this.entityHTML.classList.remove(`item_${this.cat}`);
        this.entity.cat = cat;
        this.entityHTML.classList.add(`item_${cat}`);
    }
    get text() {
        return this.entity.text;
    }
    set text(text) {
        this.entity.text = text;
    }
    get del() {
        return this.entity.del;
    }
    set del(del) {
        this.entity.del = del;
    }
    get entityType() {
        return this.entity.type;
    }
    set entityType(type) {
        this.entityHTML.classList.remove(`item_${this.entityType}`);
        this.entity.type = type;
        this.entityHTML.classList.add(`item_${type}`);
    }
    createEditor() {
        const editor = createEditor(this, ['editor_item'], {
            label: 'button_new_item_before',
            onclick: (event) => {
                const entity = new ItemEntity(this.parent);
                this.createNewBefore(entity);
                event.stopPropagation();
            }
        }, {
            label: 'button_new_item_after',
            onclick: (event) => {
                const entity = new ItemEntity(this.parent);
                this.createNewAfter(entity);
                event.stopPropagation();
            },
        });
        createTextfield(TR.tr('label_label'), this.label, this, 'label', editor, 'text', []);
        createOptions(TR.tr('label_type'), this.type, this, 'type', editor, ['def', 'ext'], []);
        createOptions(TR.tr('label_cat'), this.cat, this, 'cat', editor, ['cap', 'ref', 'pat', 'txt', 'int', 'res'], []);
        createCheckbox(TR.tr('label_del'), this.del, this, 'del', editor, []);
        createTextarea(TR.tr('label_text'), this.text, this, 'text', editor, []);
        openEditor(editor);
        return editor;
    }
    getContentEntity() {
        return this.parent.getContentEntity();
    }
    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity = new ItemEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}
let SCROLLPOSITION = document.getElementById('MainInput').scrollTop;
export const init = () => {
    console.log('initiating ...');
    document.getElementById('ListItemDisplay').onclick = showList;
    document.getElementById('ListModal').onclick = hideList;
    document.getElementById('NavModal').onclick = hideNav;
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
    document.getElementById('MainInput').onsubmit = (event) => {
        event?.preventDefault();
    };
    document.getElementById('MainEditor').onsubmit = (event) => {
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
export const showSubmitSuccess = () => {
    alert(TR.tr('success_saved'));
};
export const showSubmitError = () => {
    alert(TR.tr('error_not_saved'));
};
export const disableScrollMenu = () => {
    SCROLLPOSITION = null;
};
export const clearEditElements = (parent) => {
    parent.textContent = '';
};
export const generateEditElements = (collections, parent, name) => {
    resetNav();
    const collectionsEntity = new CollectionsEntity(collections, parent, name);
};
export const clearEditor = () => {
    const container = document.getElementById('MainEditor');
    container.textContent = '';
    return container;
};
const openEditor = (editor) => {
    const container = clearEditor();
    container.appendChild(editor);
};
const createEditor = (entity, classList, ...buttons) => {
    const editor = document.createElement('div');
    editor.classList.add('editor', `editor_${entity.type}`);
    const toolbar = document.createElement('div');
    toolbar.classList.add('editor_toolbar', 'pane');
    editor.appendChild(toolbar);
    buttons.forEach((button) => {
        const newButton = document.createElement('button');
        newButton.textContent = TR.tr(button.label);
        newButton.onclick = button.onclick;
        newButton.classList.add('control');
        toolbar.appendChild(newButton);
    });
    const deleteButton = document.createElement('button');
    deleteButton.textContent = TR.tr(`button_delete_${entity.type}`);
    deleteButton.onclick = () => {
        if (window.confirm(TR.tr(`confirmation_delete_${entity.type}`))) {
            entity.delete();
        }
    };
    deleteButton.classList.add('control');
    toolbar.appendChild(deleteButton);
    console.log(entity.getContentEntity());
    return (editor);
};
const createTextfield = (label, content, entity, target, parent, type = 'text', classList = []) => {
    const group = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input = document.createElement('input');
    input.type = type;
    input.value = content.replace(/\n/g, '\\n');
    input.onkeydown = (event) => {
        if (event.defaultPrevented) {
            return;
        }
        let handled = false;
        if (event.key !== undefined) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handled = true;
            }
        }
        else if (event.keyCode !== undefined) {
            if (event.keyCode === 13) {
                event.preventDefault();
                handled = true;
            }
        }
        if (handled) {
            event.preventDefault();
        }
    };
    input.oninput = () => {
        entity[target] = input.value.replace(/\\n/g, '\n');
    };
    input.classList.add('control');
    group.appendChild(input);
    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;
    return input;
};
const createTextarea = (label, content, entity, target, parent, classList = []) => {
    const group = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input = document.createElement('textarea');
    input.value = content;
    input.oninput = () => {
        entity[target] = input.value;
    };
    input.classList.add('control');
    group.appendChild(input);
    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;
    return input;
};
const createOptions = (label, content, entity, target, parent, options = [], classList = []) => {
    const group = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const select = document.createElement('select');
    select.value = content;
    select.onchange = () => {
        entity[target] = select.value;
    };
    for (let i in options) {
        const option = document.createElement('option');
        option.value = options[i];
        option.textContent = options[i];
        if (options[i] === content) {
            option.selected = true;
        }
        select.appendChild(option);
    }
    select.classList.add('control');
    group.appendChild(select);
    const id = generateID();
    labelElement.htmlFor = id;
    select.id = id;
    return select;
};
const createCheckbox = (label, state, targetParent, target, parent, classList = []) => {
    const group = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state;
    input.oninput = () => {
        targetParent[target] = input.checked;
    };
    group.appendChild(input);
    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;
    input.classList.add('control');
    return input;
};
export const generateListElements = (list, parent) => {
    list.forEach((item) => {
        addListItem(item.label, item.name, parent);
    });
};
const generateCSSString = (string) => {
    string = string.toLowerCase();
    string = string.replace(/[^a-zA-Z0-9_\-]/g, '');
    string = string.replace(/[\s_\-]+/g, '');
    string = string.replace(/[\s_]+/g, '-');
    return string;
};
const generateID = (length = 6) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};
const addListItem = (label, name, parent) => {
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
const resetNav = () => {
    document.getElementById('MainNav').textContent = '';
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
const showNav = () => {
    document.getElementById('NavModal').classList.remove('hidden');
};
const hideNav = () => {
    document.getElementById('NavModal').classList.add('hidden');
};
const toggleClass = (selector, classname) => {
    document.querySelectorAll(selector).forEach((element) => {
        element.classList.toggle(classname);
    });
};
