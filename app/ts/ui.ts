/**
 * uilib.ts
 *
 * Types and UI elements.
 */

import * as APP from './app.js';
import * as TR from './translate.js';
import * as CNT from './content.js';
import {VERSION} from './constants.js';

/**
 *
 * Data types.
 *
 */

/**
 * The basic text block - that's what the whole app is about.
 *
 * Contains a label with a short text that will insert a larger text block into
 * the documentation.
 *
 * * `label`: The short label to recognize the content of the text.
 * * `text`: The block of text to insert.
 * * `def`: Visible by default or only in extended mode?
 * * `cat`: Determines the how the button to insert text is presented.
 * * `del`: Will a second click on the button insert a second textblock or
 *   search the existing documentation for the first occurence of the text and
 *   remove it.
 */
export type TextBlockData = {
    def: boolean,
    del: boolean,
    cat: string,
    label: string,
    text: string,
};

/**
 * Groups `TextBlockData` for cleaner representation on the screen.
 */
export type GroupData = {
    items: TextBlockData[];
};

/**
 * Container for content to be shown.
 *
 * Might be hints or standard operating procedures.
 *
 * * `source`: File with the source for the HTML fragment to fetch from the
 *   server and display.
 */
export type ContentData = {
    source: string,
};

/**
 * Bundles related `GroupData` and `ContentData` under a common heading.
 *
 * * `label`: The heading for the category.
 * * `collapsed`: Display the collection initially in a collapsed state, i.e.
 *   only the heading?
 * * `items`: `GroupData` and `ContentData` belonging to that `Category`.
 */
export type CategoryData = {
    label: string,
    collapsed: boolean,
    items: (GroupData|ContentData)[],
};

/**
 * A collection of `CategoryData`, will be saved on the server as a file.
 *
 * * `name`: The name / filename (`NAME.json` or `NAME.bk.DATE.json`).
 * * `label`: A human readable form of the name, should be the same as in 
 *   `list.json`.
 * * `items`: The `CollectionData`'s `CategoryData` items.
 */
export type CollectionData = {
    name: string,
    label: string,
    items: CategoryData[];
};

/**
 *
 * Entities: UI components for data parts.
 *
 */

/**
 * Combines data structure and UI part.
 */
class Entity {
    protected parent: Entity|null = null;
    protected data: any = null;
    protected children: any[] = [];
    protected html: HTMLElement;
    public entityType: string = '';

    constructor(entityType: string, html: HTMLElement) {
        this.entityType = entityType;
        this.html = html;
        this.html.classList.add(this.entityType);
    }

    protected get index(): number {
        if (this.parent === null) {
            throw new Error('Item has no parent.');
        } else if (!('data' in this.parent)) {
            throw new Error('Parent has no data.');
        } else if (!('items' in this.parent.data)) {
            throw new Error('Parent data has no children.');
        } else if (this.parent.children.length === 0) {
            throw new Error('Parent has no children.');
        }
        const entityIndex: number = this.parent.children.indexOf(this);
        const dataIndex: number = this.parent.data.items.indexOf(this.data);
        if (entityIndex !== dataIndex) {
            throw new Error(
                `Entity index (${entityIndex}) != data index (${dataIndex})`);
        }
        return entityIndex;
    }

    public remove(): void {
        const currentIndex: number = this.index;
        if (currentIndex === -1) {
            throw new Error('Item not in parent.');
        }
        this.parent!.data.items.splice(currentIndex, 1);
        this.parent!.children.splice(currentIndex, 1);
        this.html.parentNode?.removeChild(this.html);
    }

    public appendTo(parent: Entity): void {
        this.remove();
        this.parent = parent;
        parent.data.items.push(this.data);
        parent.children.push(this);
        parent.html.appendChild(this.html);
    }

    public moveToInitialPosition(): void {
        if (this.parent === null) {
            throw Error('No parent');
        } else if (!('data' in this.parent)) {
            throw new Error('Parent has no data.');
        } else if (!('items' in this.parent.data)) {
            throw new Error('Parent data has no children.');
        }

        const index = this.parent.data.items.indexOf(this.data);

        if (index === -1) {
            this.parent.data.items.push(this.data);
        }

        this.parent.children.push(this);
        this.parent.html.appendChild(this.html);
    }

    public moveBefore(before: Entity): void {
        if (before.parent === null) {
            return;
        }
        this.remove();
        this.parent = before.parent;
        const index: number = before.index;
        before.parent.data.items.splice(index, 0, this.data);
        before.parent.children.splice(index, 0, this);
        before.html.before(this.html);
    }

    public moveAfter(after: Entity): void {
        if (after.parent === null) {
            return;
        }
        this.remove();
        this.parent = after.parent;
        const index: number = after.index + 1;
        after.parent.data.items.splice(index, 0, this.data);
        after.parent.children.splice(index, 0, this);
        after.html.after(this.html);
    }

    public delete(): void {
        this.remove();
    }

