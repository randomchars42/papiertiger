import * as APP from './app.js';
import * as TR from './translate.js';
import * as CNT from './content.js';
import { VERSION } from './constants.js';
class Entity {
    constructor(entityType, html) {
        this.parent = null;
        this.data = null;
        this.children = [];
        this.entityType = '';
        this.entityType = entityType;
        this.html = html;
        this.html.classList.add(this.entityType);
    }
    get index() {
        if (this.parent === null) {
            throw new Error('Item has no parent.');
        }
        else if (!('data' in this.parent)) {
            throw new Error('Parent has no data.');
        }
        else if (!('items' in this.parent.data)) {
            throw new Error('Parent data has no children.');
        }
        else if (this.parent.children.length === 0) {
            throw new Error('Parent has no children.');
        }
        const entityIndex = this.parent.children.indexOf(this);
        const dataIndex = this.parent.data.items.indexOf(this.data);
        if (entityIndex !== dataIndex) {
            throw new Error(`Entity index (${entityIndex}) != data index (${dataIndex})`);
        }
        return entityIndex;
    }
    remove() {
        const currentIndex = this.index;
        if (currentIndex === -1) {
            throw new Error('Item not in parent.');
        }
        this.parent.data.items.splice(currentIndex, 1);
        this.parent.children.splice(currentIndex, 1);
        this.html.parentNode?.removeChild(this.html);
    }
    appendTo(parent) {
        this.remove();
        this.parent = parent;
        parent.data.items.push(this.data);
        parent.children.push(this);
        parent.html.appendChild(this.html);
    }
    moveToInitialPosition() {
        if (this.parent === null) {
            throw Error('No parent');
        }
        else if (!('data' in this.parent)) {
            throw new Error('Parent has no data.');
        }
        else if (!('items' in this.parent.data)) {
            throw new Error('Parent data has no children.');
        }
        const index = this.parent.data.items.indexOf(this.data);
        if (index === -1) {
            this.parent.data.items.push(this.data);
        }
        this.parent.children.push(this);
        this.parent.html.appendChild(this.html);
    }
    moveBefore(before) {
        if (before.parent === null) {
            return;
        }
        this.remove();
        this.parent = before.parent;
        const index = before.index;
        before.parent.data.items.splice(index, 0, this.data);
        before.parent.children.splice(index, 0, this);
        before.html.before(this.html);
    }
    moveAfter(after) {
        if (after.parent === null) {
            return;
        }
        this.remove();
        this.parent = after.parent;
        const index = after.index + 1;
        after.parent.data.items.splice(index, 0, this.data);
        after.parent.children.splice(index, 0, this);
        after.html.after(this.html);
    }
    delete() {
        this.remove();
    }
    render(mode) {
        throw Error(`"render" called on "Entity" with mode "${mode}"`);
    }
    openEditor() { }
    hide() {
        this.html.style.display = 'none';
    }
    show() {
        this.html.style.display = 'initial';
    }
    hasChildren() {
        return (this.children.length > 0);
    }
    getDataRoot() {
        if (this.parent === null) {
            return this.data;
        }
        else {
            return this.parent.getDataRoot();
        }
    }
}
class Collection extends Entity {
    constructor(data, htmlParent) {
        super('collection', htmlParent);
        this.parent = null;
        this.children = [];
        if (data === null) {
            data = {
                name: '',
                label: '',
                items: [],
            };
        }
        this.data = data;
        for (let i = 0; i < this.data.items.length; i++) {
            new Category(this, this.data.items[i]);
        }
        if (this.children.length === 0) {
            new Category(this);
        }
    }
    get items() {
        return this.data.items;
    }
    set name(name) {
        this.data.name = name;
    }
    get name() {
        return this.data.name;
    }
    set label(label) {
        this.data.label = label;
        if (this.html.firstElementChild !== null) {
            this.html.firstElementChild.textContent = label;
        }
    }
    get label() {
        return this.data.label;
    }
    render(mode = 'App') {
        if (mode !== 'App') {
            this.html.addEventListener('click', (event) => {
                this.openEditor();
                event.stopPropagation();
            });
            const label = create('h1');
            label.textContent = this.data.label;
            label.classList.add('heading');
            this.html.insertBefore(label, this.html.firstChild);
            this.html.classList.add('editor_mode');
        }
        this.children.forEach((child) => { child.render(mode); });
    }
    openEditor() {
        getComponent('EntityEditor').update(this, ['editor_collection'], [
            {
                label: 'button_append_category',
                onclick: () => {
                    const category = new Category(this);
                    category.render('EntityEditor');
                }
            }
        ], [
            { type: 'short_text', entity: this, target: 'name',
                label: 'label_name', disabled: false },
            { type: 'short_text', entity: this, target: 'label',
                label: 'label_label', disabled: false },
        ]);
    }
    delete() {
        this.html.textContent = '';
        this.data.items.length = 0;
        this.children.length = 0;
        new Collection(this.data, this.html);
    }
}
class Category extends Entity {
    constructor(parent, data = null) {
        super('category', create('div'));
        this.children = [];
        this.parent = parent;
        if (data === null) {
            data = {
                label: '',
                collapsed: false,
                items: []
            };
        }
        this.data = data;
        this.label = this.data.label;
        if (this.data.label === '') {
            this.id = generateRandomID();
        }
        this.moveToInitialPosition();
        getComponent('ScrollNavigation').addNavigationItem(this.id, this.label);
        for (let i = 0; i < this.data.items.length; i++) {
            if ('source' in this.data.items[i]) {
                new Content(this, this.data.items[i]);
            }
            else {
                new Group(this, this.data.items[i]);
            }
            ;
        }
        if (this.children.length === 0) {
            new Group(this).render();
        }
    }
    render(mode = 'App') {
        const label = create('h2');
        label.textContent = this.label;
        label.classList.add('heading');
        this.html.insertBefore(label, this.html.firstChild);
        if (mode === 'App') {
            if (this.collapsed) {
                this.collapse();
            }
            else {
                this.expand();
            }
            label.addEventListener('click', (event) => {
                if (this.collapsed) {
                    this.expand();
                }
                else {
                    this.collapse();
                }
                event.stopPropagation();
            });
        }
        else {
            this.html.addEventListener('click', (event) => {
                this.openEditor();
                event.stopPropagation();
            });
        }
        this.children.forEach((child) => { child.render(mode); });
    }
    get items() {
        return this.data.items;
    }
    get label() {
        return this.data.label;
    }
    set label(label) {
        this.data.label = label;
        if (this.html.firstElementChild !== null) {
            this.html.firstElementChild.textContent = label;
        }
        this.id = label;
    }
    get id() {
        return this.html.id;
    }
    set id(id) {
        id = generateCSSCompatibleString(id);
        getComponent('ScrollNavigation').updateNavigationItem(this.id, id, this.label);
        this.html.id = id;
    }
    get collapsed() {
        return this.data.collapsed;
    }
    set collapsed(collapsed) {
        this.data.collapsed = collapsed;
    }
    collapse() {
        this.html.classList.add('collapsed');
        this.collapsed = true;
    }
    expand() {
        this.html.classList.remove('collapsed');
        this.collapsed = false;
    }
    openEditor() {
        getComponent('EntityEditor').update(this, ['editor_category'], [
            {
                label: 'button_new_category_before',
                onclick: () => {
                    const category = new Category(this.parent);
                    category.moveBefore(this);
                    category.render('EntityEditor');
                }
            },
            {
                label: 'button_new_category_after',
                onclick: () => {
                    const category = new Category(this.parent);
                    category.moveAfter(this);
                    category.render('EntityEditor');
                },
            },
            {
                label: 'button_append_group',
                onclick: () => {
                    const group = new Group(this);
                    group.render('EntityEditor');
                },
            },
            {
                label: 'button_append_content',
                onclick: () => {
                    const content = new Content(this);
                    content.render('EntityEditor');
                }
            },
        ], [
            { type: 'short_text', entity: this, target: 'label',
                label: 'label_label', disabled: false },
            { type: 'checkbox', entity: this, target: 'collapsed',
                label: 'label_collapsed', disabled: false },
        ]);
    }
    delete() {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Category(this.parent).render();
        }
    }
}
class Group extends Entity {
    constructor(parent, data = null) {
        super('group', create('div'));
        this.children = [];
        this.parent = parent;
        if (data === null) {
            data = {
                items: []
            };
        }
        this.data = data;
        this.moveToInitialPosition();
        for (let i = 0; i < this.data.items.length; i++) {
            new TextBlock(this, this.data.items[i]);
        }
        if (this.data.items.length === 0) {
            new TextBlock(this);
        }
    }
    get items() {
        return this.data.items;
    }
    render(mode = 'App') {
        this.html.classList.add('pane', 'row');
        if (mode !== 'App') {
            this.html.addEventListener('click', (event) => {
                this.openEditor();
                event.stopPropagation();
            });
        }
        this.children.forEach((child) => { child.render(mode); });
    }
    openEditor() {
        getComponent('EntityEditor').update(this, ['editor_group'], [
            {
                label: 'button_new_group_before',
                onclick: () => {
                    const group = new Group(this.parent);
                    group.moveBefore(this);
                    group.render('EntityEditor');
                }
            },
            {
                label: 'button_new_content_before',
                onclick: () => {
                    const content = new Content(this.parent);
                    content.moveBefore(this);
                    content.render('EntityEditor');
                }
            },
            {
                label: 'button_new_group_after',
                onclick: () => {
                    const group = new Group(this.parent);
                    group.moveAfter(this);
                    group.render('EntityEditor');
                },
            },
            {
                label: 'button_new_content_after',
                onclick: () => {
                    const content = new Content(this.parent);
                    content.moveAfter(this);
                    content.render('EntityEditor');
                },
            },
            {
                label: 'button_append_textblock',
                onclick: () => {
                    const textblock = new TextBlock(this);
                    textblock.render('EntityEditor');
                },
            },
        ], []);
    }
    delete() {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Group(this.parent).render();
        }
    }
}
class Content extends Entity {
    constructor(parent, data = null) {
        super('content', create('div'));
        this.parent = parent;
        const textHTML = create('div');
        this.html.appendChild(textHTML);
        if (data === null) {
            data = { 'source': '/empty.md' };
        }
        this.data = data;
        this.moveToInitialPosition();
    }
    get source() {
        return this.data.source;
    }
    set source(source) {
        this.data.source = source;
        this.html.textContent = source;
    }
    render(mode = 'App') {
        this.html.classList.add('text');
        if (mode !== 'App') {
            this.html.textContent = this.source;
            this.html.addEventListener('click', (event) => {
                this.openEditor();
                event.stopPropagation();
            });
        }
        else {
            CNT.appendContentTo(this.source, this.html);
        }
    }
    openEditor() {
        getComponent('EntityEditor').update(this, ['editor_content'], [
            {
                label: 'button_new_group_before',
                onclick: () => {
                    const group = new Group(this.parent);
                    group.moveBefore(this);
                    group.render('EntityEditor');
                }
            },
            {
                label: 'button_new_content_before',
                onclick: () => {
                    const content = new Content(this.parent);
                    content.moveBefore(this);
                    content.render('EntityEditor');
                }
            },
            {
                label: 'button_new_group_after',
                onclick: () => {
                    const group = new Group(this.parent);
                    group.moveAfter(this);
                    group.render('EntityEditor');
                },
            },
            {
                label: 'button_new_content_after',
                onclick: () => {
                    const content = new Content(this.parent);
                    content.moveAfter(this);
                    content.render('EntityEditor');
                },
            },
        ], [
            { type: 'short_text', entity: this, target: 'source',
                label: 'label_source', disabled: false },
        ]);
    }
    delete() {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Content(this.parent).render();
        }
    }
}
class TextBlock extends Entity {
    constructor(parent, data = null) {
        super('textblock', create('button'));
        this.parent = parent;
        if (data === null) {
            data = {
                def: true,
                del: false,
                cat: 'txt',
                label: '',
                text: ''
            };
        }
        this.data = data;
        this.def = data.def;
        this.moveToInitialPosition();
    }
    render(mode = 'App') {
        this.html.textContent = this.label;
        this.html.classList.add('control', 'control_variable_width', 'item', `item_${this.cat}`);
        if (mode === 'App') {
            this.html.addEventListener('click', (event) => {
                getComponent('DocumentationEditor').processTextBlock(this.data.text, this.data.del);
                event.stopPropagation();
            });
        }
        else {
            this.html.addEventListener('click', (event) => {
                this.openEditor();
                event.stopPropagation();
            });
        }
    }
    get label() {
        return this.data.label;
    }
    set label(label) {
        this.data.label = label;
        this.html.textContent = label;
    }
    get cat() {
        return this.data.cat;
    }
    set cat(cat) {
        this.html.classList.remove(`item_${this.cat}`);
        this.html.classList.add(`item_${cat}`);
        this.data.cat = cat;
    }
    get text() {
        return this.data.text;
    }
    set text(text) {
        this.data.text = text;
    }
    get del() {
        return this.data.del;
    }
    set del(del) {
        this.data.del = del;
    }
    get def() {
        return this.data.def;
    }
    set def(def) {
        if (def) {
            this.html.classList.remove('item_ext');
            this.html.classList.add('item_def');
        }
        else {
            this.html.classList.remove('item_def');
            this.html.classList.add('item_ext');
        }
        this.data.def = def;
    }
    openEditor() {
        getComponent('EntityEditor').update(this, ['editor_textblock'], [
            {
                label: 'button_new_textblock_before',
                onclick: () => {
                    const textblock = new TextBlock(this.parent);
                    textblock.moveBefore(this);
                    textblock.render('EntityEditor');
                }
            },
            {
                label: 'button_new_textblock_after',
                onclick: () => {
                    const textblock = new TextBlock(this.parent);
                    textblock.moveAfter(this);
                    textblock.render('EntityEditor');
                },
            },
        ], [
            { type: 'short_text', entity: this, target: 'label',
                label: 'label_label', disabled: false },
            { type: 'checkbox', entity: this, target: 'def',
                label: 'label_def', disabled: false },
            { type: 'options', entity: this, target: 'cat',
                label: 'label_cat', disabled: false,
                options: ['cap', 'txt', 'ref', 'pat', 'int', 'res'] },
            { type: 'checkbox', entity: this, target: 'del',
                label: 'label_del', disabled: false },
            { type: 'long_text', entity: this, target: 'text',
                label: 'label_text', disabled: false },
        ]);
    }
    delete() {
        super.delete();
        if (!this.parent.hasChildren()) {
            new TextBlock(this.parent).render();
        }
    }
}
export const init = (params) => {
    initComponent('Header', 'Header');
    initComponent('ContentWindow', 'ContentWindow');
    if (params.mode === 'App') {
        initComponent('Dialog', 'Dialog');
        initComponent('DocumentationEditor', 'DocumentationEditor');
        initComponent('MainControl', 'MainControl');
        initComponent('EntityCollection', 'EntityCollection');
        initComponent('SourceList', 'SourceList');
        initComponent('ScrollNavigation', 'EntityCollection');
        getComponent('MainControl').addButtons([
            {
                label: 'button_clear',
                onclick: () => {
                    getComponent('Dialog').confirm('confirmation_clear', () => {
                        getComponent('DocumentationEditor').clear();
                    });
                },
                classList: ['item_pat'],
            },
            {
                label: 'button_copy',
                onclick: () => {
                    getComponent('DocumentationEditor').select();
                    document.execCommand('copy');
                    getComponent('Dialog').showInfo('success_copied');
                },
                classList: ['item_ref'],
            },
            {
                label: 'button_change_colour',
                onclick: () => {
                    toggleColorMode();
                },
                classList: ['item_txt'],
            },
        ]);
    }
    else if (params.mode === 'EntityEditor') {
        initComponent('Dialog', 'Dialog');
        initComponent('EntityEditor', 'EntityEditor');
        initComponent('MainControl', 'MainControl');
        initComponent('EntityCollection', 'EntityCollection');
        initComponent('SourceList', 'SourceList');
        initComponent('ScrollNavigation', 'EntityCollection');
        getComponent('MainControl').addButtons([
            {
                label: 'button_save_changes',
                onclick: () => {
                    getComponent('Dialog').confirm('confirmation_save', () => {
                        APP.saveCollection();
                    });
                },
                classList: ['item_ref'],
            },
        ]);
    }
    else if (params.mode === 'ContentEditor') {
        initComponent('Dialog', 'Dialog');
        initComponent('ContentEditor', 'ContentEditor');
        initComponent('MainControl', 'MainControl');
        initComponent('ContentPreview', 'ContentPreview');
        initComponent('SourceList', 'SourceList');
        getComponent('MainControl').addButtons([
            {
                label: 'button_save_changes',
                onclick: () => {
                    getComponent('Dialog').confirm('confirmation_save', () => {
                        APP.saveContent();
                    });
                },
                classList: ['item_ref'],
            },
            {
                label: 'button_convert',
                onclick: () => {
                    getComponent('ContentPreview').update(getComponent('ContentEditor').html);
                },
                classList: ['item_txt'],
            },
        ]);
    }
    if (params.scrollmenu === 'disable' && params.mode !== 'ContentEditor') {
        getComponent('ScrollNavigation').enabled = false;
    }
    toggleColorMode();
};
export const initComponent = (type, id) => {
    if (UI === null) {
        UI = new UserInterface();
    }
    UI.init(type, id);
};
export const getComponent = (type) => {
    if (UI === null) {
        UI = new UserInterface();
    }
    return UI.get(type);
};
export class UserInterface {
    constructor() {
        this.components = {};
    }
    init(type, id) {
        if (type in this.components) {
            throw Error(`Component "${type}" already initialised`);
        }
        this.components[type] = new Components[type](id);
    }
    get(type) {
        if (!(type in this.components)) {
            throw Error(`Type "${type}" not initialised.`);
        }
        return this.components[type];
    }
}
;
export class ComponentBase {
    constructor(htmlRoot, htmlContent) {
        this.htmlRoot = htmlRoot;
        this.htmlContent = htmlContent;
    }
}
;
export class ModalComponentBase extends ComponentBase {
    constructor(id) {
        const modal = new Modal(id);
        super(modal.htmlRoot, modal.htmlContent);
        this.modal = modal;
    }
    appendButtonsTo(parent, buttons) {
        buttons.forEach((button) => {
            const newButton = create('button');
            newButton.textContent = TR.tr(button.label);
            APP.addEventListener('languageloaded', () => {
                newButton.textContent = TR.tr(button.label);
            });
            newButton.addEventListener('click', (event) => {
                button.onclick(event);
                this.hide();
                event.stopPropagation();
            });
            newButton.classList.add('control');
            if (button.classList) {
                newButton.classList.add(...button.classList);
            }
            parent.appendChild(newButton);
        });
    }
    show() {
        this.modal.show();
    }
    hide() {
        this.modal.hide();
    }
}
;
export class ContentEditor extends ComponentBase {
    constructor(id) {
        const editor = create('textarea');
        editor.id = id;
        get('Main').appendChild(editor);
        super(editor, editor);
        this.contentID = '';
    }
    clear() {
        this.htmlContent.value = '';
    }
    get md() {
        return this.htmlContent.value;
    }
    get html() {
        return CNT.convertContent(this.md);
    }
    update(contentID) {
        this.contentID = contentID;
        CNT.appendContentTo(contentID, this.htmlContent, true)
            .then(() => {
            getComponent('ContentPreview').update(this.html);
        });
    }
}
;
export class ContentPreview extends ComponentBase {
    constructor(id) {
        const canvas = create('div');
        canvas.id = id;
        get('Main').appendChild(canvas);
        super(canvas, canvas);
        this.htmlContent.classList.add('content');
    }
    update(html) {
        this.htmlContent.innerHTML = html;
    }
}
;
export class ContentWindow extends ModalComponentBase {
    constructor(id = 'ContentWindow') {
        super(id);
    }
    clear() {
        this.modal.htmlContent.textContent = '';
    }
    showContent(content) {
        this.clear();
        CNT.appendContentTo(content, this.htmlContent);
        this.show();
    }
    showString(content, variables) {
        this.clear();
        this.htmlContent.innerHTML = TR.tr(content, variables);
        CNT.convertLinks(this.htmlContent);
        this.show();
    }
}
;
export class Dialog extends ModalComponentBase {
    constructor(id = 'Dialog') {
        super(id);
    }
    clear() {
        this.modal.htmlContent.textContent = '';
    }
    showDialog(content, buttons = []) {
        this.clear();
        const text = create('div');
        text.classList.add('modal_content');
        text.textContent = TR.tr(content);
        APP.addEventListener('languageloaded', () => {
            text.textContent = TR.tr(content);
        });
        this.htmlContent.append(text);
        const bar = create('div');
        bar.classList.add('pane', 'modal_bar', 'modal_bar_bottom');
        if (buttons.length === 0) {
            buttons.push({
                label: 'button_ok',
                onclick: () => { this.hide(); },
                classList: ['item_ref'],
            });
        }
        this.appendButtonsTo(bar, buttons);
        this.htmlContent.append(bar);
        this.show();
    }
    showInfo(content) {
        this.showDialog(content);
    }
    confirm(content, onconfirm, oncancel) {
        const ok = {
            label: 'button_ok',
            onclick: onconfirm,
            classList: ['item_ref'],
        };
        const cancel = {
            label: 'button_cancel',
            onclick: oncancel ? oncancel : () => { this.hide(); },
            classList: ['item_pat'],
        };
        this.showDialog(content, [ok, cancel]);
    }
}
;
export class DocumentationEditor extends ComponentBase {
    constructor(id) {
        const editor = create('textarea');
        editor.id = id;
        get('Main').appendChild(editor);
        super(editor, editor);
    }
    get value() {
        return this.htmlContent.value;
    }
    set value(text) {
        this.htmlContent.value = text;
    }
    clear() {
        this.htmlContent.value = '';
    }
    processTextBlock(text, del) {
        const index = this.value.indexOf(text);
        const [start, end] = [
            this.htmlContent.selectionStart,
            this.htmlContent.selectionEnd
        ];
        this.htmlContent.focus();
        if (del && index > -1) {
            this.value = this.value.replace(text, '');
            if (index < start) {
                this.htmlContent.selectionStart = start - text.length;
                this.htmlContent.selectionEnd = end - text.length;
            }
            else {
                this.htmlContent.selectionStart = start;
                this.htmlContent.selectionEnd = end;
            }
        }
        else {
            this.htmlContent.setRangeText(text, end, end, 'select');
            this.htmlContent.selectionStart =
                this.htmlContent.selectionEnd;
        }
    }
    select() {
        this.htmlContent.focus();
        this.htmlContent.select();
    }
}
;
export class EntityCollection extends ComponentBase {
    constructor(id) {
        const canvas = create('div');
        canvas.id = id;
        get('Main').appendChild(canvas);
        super(canvas, canvas);
        this.data = { name: '', label: '', items: [] };
    }
    clear() {
        this.htmlContent.textContent = '';
    }
    update(data, mode) {
        this.clear();
        getComponent('ScrollNavigation').clear();
        this.data = data;
        const collection = new Collection(data, this.htmlContent);
        collection.render(mode);
    }
}
;
export class EntityEditor extends ModalComponentBase {
    constructor(id = 'EntityEditor') {
        super(id);
    }
    clear() {
        this.modal.htmlContent.textContent = '';
    }
    update(entity, classList, buttons, fields) {
        this.clear();
        const editor = create('div');
        editor.classList.add('editor', ...classList);
        const toolbar = create('div');
        toolbar.classList.add('pane', 'modal_bar', 'modal_bar_top');
        editor.appendChild(toolbar);
        buttons.push({
            label: `button_delete_${entity.entityType}`,
            classList: ['item_pat'],
            onclick: () => {
                getComponent('Dialog').confirm(`confirmation_delete_${entity.entityType}`, () => {
                    entity.delete();
                    this.modal.hide();
                });
            },
        });
        this.appendButtonsTo(toolbar, buttons);
        const form = create('div');
        form.classList.add('modal_content');
        editor.appendChild(form);
        fields.forEach((field) => {
            const group = create('div');
            group.classList.add('pane', 'editor_row');
            if ('classList' in field && field.classList !== undefined) {
                group.classList.add(...field.classList);
            }
            form.appendChild(group);
            const id = generateRandomID();
            const label = create('label');
            label.textContent = TR.tr(field.label);
            APP.addEventListener('languageloaded', () => {
                label.textContent = TR.tr(field.label);
            });
            label.classList.add('label');
            label.htmlFor = id;
            group.appendChild(label);
            const input = this.input(field);
            input.disabled = field.disabled;
            input.id = id;
            input.classList.add('control');
            group.appendChild(input);
        });
        const bottom_bar = create('div');
        bottom_bar.classList.add('pane', 'modal_bar', 'modal_bar_bottom');
        editor.appendChild(bottom_bar);
        const ok = {
            label: 'button_ok',
            onclick: () => { this.modal.hide(); },
            classList: ['item_ref'],
        };
        const cancel = {
            label: 'button_cancel',
            onclick: () => {
                this.modal.hide();
                fields.forEach((field) => {
                    field.entity[field.target] = field.initialValue;
                });
            },
            classList: ['item_pat'],
        };
        this.appendButtonsTo(bottom_bar, [ok, cancel]);
        this.htmlContent.appendChild(editor);
        this.show();
    }
    ;
    input(field) {
        field.initialValue = field.entity[field.target];
        if (field.type === 'short_text') {
            const input = create('input');
            input.value =
                field.entity[field.target].replace(/\n/g, '\\n');
            input.addEventListener('keydown', (event) => {
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
            });
            input.oninput = () => {
                field.entity[field.target] =
                    input.value.replace(/\\n/g, '\n');
            };
            return input;
        }
        else if (field.type === 'long_text') {
            const input = create('textarea');
            input.value = field.entity[field.target];
            input.addEventListener('input', () => {
                field.entity[field.target] = input.value;
            });
            return input;
        }
        else if (field.type === 'options') {
            const input = create('select');
            input.value = field.entity[field.target];
            input.onchange = () => {
                field.entity[field.target] = input.value;
            };
            if (field.options !== undefined) {
                for (let option of field.options) {
                    const optionElement = create('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    if (option === field.entity[field.target]) {
                        optionElement.selected = true;
                    }
                    input.appendChild(optionElement);
                }
            }
            return input;
        }
        else if (field.type === 'checkbox') {
            const input = create('input');
            input.type = 'checkbox';
            input.checked = field.entity[field.target];
            input.oninput = () => {
                field.entity[field.target] = input.checked;
            };
            return input;
        }
        throw Error(`Invalid field type "${field.type}"`);
    }
    ;
}
;
export class Header extends ComponentBase {
    constructor(id) {
        const header = create('header');
        header.id = id;
        get('Main').appendChild(header);
        super(header, header);
        this.htmlSourceIndicator = create('div');
        const group = create('span');
        header.appendChild(group);
        this.htmlTitle = create('strong');
        group.appendChild(this.htmlTitle);
        group.appendChild(create('br'));
        this.htmlSubtitle = create('span');
        group.appendChild(this.htmlSubtitle);
        this.htmlSourceIndicator.id = 'SourceIndicator';
        this.htmlSourceIndicator.addEventListener('click', () => {
            getComponent('SourceList').show();
        });
        header.appendChild(this.htmlSourceIndicator);
        this.htmlAboutButton = create('button');
        this.htmlAboutButton.classList.add('control');
        this.htmlAboutButton.addEventListener('click', () => {
            getComponent('ContentWindow').showString('page_about', { 'version': VERSION });
        });
        header.appendChild(this.htmlAboutButton);
        APP.addEventListener('languageloaded', () => {
            this.htmlTitle.textContent = TR.tr('app_title');
            this.htmlSubtitle.textContent = TR.tr('app_subtitle');
            this.htmlAboutButton.textContent = TR.tr('button_about');
        });
    }
    updateSourceIndicator(label) {
        this.htmlSourceIndicator.textContent = label;
    }
}
;
export class MainControl extends ComponentBase {
    constructor(id) {
        const canvas = create('div');
        canvas.id = id;
        canvas.classList.add('pane');
        get('Main').appendChild(canvas);
        super(canvas, canvas);
    }
    clear() {
        this.htmlContent.textContent = '';
    }
    update(buttons) {
        this.clear();
        this.addButtons(buttons);
    }
    addButtons(buttons) {
        buttons.forEach((button) => {
            this.addButton(button);
        });
    }
    addButton(button) {
        const newButton = create('button');
        newButton.textContent = TR.tr(button.label);
        APP.addEventListener('languageloaded', () => {
            newButton.textContent = TR.tr(button.label);
        });
        newButton.addEventListener('click', (event) => {
            button.onclick(event);
            event.stopPropagation();
        });
        newButton.classList.add('control');
        if ('classList' in button && button.classList !== undefined) {
            newButton.classList.add(...button.classList);
        }
        this.htmlContent.appendChild(newButton);
    }
}
;
export class ScrollNavigation extends ModalComponentBase {
    constructor(targetID) {
        super('ScrollNavigation');
        this.scrollposition = null;
        this.items = {};
        this.target = get(targetID);
        this.target.addEventListener('scroll', () => {
            this.eventHandler();
        });
        this.scrollposition = this.target.scrollTop;
        this.hide();
    }
    clear() {
        this.htmlContent.textContent = '';
        this.items = {};
    }
    eventHandler() {
        const currentPosition = this.target.scrollTop;
        if (this.scrollposition !== null &&
            Math.abs(this.scrollposition - currentPosition) > 650) {
            this.scrollposition = null;
            this.show();
            setTimeout(() => {
                this.scrollposition = this.target.scrollTop;
            }, 1000);
        }
        setTimeout(() => {
            if (this.scrollposition === null) {
                return;
            }
            this.scrollposition = this.target.scrollTop;
        }, 250);
    }
    addNavigationItem(id, label) {
        if (id in this.items) {
            throw Error(`Item with id "${id}" already exists.`);
        }
        this.items[id] = create('a');
        this.items[id].textContent = label;
        this.items[id].href = `#${id}`;
        this.items[id].classList.add('control', 'item', 'item_def');
        const item = this.items[id];
        this.items[id].addEventListener('click', (event) => {
            this.scrollposition = null;
            this.hide();
            get(item.getAttribute("href").substring(1)).scrollIntoView({ block: 'start', behavior: 'instant' });
            this.scrollposition = this.target.scrollTop;
            event.preventDefault();
        });
        this.htmlContent.appendChild(this.items[id]);
    }
    updateNavigationItem(id, newId, newLabel) {
        if ((!(id in this.items)) || id === newId) {
            return;
        }
        this.items[newId] = this.items[id];
        delete this.items[id];
        this.items[newId].textContent = newLabel;
        this.items[newId].href = `#${newId}`;
    }
    set enabled(enabled) {
        this.scrollposition = enabled ? this.target.scrollTop : null;
    }
    get enabled() {
        return this.scrollposition !== null ? true : false;
    }
}
;
export class SourceList extends ModalComponentBase {
    constructor(id = 'SourceList') {
        super(id);
        this.items = {};
    }
    clear() {
        this.htmlContent.textContent = '';
    }
    addSourceItem(name, label, onclick) {
        if (name in this.items) {
            throw Error(`Item with name "${name}" already exists.`);
        }
        this.items[name] = create('a');
        this.items[name].textContent = label;
        this.items[name].classList.add('control', 'item', 'item_def');
        this.items[name].addEventListener('click', (event) => {
            onclick(event);
            this.hide();
            event.stopPropagation();
        });
        this.htmlContent.appendChild(this.items[name]);
    }
}
;
let UI = null;
export const Components = {
    ContentEditor,
    ContentPreview,
    ContentWindow,
    Dialog,
    DocumentationEditor,
    EntityCollection,
    EntityEditor,
    Header,
    MainControl,
    ScrollNavigation,
    SourceList
};
export class Modal extends ComponentBase {
    constructor(id) {
        super(create('div'), create('div'));
        this.htmlRoot.id = `${id}Background`;
        this.htmlRoot.classList.add('modal_background');
        this.htmlContent.id = id;
        this.htmlContent.classList.add('modal_canvas');
        this.htmlRoot.appendChild(this.htmlContent);
        document.body.appendChild(this.htmlRoot);
        this.htmlRoot.addEventListener('click', () => { this.hide(); });
        this.htmlContent.addEventListener('click', (event) => { event.stopPropagation(); });
        this.hide();
    }
    ;
    activateOn(id) {
        get(id).addEventListener('click', this.show);
    }
    ;
    show() {
        this.htmlRoot.style.display = 'flex';
    }
    ;
    hide() {
        this.htmlRoot.style.display = 'none';
    }
    ;
}
;
let COLORSTATE = 0;
export const toggleColorMode = () => {
    const html = document.documentElement;
    if (COLORSTATE === 0) {
        html.classList.add('item_color');
        COLORSTATE = 1;
    }
    else if (COLORSTATE === 1) {
        html.classList.add('item_border', 'dark_mode');
        COLORSTATE = 2;
    }
    else if (COLORSTATE === 2) {
        html.classList.remove('item_color', 'item_border', 'dark_mode');
        COLORSTATE = 0;
    }
};
export const get = (id) => {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Could not find element with id "${id}"`);
    }
    return element;
};
export const apply = (selector, fn) => {
    document.querySelectorAll(selector).forEach(fn);
};
export const create = (tagName) => {
    return document.createElement(tagName);
};
export const generateCSSCompatibleString = (string) => {
    string = string.toLowerCase();
    string = string.replace(/[^a-zA-Z0-9_\-]/g, '');
    string = string.replace(/[\s_\-]+/g, '');
    string = string.replace(/[\s_]+/g, '-');
    return string;
};
export const generateRandomID = (length = 6) => {
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
