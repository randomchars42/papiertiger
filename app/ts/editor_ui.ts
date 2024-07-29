/**
 */
import * as APP from './editor_app.js';
import * as TR from './translate.js';
import * as TXT from './texts.js';
import {VERSION} from './constants.js';

export type ListItem = {
    name: string,
    label: string,
}

export type Item = {
    type: string,
    del: boolean,
    cat: string,
    label: string,
    text: string,
}

export type Text = {
    name: string;
    text: string,
}

export type ItemRow = Item[]

export type ItemCollection = {
    label: string,
    collapsed: boolean,
    items: (Text|ItemRow)[],
}

type Button = {
    label: string,
    onclick: (event: Event) => void
}

class Entity {
    parent: Entity|null = null;
    entity: any = null;
    entityHTML: HTMLElement;
    children: any[] = [];
    type: string = '';

    constructor(type: string, entityHTML: HTMLElement) {
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
        const currentIndex: number = this.getEntityIndex();
        if (currentIndex > -1 && this.parent !== null) {
            this.parent.children.splice(currentIndex, 1);
        }
    }

    appendEntity(parent: Entity) {
        this.removeEntity();
        this.parent = parent;
        parent.children.push(this.entity);
    }

    moveEntityBefore(beforeEntity: Entity) {
        if (beforeEntity.parent === null) {
            return;
        }
        this.removeEntity();
        this.parent = beforeEntity.parent;
        beforeEntity.parent.children.splice(
            beforeEntity.getEntityIndex(),
            0,
            this.entity);
    }

    moveEntityAfter(afterEntity: Entity) {
        if (afterEntity.parent === null) {
            return;
        }
        this.removeEntity();
        this.parent = afterEntity.parent;
        afterEntity.parent.children.splice(
            afterEntity.getEntityIndex() + 1,
            0,
            this.entity);
    }

    appendHTML(parent: Entity) {
        parent.entityHTML.appendChild(this.entityHTML);
    }

    moveHTMLBefore(beforeEntityHTML: Entity) {
        beforeEntityHTML.entityHTML.before(this.entityHTML);
    }

    moveHTMLAfter(afterEntityHTML: Entity) {
        afterEntityHTML.entityHTML.after(this.entityHTML);
    }

    createNewBefore(entity: Entity) {
        entity.moveEntityBefore(this);
        entity.moveHTMLBefore(this);
        entity.createEditor();
        console.log(this.getContentEntity());
    }

    createNewAfter(entity: Entity) {
        entity.moveEntityAfter(this);
        entity.moveHTMLAfter(this);
        entity.createEditor();
        console.log(this.getContentEntity());
    }

    createEditor() {}

    getContentEntity() {}

    delete() {
        this.entityHTML.parentNode?.removeChild(this.entityHTML);
        this.removeEntity();
    }
}

class CollectionsEntity extends Entity {
    parent: null = null;
    entity: ItemCollection[];
    children: ItemCollection[];

    constructor(entity: ItemCollection[],
                entityHTML: HTMLElement,
                name: string) {
        super('collections', entityHTML);

        if (entity === null) {
            entity = [];
            this.entity = entity;
            this.children = entity;
        } else {
            this.entity = entity;
            this.children = entity;
        }

        this.entityHTML.onclick = (event: Event): void => {
            this.createEditor();
            event.stopPropagation();
        };

        const label: HTMLHeadingElement = document.createElement('h2');
        label.textContent = name;
        this.entityHTML.appendChild(label);

        let i: number = 0;
        for (i = 0; i < this.children.length; i++) {
            const id: string = generateCSSString(this.children[i].label);
            const entity: CollectionEntity = new CollectionEntity(
                this,
                this.children[i]);
        }
        if (i === 0) {
            const newEntity: CollectionEntity = new CollectionEntity(this);
        }
    }

    createEditor() {
        const editor: HTMLElement = createEditor(
            this,
            ['editor_collections'],
            {
                label: 'button_append_collection',
                onclick: (event: Event) => {
                    const entity = new CollectionEntity(this);
                }
            }
        );

        openEditor(editor);
        return editor;
    }

    getContentEntity() {
        return this.entity;
    }