    public render(mode: APP.Params['mode']): void {
        throw Error(`"render" called on "Entity" with mode "${mode}"`);
    }

    protected openEditor(): void {}

    public hide(): void {
        this.html.style.display = 'none';
    }

    public show(): void {
        this.html.style.display = 'initial';
    }

    public hasChildren(): boolean {
        return (this.children.length > 0);
    }

    public getDataRoot(): CollectionData {
        if (this.parent === null) {
            return this.data;
        } else {
            return this.parent.getDataRoot();
        }
    }
}

class Collection extends Entity implements CollectionData {
    protected parent: null = null;
    protected data: CollectionData;
    protected children: Category[] = [];

    constructor(data: CollectionData,
                htmlParent: HTMLElement) {
        super('collection', htmlParent);

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

    public get items(): CategoryData[] {
        return this.data.items;
    }

    public set name(name: string) {
        this.data.name = name;
    }

    public get name(): string {
        return this.data.name;
    }

    public set label(label: string) {
        this.data.label = label;
        if (this.html.firstElementChild !== null) {
            this.html.firstElementChild.textContent = label;
        }
    }

    public get label(): string {
        return this.data.label;
    }

    public render(mode: APP.Params['mode'] = 'App'): void {
        if (mode !== 'App') {
            this.html.addEventListener('click', (event: Event): void => {
                this.openEditor();
                event.stopPropagation();
            });

            const label: HTMLHeadingElement = create('h1');
            label.textContent = this.data.label;
            label.classList.add('heading');
            this.html.insertBefore(label, this.html.firstChild);
            this.html.classList.add('editor_mode');
        }

        this.children.forEach((child: Category) => { child.render(mode); });
    }

    public openEditor(): void {
        getComponent('EntityEditor').update(
            this,
            ['editor_collection'],
            [
                {
                    label: 'button_append_category',
                    onclick: () => {
                        const category: Category = new Category(this);
                        category.render('EntityEditor');
                    }
                }
            ],
            [
                { type: 'short_text', entity: this, target: 'name',
                    label: 'label_name', disabled: false },
                { type: 'short_text', entity: this, target: 'label',
                    label: 'label_label', disabled: false },
            ]
        );
    }

    public delete(): void {
        this.html.textContent = '';
        this.data.items.length = 0;
        this.children.length = 0;
        new Collection(this.data, this.html);
    }
}

class Category extends Entity implements CategoryData {
    protected parent: Collection;
    protected data: CategoryData;
    protected children: (Group|Content)[] = [];

    constructor(parent: Collection,
                data: CategoryData|null = null) {
        super('category', create('div'));
        this.parent = parent;

        if (data === null) {
            data = {
                label: '',
                collapsed: false,
                items: []
            }
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
                new Content(this, (this.data.items[i] as ContentData));
            } else {
                new Group(this, (this.data.items[i] as GroupData));
            };
        }

        if (this.children.length === 0) {
            new Group(this).render();
        }
    }

    public render(mode: APP.Params['mode'] = 'App'): void {
        const label: HTMLHeadingElement = create('h2');
        label.textContent = this.label;
        label.classList.add('heading');
        this.html.insertBefore(label, this.html.firstChild);

        if (mode === 'App') {
            if (this.collapsed) {
                this.collapse();
            } else {
                this.expand();
            }
            label.addEventListener('click', (event: Event): void => {
                if (this.collapsed) {
                    this.expand();
                } else {
                    this.collapse()
                }
                event.stopPropagation();
            });
        } else {
            this.html.addEventListener('click', (event: Event): void => {
                this.openEditor();
                event.stopPropagation();
            });
        }

        this.children.forEach(
            (child: (Content|Group)): void => {child.render(mode);});
    }

    get items(): (GroupData|ContentData)[] {
        return this.data.items;
    }

    get label(): string {
        return this.data.label;
    }

    set label(label: string) {
        this.data.label = label;
        if (this.html.firstElementChild !== null) {
            this.html.firstElementChild.textContent = label;
        }
        this.id = label;
    }

    get id(): string {
        return this.html.id;
    }

    set id(id: string) {
        id = generateCSSCompatibleString(id);
        getComponent('ScrollNavigation').updateNavigationItem(
            this.id, id, this.label);
        this.html.id = id;
    }

    get collapsed(): boolean {
        return this.data.collapsed;
    }

    set collapsed(collapsed: boolean) {
        this.data.collapsed = collapsed;
    }

    public collapse(): void {
        this.html.classList.add('collapsed');
        this.collapsed = true;
    }

    public expand(): void {
        this.html.classList.remove('collapsed');
        this.collapsed = false;
    }