    delete() {
        this.entityHTML.textContent = '';
        this.children.length = 0;
        const newEntity: CollectionEntity = new CollectionEntity(this);
        console.log(this.getContentEntity());
    }
}

class CollectionEntity extends Entity  {
    parent: CollectionsEntity;
    entity: ItemCollection;
    entityNavHTML: HTMLAnchorElement;
    children: (ItemRow|Text)[];

    constructor(parent: CollectionsEntity,
                entity: ItemCollection|null = null) {
        super('collection', document.createElement('div'));
        this.parent = parent;

        if (entity === null) {
            entity = {
                label: '',
                collapsed: false,
                items: []
            }
            this.entity = entity;
            this.children = entity.items;
            this.appendEntity(parent);
        } else {
            this.entity = entity;
            this.children = entity.items;
        }

        this.appendHTML(parent);

        this.entityNavHTML = this.addNavItem();
        this.id = entity.label;

        this.entityHTML.onclick = (event: Event): void => {
            this.createEditor();
            event.stopPropagation();
        };

        const label: HTMLHeadingElement = document.createElement('h2');
        label.textContent = entity.label;
        this.entityHTML.appendChild(label);

        let i: number = 0;
        for (i = 0; i < this.children.length; i++) {
            if ('text' in this.children[i]){
                const newEntity: TextEntity = new TextEntity(
                    this, (this.children[i] as Text));
            } else {
                const newEntity: RowEntity = new RowEntity(
                    this, (this.children[i] as ItemRow));
            }
        }
        if (i === 0) {
            const newEntity: RowEntity = new RowEntity(this);
        }
    }

    get label() {
        return this.entity.label;
    }

    set label(label: string) {
        this.entity.label = label;
        this.entityHTML.firstElementChild!.textContent = label;
        this.id = label;
        this.entityNavHTML.textContent = label;
    }

    get id() {
        return this.entityHTML.id;
    }

    set id(id: string) {
        id = generateCSSString(id);
        this.entityHTML.id = id;
        this.entityNavHTML.href = `#${id}`;
    }

    get collapsed() {
        return this.entity.collapsed;
    }

    set collapsed(collapsed: boolean) {
        this.entity.collapsed = collapsed;
    }

    addNavItem() {
        const item: HTMLAnchorElement = document.createElement('a');
        item.textContent = this.label;
        item.href = '#' + this.id;
        item.classList.add('control', 'item', 'item_def');
        item.onclick = (event: Event): void => {
            SCROLLPOSITION = null;
            hideNav();
            document.getElementById(this.id)!.scrollIntoView(
                {block: 'start', behavior: 'instant'});
            SCROLLPOSITION = document.getElementById('MainInput')!.scrollTop;
            event.preventDefault();
        };

        document.getElementById('MainNav')!.appendChild(item);
        return item;
    }