    public openEditor(): void {
        getComponent('EntityEditor').update(
            this,
            ['editor_category'],
            [
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
                        const group: Group = new Group(this);
                        group.render('EntityEditor');
                    },
                },
                {
                    label: 'button_append_content',
                    onclick: () => {
                        const content: Content = new Content(this);
                        content.render('EntityEditor');
                    }
                },
            ],
            [
                { type: 'short_text', entity: this, target: 'label',
                    label: 'label_label', disabled: false },
                { type: 'checkbox', entity: this, target: 'collapsed',
                    label: 'label_collapsed', disabled: false },
            ]
        );
    }

    public delete(): void {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Category(this.parent).render();
        }
    }
}

class Group extends Entity implements GroupData {
    protected parent: Category;
    protected data: GroupData;
    protected children: TextBlock[] = [];

    constructor(parent: Category,
                data: GroupData|null = null) {
        super('group', create('div'));
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

    public get items(): TextBlockData[] {
        return this.data.items;
    }

    public render(mode: APP.Params['mode'] = 'App'): void {
        this.html.classList.add('pane', 'row');

        if (mode !== 'App') {
            this.html.addEventListener('click', (event: Event): void => {
                this.openEditor();
                event.stopPropagation();
            });
        }
        this.children.forEach((child: TextBlock) => {child.render(mode);});
    }

    public openEditor(): void {
        getComponent('EntityEditor').update(
            this,
            ['editor_group'],
            [
                {
                    label: 'button_new_group_before',
                    onclick: () => {
                        const group: Group = new Group(this.parent);
                        group.moveBefore(this);
                        group.render('EntityEditor');
                    }
                },
                {
                    label: 'button_new_content_before',
                    onclick: () => {
                        const content: Content = new Content(this.parent);
                        content.moveBefore(this);
                        content.render('EntityEditor');
                    }
                },
                {
                    label: 'button_new_group_after',
                    onclick: () => {
                        const group: Group = new Group(this.parent);
                        group.moveAfter(this);
                        group.render('EntityEditor');
                    },
                },
                {
                    label: 'button_new_content_after',
                    onclick: () => {
                        const content: Content = new Content(this.parent);
                        content.moveAfter(this);
                        content.render('EntityEditor');
                    },
                },
                {
                    label: 'button_append_textblock',
                    onclick: () => {
                        const textblock: TextBlock = new TextBlock(this);
                        textblock.render('EntityEditor');
                    },
                },
            ],
            []
        );
    }

    public delete(): void {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Group(this.parent).render();
        }
    }
}

class Content extends Entity implements ContentData {
    protected parent: Category;
    protected data: ContentData;

    constructor(parent: Category,
                data: ContentData|null = null) {
        super('content', create('div'));
        this.parent = parent;

        const textHTML: HTMLElement = create('div');
        this.html.appendChild(textHTML);

        if (data === null) {
            data = {'source': '/empty.md'};
        }
        this.data = data;
        this.moveToInitialPosition();
    }

    public get source(): string {
        return this.data.source;
    }

    public set source(source: string) {
        this.data.source = source;
        this.html.textContent = source;
    }

    public render(mode: APP.Params['mode'] = 'App'): void {
        this.html.classList.add('text');

        if (mode !== 'App') {
            this.html.textContent = this.source;
            this.html.addEventListener('click', (event: Event): void => {
                this.openEditor();
                event.stopPropagation();
            });
        } else {
            CNT.appendContentTo(this.source, this.html)
        }
    }

    public openEditor(): void {
        getComponent('EntityEditor').update(
            this,
            ['editor_content'],
            [
                {
                    label: 'button_new_group_before',
                    onclick: () => {
                        const group: Group = new Group(this.parent);
                        group.moveBefore(this);
                        group.render('EntityEditor');
                    }
                },
                {
                    label: 'button_new_content_before',
                    onclick: () => {
                        const content: Content = new Content(this.parent);
                        content.moveBefore(this);
                        content.render('EntityEditor');
                    }
                },
                {
                    label: 'button_new_group_after',
                    onclick: () => {
                        const group: Group = new Group(this.parent);
                        group.moveAfter(this);
                        group.render('EntityEditor');
                    },
                },
                {
                    label: 'button_new_content_after',
                    onclick: () => {
                        const content: Content = new Content(this.parent);
                        content.moveAfter(this);
                        content.render('EntityEditor');
                    },
                },
            ],
            [
                { type: 'short_text', entity: this, target: 'source',
                    label: 'label_source', disabled: false },
            ]
        );
    }

    public delete(): void {
        super.delete();
        if (!this.parent.hasChildren()) {
            new Content(this.parent).render();
        }
    }
}

class TextBlock extends Entity implements TextBlockData {
    protected parent: Group;
    protected data: TextBlockData;

    constructor(parent: Group,
                data: TextBlockData|null = null) {
        super('textblock', create('button'));
        this.parent = parent;

        if (data === null) {
            data = {
                def: true,
                del: false,
                cat: 'txt',
                label: '',
                text: ''
            }
        }

        this.data = data;
        this.def = data.def;

        this.moveToInitialPosition();
    }