    createEditor() {
        const editor: HTMLElement = createEditor(
            this,
            ['editor_collection'],
            {
                label: 'button_new_collection_before',
                onclick: (event: Event) => {
                    const entity = new CollectionEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_collection_after',
                onclick: (event: Event) => {
                    const entity = new CollectionEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            },
            {
                label: 'button_append_row',
                onclick: (event: Event) => {
                    const entity = new RowEntity(this);
                },
            },
            {
                label: 'button_append_text',
                onclick: (event: Event) => {
                    const entity = new TextEntity(this);
                }
            }
        );

        createTextfield(TR.tr('label_label'), this.label,
                        this, 'label', editor, 'text', []);
        createCheckbox(TR.tr('label_collapsed'), this.collapsed,
                       this, 'collapsed', editor, []);

        openEditor(editor);
        return editor;
    }

    getContentEntity() {
        return this.parent.getContentEntity();
    }

    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity: CollectionEntity = new CollectionEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}

class RowEntity extends Entity  {
    parent: CollectionEntity;
    entity: ItemRow;
    children: ItemRow;

    constructor(parent: CollectionEntity,
                entity: ItemRow|null = null) {
        super('row', document.createElement('div'));
        this.parent = parent;

        if (entity === null) {
            entity = []
            this.entity = entity;
            this.children = entity;
            this.appendEntity(parent);
        } else {
            this.entity = entity;
            this.children = entity;
        }

        this.appendHTML(parent);

        this.entityHTML.onclick = (event: Event): void => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.classList.add('pane', 'row');

        let i: number = 0;
        for (i = 0; i < this.children.length; i++) {
            const newEntity: ItemEntity = new ItemEntity(this, this.children[i]);
        }
        if (i === 0) {
            const newEntity: ItemEntity = new ItemEntity(this);
        }
    }

    createEditor() {
        const editor: HTMLElement = createEditor(
            this,
            ['editor_row'],
            {
                label: 'button_new_row_before',
                onclick: (event: Event) => {
                    const entity = new RowEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_text_before',
                onclick: (event: Event) => {
                    const entity = new TextEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_row_after',
                onclick: (event: Event) => {
                    const entity = new RowEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            },
            {
                label: 'button_new_text_after',
                onclick: (event: Event) => {
                    const entity = new TextEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            },
            {
                label: 'button_append_item',
                onclick: (event: Event) => {
                    const entity = new ItemEntity(this);
                },
            },
        );

        openEditor(editor);
        return editor;
    }

    getContentEntity() {
        return this.parent.getContentEntity();
    }

    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity: RowEntity = new RowEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}

class TextEntity extends Entity {
    parent: CollectionEntity;
    entity: Text;

    constructor(parent: CollectionEntity,
                entity: Text|null = null) {
        super('text', document.createElement('div'));
        this.parent = parent;

        const textHTML: HTMLElement = document.createElement('div');
        this.entityHTML.appendChild(textHTML);

        if (entity === null) {
            entity = {'text': '', 'name': ''};
            this.entity = entity;
            this.appendEntity(parent);
        } else {
            this.entity = entity;
            TXT.appendText(entity.name, textHTML);
        }

        this.name = entity.name;

        this.appendHTML(parent);

        this.entityHTML.onclick = (event: Event): void => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.classList.add('text');

        console.log(this);
    }

    get name() {
        return this.entity.name;
    }

    set name(name: string) {
        this.entity.name = name;
    }

    get text() {
        this.entity.text = this.entityHTML.textContent || '';
        return this.entity.text;
    }

    set text(text: string) {
        this.entity.text = text;
    }

    createEditor() {
        const editor: HTMLElement = createEditor(
            this,
            ['editor_text'],
            {
                label: 'button_new_row_before',
                onclick: (event: Event) => {
                    const entity = new RowEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_text_before',
                onclick: (event: Event) => {
                    const entity = new TextEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_row_after',
                onclick: (event: Event) => {
                    const entity = new RowEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            },
            {
                label: 'button_new_text_after',
                onclick: (event: Event) => {
                    const entity = new TextEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            }
        );

        createTextfield(TR.tr('label_label'), this.name, this,
                        'name', editor, 'text', []);
        createTextarea(TR.tr('label_text'), this.text, this,
                        'text', editor, [], true);

        openEditor(editor);
        return editor;
    }

    getContentEntity() {
        return this.parent.getContentEntity();
    }

    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity: TextEntity = new TextEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}

class ItemEntity extends Entity  {
    parent: RowEntity;
    entity: Item;

    constructor(parent: RowEntity,
                entity: Item|null = null) {
        super('item', document.createElement('div'));
        this.parent = parent;

        if (entity === null) {
            entity = {
                type: 'def',
                del: false,
                cat: 'txt',
                label: '',
                text: ''
            }
            this.entity = entity;
            this.appendEntity(parent);
        } else {
            this.entity = entity;
        }

        this.appendHTML(parent);

        this.entityHTML.onclick = (event: Event): void => {
            this.createEditor();
            event.stopPropagation();
        };
        this.entityHTML.textContent = entity.label;
        this.entityHTML.classList.add(
            'control', 'control_variable_width', 'item', `item_${this.cat}`,
            `item_${this.entityType}`);
    }

    get label() {
        return this.entity.label;
    }

    set label(label: string) {
        this.entity.label = label;
        this.entityHTML.textContent = label;
    }

    get cat() {
        return this.entity.cat;
    }

    set cat(cat: string) {
        this.entityHTML.classList.remove(`item_${this.cat}`);
        this.entity.cat = cat;
        this.entityHTML.classList.add(`item_${cat}`);
    }

    get text() {
        return this.entity.text;
    }

    set text(text: string) {
        this.entity.text = text;
    }

    get del() {
        return this.entity.del;
    }

    set del(del: boolean) {
        this.entity.del = del;
    }

    get entityType() {
        return this.entity.type;
    }

    set entityType(type: string) {
        this.entityHTML.classList.remove(`item_${this.entityType}`);
        this.entity.type = type;
        this.entityHTML.classList.add(`item_${type}`);
    }

    createEditor() {
        const editor: HTMLElement = createEditor(
            this,
            ['editor_item'],
            {
                label: 'button_new_item_before',
                onclick: (event: Event) => {
                    const entity = new ItemEntity(this.parent);
                    this.createNewBefore(entity);
                    event.stopPropagation();
                }
            },
            {
                label: 'button_new_item_after',
                onclick: (event: Event) => {
                    const entity = new ItemEntity(this.parent);
                    this.createNewAfter(entity)
                    event.stopPropagation();
                },
            },
        );

        createTextfield(TR.tr('label_label'), this.label, this,
                        'label', editor, 'text', []);
        createOptions(TR.tr('label_type'), this.type, this,
                        'type', editor, ['def', 'ext'], []);
        createOptions(TR.tr('label_cat'), this.cat, this,
                        'cat', editor, ['cap', 'ref', 'pat', 'txt', 'int', 'res'],
                        []);
        createCheckbox(TR.tr('label_del'), this.del, this,
                       'del', editor, []);
        createTextarea(TR.tr('label_text'), this.text, this,
                        'text', editor, []);

        openEditor(editor);
        return editor;
    }

    getContentEntity() {
        return this.parent.getContentEntity();
    }

    delete() {
        super.delete();
        if (this.parent.children.length === 0) {
            const newEntity: ItemEntity = new ItemEntity(this.parent);
        }
        console.log(this.getContentEntity());
    }
}

let SCROLLPOSITION: number|null =
    document.getElementById('MainInput')!.scrollTop;

export const init = (): void => {
    console.log('initiating ...');

    document.getElementById('ListItemDisplay')!.onclick = showList;
    document.getElementById('ListModal')!.onclick = hideList;
    document.getElementById('NavModal')!.onclick = hideNav;
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
    document.getElementById('MainInput')!.onsubmit = (event: Event) => {
        event?.preventDefault()
    };
    document.getElementById('MainEditor')!.onsubmit = (event: Event) => {
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

export const showSubmitSuccess = (): void => {
    alert(TR.tr('success_saved'));
};

export const showSubmitError = (): void => {
    alert(TR.tr('error_not_saved'));
};

export const disableScrollMenu = (): void => {
    SCROLLPOSITION = null;
};

export const clearEditElements = (parent: HTMLElement): void => {
    parent.textContent = '';
};

export const generateEditElements = (collections: ItemCollection[],
                                     parent: HTMLElement,
                                     name: string): void => {
    resetNav();
    const collectionsEntity: CollectionsEntity = new CollectionsEntity(
        collections,
        parent,
        name);
};

export const clearEditor = (): HTMLElement => {
    const container: HTMLElement = document.getElementById('MainEditor')!;
    container.textContent = '';
    return container;
};

const openEditor = (editor: HTMLElement): void => {
    const container: HTMLElement = clearEditor();
    container.appendChild(editor);
};

const createEditor = (entity: Entity,
                      classList: string[],
                      ...buttons: Button[]): HTMLElement => {
    const editor = document.createElement('div');
    editor.classList.add('editor', `editor_${entity.type}`);

    const toolbar = document.createElement('div');
    toolbar.classList.add('editor_toolbar', 'pane');
    editor.appendChild(toolbar);

    buttons.forEach(
        (button: Button): void => {
        const newButton = document.createElement('button');
        newButton.textContent = TR.tr(button.label);
        newButton.onclick = button.onclick;
        newButton.classList.add('control')//, 'control_variable_width');
        toolbar.appendChild(newButton);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = TR.tr(`button_delete_${entity.type}`);
    deleteButton.onclick = () => {
        if (window.confirm(TR.tr(`confirmation_delete_${entity.type}`))) {
            entity.delete();
        }
    };
    deleteButton.classList.add('control')//, 'control_variable_width');
    toolbar.appendChild(deleteButton);

    console.log(entity.getContentEntity());
    return(editor);
};

const createTextfield = (label: string, content: string,
                         entity: any, target: string,
                         parent: HTMLElement, type: string = 'text',
                         classList: string[] = [],
                         disabled: boolean = false): HTMLInputElement => {
    const group: HTMLElement = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement: HTMLLabelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input: HTMLInputElement = document.createElement('input');
    input.type = type;
    input.disabled = disabled;
    input.value = content.replace(/\n/g, '\\n');
    input.onkeydown = (event: KeyboardEvent): void => {
        if (event.defaultPrevented) {
            return; // Should do nothing if the default action has been cancelled
        }

        let handled = false;
        if (event.key !== undefined) {
            if (event.key === 'Enter') {
                event.preventDefault();
                handled = true;
            }
        } else if (event.keyCode !== undefined) {
            if (event.keyCode === 13) {
                event.preventDefault();
                handled = true;
            }
        }

        if (handled) {
            // Suppress "double action" if event handled
            event.preventDefault();
        }
    };
    input.oninput = (): void => {
        entity[target] = input.value.replace(/\\n/g, '\n');
    };
    input.classList.add('control');
    group.appendChild(input);

    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;

    return input;
};

const createTextarea = (
    label: string, content: string, entity: any, target: string,
    parent: HTMLElement, classList: string[] = [],
    disabled: boolean = false): HTMLTextAreaElement => {
    const group: HTMLElement = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement: HTMLLabelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input: HTMLTextAreaElement = document.createElement('textarea');
    input.value = content;
    input.disabled = disabled;
    input.oninput = (): void => {
        entity[target] = input.value;
    };
    input.classList.add('control');
    group.appendChild(input);

    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;
    return input;
};

const createOptions = (
    label: string, content: string, entity: any, target: string,
    parent: HTMLElement, options: string[] = [], classList: string[] = [],
    disabled: boolean = false): HTMLSelectElement => {
    const group: HTMLElement = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement: HTMLLabelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const select: HTMLSelectElement = document.createElement('select');
    select.value = content;
    select.disabled = disabled;
    select.onchange = (): void => {
        entity[target] = select.value;
    };
    for (let i in options) {
        const option: HTMLOptionElement = document.createElement('option');
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

const createCheckbox = (
    label: string, state: boolean, targetParent: any, target: string,
    parent: HTMLElement, classList: string[] = [],
    disabled: boolean = false): HTMLInputElement => {
    const group: HTMLElement = document.createElement('div');
    group.classList.add(...classList);
    group.classList.add('pane', 'editor_group');
    parent.appendChild(group);
    const labelElement: HTMLLabelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.classList.add('label');
    group.appendChild(labelElement);
    const input: HTMLInputElement = document.createElement('input');
    input.type = 'checkbox';
    input.checked = state;
    input.disabled = disabled;
    input.oninput = (): void => {
        targetParent[target] = input.checked;
    };
    group.appendChild(input);

    const id = generateID();
    labelElement.htmlFor = id;
    input.id = id;
    input.classList.add('control');
    return input;
};

export const generateListElements = (list: ListItem[],
                                     parent: HTMLElement): void => {
    list.forEach((item: ListItem): void => {
        addListItem(item.label, item.name, parent);
    });
};

const generateCSSString = (string: string): string => {
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

const generateID = (length: number = 6): string => {
    let result: string = '';
    const characters: string =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength: number = characters.length;
    let counter: number = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
};

const addListItem = (label: string, name: string,
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

const resetNav = (): void => {
    document.getElementById('MainNav')!.textContent = '';
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

const showNav = (): void => {
    document.getElementById('NavModal')!.classList.remove('hidden');
};

const hideNav = (): void => {
    document.getElementById('NavModal')!.classList.add('hidden');
}

const toggleClass = (selector: string, classname: string): void => {
    document.querySelectorAll(selector).forEach((element: Element): void => {
        element.classList.toggle(classname);
    });
};