    render(mode: APP.Params['mode'] = 'App'): void {
        this.html.textContent = this.label;
        this.html.classList.add(
            'control', 'control_variable_width', 'item', `item_${this.cat}`);

        if (mode === 'App') {
            this.html.addEventListener('click', (event: Event): void => {
                getComponent('DocumentationEditor').processTextBlock(
                    this.data.text, this.data.del);
                event.stopPropagation();
            });
        } else {
            this.html.addEventListener('click', (event: Event): void => {
                this.openEditor();
                event.stopPropagation();
            });
        }
    }

    get label(): string {
        return this.data.label;
    }

    set label(label: string) {
        this.data.label = label;
        this.html.textContent = label;
    }

    get cat(): string {
        return this.data.cat;
    }

    set cat(cat: string) {
        this.html.classList.remove(`item_${this.cat}`);
        this.html.classList.add(`item_${cat}`);
        this.data.cat = cat;
    }

    get text(): string {
        return this.data.text;
    }

    set text(text: string) {
        this.data.text = text;
    }

    get del(): boolean {
        return this.data.del;
    }

    set del(del: boolean) {
        this.data.del = del;
    }

    get def(): boolean {
        return this.data.def;
    }

    set def(def: boolean) {
        if (def) {
            this.html.classList.remove('item_ext');
            this.html.classList.add('item_def');
        } else {
            this.html.classList.remove('item_def');
            this.html.classList.add('item_ext');
        }
        this.data.def = def;
    }

    public openEditor(): void {
        getComponent('EntityEditor').update(
            this,
            ['editor_textblock'],
            [
                {
                    label: 'button_new_textblock_before',
                    onclick: () => {
                        const textblock: TextBlock = new TextBlock(this.parent);
                        textblock.moveBefore(this);
                        textblock.render('EntityEditor');
                    }
                },
                {
                    label: 'button_new_textblock_after',
                    onclick: () => {
                        const textblock: TextBlock = new TextBlock(this.parent);
                        textblock.moveAfter(this);
                        textblock.render('EntityEditor');
                    },
                },
            ],
            [
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
            ]
        );
    }

    public delete(): void {
        super.delete();
        if (!this.parent.hasChildren()) {
            new TextBlock(this.parent).render();
        }
    }
}

/**
 *
 * UI Components
 *
 */

type Components = ContentEditor | ContentPreview | ContentWindow |
    Dialog | DocumentationEditor |
    EntityCollection | EntityEditor | Header | MainControl |
    ScrollNavigation | SourceList;

type ComponentNames = 'ContentEditor' | 'ContentPreview' | 'ContentWindow' |
    'Dialog' | 'DocumentationEditor' |
    'EntityCollection' | 'EntityEditor' | 'Header'| 'MainControl' |
    'ScrollNavigation' | 'SourceList';

type ComponentType<T> =
    T extends 'ContentEditor' ? ContentEditor :
    T extends 'ContentPreview' ? ContentPreview :
    T extends 'ContentWindow' ? ContentWindow :
    T extends 'Dialog' ? Dialog :
    T extends 'DocumentationEditor' ? DocumentationEditor :
    T extends 'EntityCollection' ? EntityCollection :
    T extends 'EntityEditor' ? EntityEditor :
    T extends 'Header' ? Header :
    T extends 'MainControl' ? MainControl :
    T extends 'ScrollNavigation' ? ScrollNavigation :
    T extends 'SourceList' ? SourceList :
    never;

export type Button = {
    label: string,
    onclick: (event: Event) => void,
    classList?: string[],
}

export type SourceListItem = {
    name: string,
    label: string,
}

type EditableEntities = Collection | Category | Group | Content | TextBlock;

type Field<T extends EditableEntities> = {
    type: 'short_text'|'long_text'|'checkbox'|'options',
    entity: T,
    target: keyof T,
    label: string,
    classList?: string[],
    disabled: boolean,
    options?: string[],
    initialValue?: T[keyof T],
}

export const init = (params: APP.Params): void => {
    initComponent('Header', 'Header');
    initComponent('ContentWindow', 'ContentWindow')
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
                onclick: (): void => {
                    getComponent('Dialog').confirm(
                        'confirmation_clear',
                        (): void => {
                            getComponent('DocumentationEditor').clear();
                        }
                    );
                },
                classList: ['item_pat'],
            },
            {
                label: 'button_copy',
                onclick: (): void => {
                    getComponent('DocumentationEditor').select();
                    document.execCommand('copy');
                    getComponent('Dialog').showInfo('success_copied');
                },
                classList: ['item_ref'],
            },
            {
                label: 'button_change_colour',
                onclick: (): void => {
                    toggleColorMode();
                },
                classList: ['item_txt'],
            },
        ]);
    } else if (params.mode === 'EntityEditor') {
        initComponent('Dialog', 'Dialog');
        initComponent('EntityEditor', 'EntityEditor');
        initComponent('MainControl', 'MainControl');
        initComponent('EntityCollection', 'EntityCollection');
        initComponent('SourceList', 'SourceList');
        initComponent('ScrollNavigation', 'EntityCollection');
        getComponent('MainControl').addButtons([
            {
                label: 'button_save_changes',
                onclick: (): void => {
                    getComponent('Dialog').confirm(
                        'confirmation_save',
                        (): void => {
                            APP.saveCollection();
                        }
                    );
                },
                classList: ['item_ref'],
            },
        ]);
    } else if (params.mode === 'ContentEditor') {
        initComponent('Dialog', 'Dialog');
        initComponent('ContentEditor', 'ContentEditor');
        initComponent('MainControl', 'MainControl');
        initComponent('ContentPreview', 'ContentPreview');
        initComponent('SourceList', 'SourceList');
        getComponent('MainControl').addButtons([
            {
                label: 'button_save_changes',
                onclick: (): void => {
                    getComponent('Dialog').confirm(
                        'confirmation_save',
                        (): void => {
                            APP.saveContent();
                        }
                    );
                },
                classList: ['item_ref'],
            },
            {
                label: 'button_convert',
                onclick: (): void => {
                    getComponent('ContentPreview').update(
                        getComponent('ContentEditor').html
                    );
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

export const initComponent = <T extends ComponentNames>(type: T, id: string): void => {
    if (UI === null) {
        UI = new UserInterface();
    }

    UI.init(type, id);
};

export const getComponent = <T extends ComponentNames>(type: T): ComponentType<T> => {
    if (UI === null) {
        UI = new UserInterface();
    }

    return UI.get(type);
};

type HTMLInputs = HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;

export class UserInterface {
    components: {[name in ComponentNames]?: Components} = {};

    init(type: ComponentNames, id: string): void {
        if (type in this.components) {
            throw Error(`Component "${type}" already initialised`);
        }
        this.components[type] = new Components[type](id);
    }

    get<T extends ComponentNames>(type: T): ComponentType<T> {
        if (!(type in this.components)) {
            throw Error(`Type "${type}" not initialised.`);
        }
        return (this.components[type] as ComponentType<T>);
    }
};

export class ComponentBase {
    public htmlRoot: HTMLElement;
    public htmlContent: HTMLElement;

    constructor(htmlRoot: HTMLElement, htmlContent: HTMLElement) {
        this.htmlRoot = htmlRoot;
        this.htmlContent = htmlContent;
    }
};

export class ModalComponentBase extends ComponentBase {
    protected modal: Modal;

    constructor(id: string) {
        const modal: Modal = new Modal(id);
        super(modal.htmlRoot, modal.htmlContent);
        this.modal = modal;
    }

    protected appendButtonsTo(parent: HTMLElement, buttons: Button[]) {
        buttons.forEach((button: Button): void => {
            const newButton = create('button');
            newButton.textContent = TR.tr(button.label);
            APP.addEventListener('languageloaded', (): void => {
                newButton.textContent = TR.tr(button.label);
            });
            newButton.addEventListener('click', (event: Event): void => {
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

    public show(): void {
        this.modal.show();
    }

    public hide(): void {
        this.modal.hide();
    }
};

export class ContentEditor extends ComponentBase {
    public contentID: string = '';

    constructor(id: string) {
        const editor: HTMLInputs = create('textarea');
        editor.id = id;
        get('Main').appendChild(editor);
        super(editor, editor);
    }

    public clear(): void {
        (this.htmlContent as HTMLInputs).value = '';
    }

    public get md(): string {
        return (this.htmlContent as HTMLInputs).value;
    }

    public get html(): string {
        return CNT.convertContent(this.md);
    }

    public update(contentID: string): void {
        this.contentID = contentID;
        CNT.appendContentTo(contentID, this.htmlContent, true)
        .then((): void => {
            getComponent('ContentPreview').update(this.html);
        });
    }
};

export class ContentPreview extends ComponentBase {
    constructor(id: string) {
        const canvas: HTMLElement = create('div');
        canvas.id = id;
        get('Main').appendChild(canvas);
        super(canvas, canvas);

        this.htmlContent.classList.add('content');
    }

    public update(html: string): void {
        this.htmlContent.innerHTML = html;
    }
};

export class ContentWindow extends ModalComponentBase {

    constructor(id: string = 'ContentWindow') {
        super(id);
    }

    protected clear(): void {
        this.modal.htmlContent.textContent = '';
    }

    public showContent(content: string): void {
        this.clear();

        CNT.appendContentTo(content, this.htmlContent);

        this.show();
    }

    public showString(content: string, variables: {[key: string]: string}): void {
        this.clear();

        this.htmlContent.innerHTML = TR.tr(content, variables);
        CNT.convertLinks(this.htmlContent);

        this.show();
    }
};

export class Dialog extends ModalComponentBase {
    constructor(id: string = 'Dialog') {
        super(id);
    }

    protected clear(): void {
        this.modal.htmlContent.textContent = '';
    }

    public showDialog(content: string, buttons: Button[] = []): void {
        this.clear();

        const text: HTMLElement = create('div');
        text.classList.add('modal_content');
        text.textContent = TR.tr(content);
        APP.addEventListener('languageloaded', (): void => {
            text.textContent = TR.tr(content);
        });
        this.htmlContent.append(text);

        const bar: HTMLElement = create('div');
        bar.classList.add('pane', 'modal_bar', 'modal_bar_bottom');
        if (buttons.length === 0) {
            buttons.push({
                label: 'button_ok',
                onclick: (): void => { this.hide(); },
                classList: ['item_ref'],
            });
        }
        this.appendButtonsTo(bar, buttons);
        this.htmlContent.append(bar);

        this.show();
    }

    public showInfo(content: string) {
        this.showDialog(content);
    }

    public confirm(content: string, onconfirm: () => void,
        oncancel?: () => void) {
        const ok: Button = {
            label: 'button_ok',
            onclick: onconfirm,
            classList: ['item_ref'],
        }
        const cancel: Button = {
            label: 'button_cancel',
            onclick: oncancel ? oncancel : (): void => { this.hide(); },
            classList: ['item_pat'],
        }

        this.showDialog(content, [ok, cancel]);
    }
};

export class DocumentationEditor extends ComponentBase {
    constructor(id: string) {
        const editor: HTMLInputs = create('textarea');
        editor.id = id;
        get('Main').appendChild(editor);
        super(editor, editor);
    }

    public get value(): string {
        return (this.htmlContent as HTMLInputs).value;
    }

    public set value(text: string) {
        (this.htmlContent as HTMLInputs).value = text;
    }

    public clear(): void {
        (this.htmlContent as HTMLInputs).value = '';
    }

    public processTextBlock(text: string, del: boolean) {
        const index = this.value.indexOf(text);
        const [start, end] = [
            (this.htmlContent as HTMLTextAreaElement).selectionStart,
            (this.htmlContent as HTMLTextAreaElement).selectionEnd
        ];
        this.htmlContent.focus();
        if (del && index > -1) {
            this.value = this.value.replace(text, '');
            if (index < start) {
                (this.htmlContent as HTMLTextAreaElement).selectionStart = start - text.length;
                (this.htmlContent as HTMLTextAreaElement).selectionEnd = end - text.length;
            } else {
                (this.htmlContent as HTMLTextAreaElement).selectionStart = start;
                (this.htmlContent as HTMLTextAreaElement).selectionEnd = end;
            }
        } else {
            (this.htmlContent as HTMLTextAreaElement).setRangeText(text, end, end, 'select');
            (this.htmlContent as HTMLTextAreaElement).selectionStart = 
                (this.htmlContent as HTMLTextAreaElement).selectionEnd;
        }
    }

    public select(): void {
        (this.htmlContent as HTMLTextAreaElement).focus();
        (this.htmlContent as HTMLTextAreaElement).select();
    }
};

export class EntityCollection extends ComponentBase {
    public data: CollectionData = { name: '', label: '', items: [] };

    constructor(id: string) {
        const canvas: HTMLElement = create('div');
        canvas.id = id;
        get('Main').appendChild(canvas);
        super(canvas, canvas);
    }

    public clear(): void {
        this.htmlContent.textContent = '';
    }

    public update(data: CollectionData, mode: APP.Params['mode']) {
        this.clear();
        getComponent('ScrollNavigation').clear();
        this.data = data;
        const collection: Collection = new Collection(data, this.htmlContent);
        collection.render(mode);
    }
};

export class EntityEditor extends ModalComponentBase {
    constructor(id: string = 'EntityEditor') {
        super(id);
    }

    protected clear(): void {
        this.modal.htmlContent.textContent = '';
    }

    public update<T extends EditableEntities>(entity: T,
                                              classList: string[],
                                              buttons: Button[],
                                              fields: Field<T>[]): void {
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
                getComponent('Dialog').confirm(
                    `confirmation_delete_${entity.entityType}`,
                    (): void => {
                        entity.delete();
                        this.modal.hide();
                    }
                );
            },
        });

        this.appendButtonsTo(toolbar, buttons);

        const form = create('div');
        form.classList.add('modal_content');
        editor.appendChild(form);

        fields.forEach((field): void => {
            const group: HTMLElement = create('div');
            group.classList.add('pane', 'editor_row')
            if ('classList' in field && field.classList !== undefined) {
                group.classList.add(...field.classList);
            }
            form.appendChild(group);
            const id = generateRandomID();
            const label: HTMLLabelElement = create('label');
            label.textContent = TR.tr(field.label);
            APP.addEventListener('languageloaded', (): void => {
                label.textContent =  TR.tr(field.label);
            });
            label.classList.add('label');
            label.htmlFor = id;
            group.appendChild(label);
            const input: HTMLInputs = this.input(field);
            input.disabled = field.disabled;
            input.id = id;
            input.classList.add('control');
            group.appendChild(input);
        });

        const bottom_bar = create('div');
        bottom_bar.classList.add('pane', 'modal_bar', 'modal_bar_bottom');
        editor.appendChild(bottom_bar);

        const ok: Button = {
            label: 'button_ok',
            onclick: (): void => { this.modal.hide(); },
            classList: ['item_ref'],
        }
        const cancel: Button = {
            label: 'button_cancel',
            onclick: (): void => {
                this.modal.hide();
                fields.forEach((field: Field<T>): void => {
                    field.entity[field.target] = field.initialValue!;
                });
            },
            classList: ['item_pat'],
        }

        this.appendButtonsTo(bottom_bar, [ok, cancel]);

        this.htmlContent.appendChild(editor);
        this.show();
    };

    protected input<T extends EditableEntities>(field: Field<T>): HTMLInputs {
        field.initialValue = field.entity[field.target];
        if (field.type === 'short_text') {
            const input: HTMLInputElement = create('input');
            input.value =
                (field.entity[field.target] as string).replace(/\n/g, '\\n');
            input.addEventListener('keydown', (event: KeyboardEvent): void => {
                if (event.defaultPrevented) {
                    return;
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
            });
            input.oninput = (): void => {
                (field.entity[field.target] as string) =
                    input.value.replace(/\\n/g, '\n');
            };
            return input;
        } else if (field.type === 'long_text') {
            const input: HTMLTextAreaElement = create('textarea');
            input.value = (field.entity[field.target] as string);
            input.addEventListener('input', (): void => {
                (field.entity[field.target] as string) = input.value;
            });
            return input;
        } else if (field.type === 'options') {
            const input: HTMLSelectElement = create('select');
            input.value =  (field.entity[field.target] as string);
            input.onchange = (): void => {
                (field.entity[field.target] as string) = input.value;
            };
            if (field.options !== undefined) {
                for (let option of field.options) {
                    const optionElement: HTMLOptionElement = create('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    if (option=== field.entity[field.target]) {
                        optionElement.selected = true;
                    }
                    input.appendChild(optionElement);
                }
            }
            return input;
        } else if (field.type === 'checkbox') {
            const input: HTMLInputElement = create('input');
            input.type = 'checkbox';
            input.checked = (field.entity[field.target] as boolean);
            input.oninput = (): void => {
                (field.entity[field.target] as boolean) = input.checked;
            };
            return input;
        }
        throw Error(`Invalid field type "${field.type}"`);
    };
};

export class Header extends ComponentBase {
    protected htmlSourceIndicator: HTMLElement = create('div');
    protected htmlTitle: HTMLElement;
    protected htmlSubtitle: HTMLElement;
    protected htmlAboutButton: HTMLElement;

    constructor(id: string) {
        const header: HTMLElement = create('header');
        header.id = id;
        get('Main').appendChild(header);
        super(header, header);

        const group: HTMLElement = create('span');
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
            getComponent('ContentWindow').showString('page_about', {'version': VERSION});
        });
        header.appendChild(this.htmlAboutButton);

        APP.addEventListener('languageloaded', (): void => {
            this.htmlTitle.textContent = TR.tr('app_title');
            this.htmlSubtitle.textContent = TR.tr('app_subtitle');
            this.htmlAboutButton.textContent = TR.tr('button_about');
        });
    }

    public updateSourceIndicator(label: string) {
        this.htmlSourceIndicator.textContent = label;
    }
};

export class MainControl extends ComponentBase {
    constructor(id: string) {
        const canvas: HTMLElement = create('div');
        canvas.id = id;
        canvas.classList.add('pane');
        get('Main').appendChild(canvas);
        super(canvas, canvas);
    }

    public clear(): void {
        this.htmlContent.textContent = '';
    }

    public update(buttons: Button[]): void {
        this.clear();
        this.addButtons(buttons);
    }

    public addButtons(buttons: Button[]): void {
        buttons.forEach((button: Button): void => {
            this.addButton(button);
        });
    }

    public addButton(button: Button): void {
        const newButton = create('button');
        newButton.textContent = TR.tr(button.label);
        APP.addEventListener('languageloaded', (): void => {
            newButton.textContent = TR.tr(button.label);
        });
        newButton.addEventListener('click', (event: Event) => {
            button.onclick(event);
            event.stopPropagation();
        });
        newButton.classList.add('control');
        if ('classList' in button && button.classList !== undefined) {
            newButton.classList.add(...button.classList);
        }
        this.htmlContent.appendChild(newButton);
    }
};

export class ScrollNavigation extends ModalComponentBase{
    protected scrollposition: number|null = null;
    protected target: HTMLElement;
    public items: {[id: string]: HTMLAnchorElement} = {};

    constructor(targetID: string) {
        super('ScrollNavigation');
        this.target = get(targetID);
        this.target.addEventListener('scroll', (): void => {
            this.eventHandler();
        });
        this.scrollposition = this.target.scrollTop;
        this.hide();
    }

    public clear(): void {
        this.htmlContent.textContent = '';
        this.items = {};
    }

    public eventHandler(): void {
        const currentPosition: number = this.target.scrollTop;
        if (this.scrollposition !== null &&
            Math.abs(this.scrollposition - currentPosition) > 650) {
            this.scrollposition = null;
            this.show();
            setTimeout((): void => {
                this.scrollposition = this.target.scrollTop;
            }, 1000);
        }
        setTimeout((): void => {
            if (this.scrollposition === null) {
                return;
            }
            this.scrollposition = this.target.scrollTop;
        }, 250);
    }

    public addNavigationItem(id: string, label: string): void {
        if (id in this.items) {
            throw Error(`Item with id "${id}" already exists.`);
        }

        this.items[id] = create('a');
        this.items[id].textContent = label;
        this.items[id].href = `#${id}`;
        this.items[id].classList.add('control', 'item', 'item_def');
        const item = this.items[id];
        this.items[id].addEventListener('click', (event: Event): void => {
            this.scrollposition = null;
            this.hide();
            get(item.getAttribute("href")!.substring(1)).scrollIntoView(
                { block: 'start', behavior: 'instant' });
            this.scrollposition = this.target.scrollTop;
            event.preventDefault();
        });
        this.htmlContent.appendChild(this.items[id]);
    }

    public updateNavigationItem(id: string, newId: string,
                                newLabel: string): void {
        if ((!(id in this.items)) || id === newId) {
            return;
        }

        this.items[newId] = this.items[id];
        delete this.items[id];
        this.items[newId].textContent = newLabel;
        this.items[newId].href = `#${newId}`;
    }

    public set enabled(enabled) {
        this.scrollposition = enabled ? this.target.scrollTop : null;
    }

    public get enabled(): boolean {
        return this.scrollposition !== null ? true : false;
    }
};

export class SourceList extends ModalComponentBase {
    public items: {[id: string]: HTMLAnchorElement} = {};

    constructor(id: string = 'SourceList') {
        super(id);
    }

    public clear(): void {
        this.htmlContent.textContent = '';
    }

    public addSourceItem(name: string, label: string,
                         onclick: (event: Event) => void): void {
        if (name in this.items) {
            throw Error(`Item with name "${name}" already exists.`);
        }

        this.items[name] = create('a');
        this.items[name].textContent = label;
        this.items[name].classList.add('control', 'item', 'item_def');
        this.items[name].addEventListener('click', (event: Event): void => {
            onclick(event);
            this.hide();
            event.stopPropagation();
        });
        this.htmlContent.appendChild(this.items[name]);
    }
};

let UI: UserInterface|null = null;

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

/**
 * A modal.
 */
export class Modal extends ComponentBase {
    constructor(id: string) {
        super(create('div'), create('div'));
        this.htmlRoot.id = `${id}Background`;
        this.htmlRoot.classList.add('modal_background');
        this.htmlContent.id = id;
        this.htmlContent.classList.add('modal_canvas');
        this.htmlRoot.appendChild(this.htmlContent);
        document.body.appendChild(this.htmlRoot);

        this.htmlRoot.addEventListener('click', (): void  => {this.hide()});
        this.htmlContent.addEventListener('click', (event: Event): void =>
                                    {event.stopPropagation()});
        this.hide();
    };

    public activateOn(id: string): void {
        get(id).addEventListener('click', this.show);
    };

    public show(): void {
        this.htmlRoot.style.display = 'flex';
    };

    public hide(): void {
        this.htmlRoot.style.display = 'none';
    };
};

/**
 *
 * Dark mode / light mode / no highlight
 *
 */

let COLORSTATE: number = 0;

export const toggleColorMode = (): void => {
    const html = document.documentElement;
    if (COLORSTATE === 0) {
        html.classList.add('item_color');
        COLORSTATE = 1;
    } else if (COLORSTATE === 1) {
        html.classList.add('item_border', 'dark_mode');
        COLORSTATE = 2;
    } else if (COLORSTATE === 2) {
        html.classList.remove('item_color', 'item_border', 'dark_mode');
        COLORSTATE = 0;
    }
};


/**
 *
 * Small functions for interacting with the DOM tree.
 *
 */

export const get = (id: string): HTMLElement => {
    const element: HTMLElement|null = document.getElementById(id);
    if (element === null) {
        throw new Error(`Could not find element with id "${id}"`);
    }
    return element;
};

export const apply = (selector: string, fn: (element: Element) => void) => {
    document.querySelectorAll(selector).forEach(fn);
};

export const create = <K extends keyof HTMLElementTagNameMap>(tagName: K):
    HTMLElementTagNameMap[K] => {
    return document.createElement(tagName);
}

export const generateCSSCompatibleString = (string: string): string => {
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

export const generateRandomID = (length: number = 6): string => {
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
