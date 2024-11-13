import * as APP from './app.js';
import * as UI from './ui.js';

let MD: any|null;

export const init = (params: APP.Params): void => {
    if (params.mode === 'ContentEditor') {
        // @ts-ignore
        import('../external/markdown-it.min.js')
        .then((): void => {
            // @ts-ignore
            MD = markdownit();
        });
    }
};

export const loadContent = async (content: string,
                            fetchSource: boolean = false): Promise<string> => {
    return APP.load(getAddress(content, fetchSource), 'string')
    .then((data: string) => {
        console.log('Content fetched');
        return Promise.resolve(data);
    });
};

export const getAddress = (contentID: string, fetchSource: boolean): string => {
    // `contentID` should be the address for one of the following three types of
    // content:
    // * general content (e.g., `/sop1.html` or `/sops/sop2.html`):
    //   * source in `./content/`
    //   * page in `./content/`
    // * page content (e.g. an "about" page `/page/about.html`):
    //   * source in `./content/page/`
    //   * page in `./content/page/`
    // * documentation (e.g., `/docs/README.html`):
    //   * source in `./pages/docs/`
    //   * page in `./content/docs/`

    // trim "." and "/" from the left end of the content identifier
    //contentID = contentID.replace(/^[\.\/]*/, '');

    // make sure ALL addresses are root-relative (begin with "/")
    if (contentID.substring(0, 1) !== '/') {
        console.error(`Not a root-relative address (${contentID})`);
        contentID = '/page/error.html';
    }

    contentID = contentID.substring(1);

    if (!fetchSource) {
        // all generated pages are located under `./content`
        return `./content/${contentID.replace(/md$/, 'html')}`;
    }

    // source pages are suffixed with ".md"
    let address: string = contentID.replace(/html$/, 'md');

    // documentation source pages are located elsewhere
    if (contentID.substring(0, 4) === 'docs') {
        address = `./pages/${contentID}`;
    } else {
        address = `./content/${contentID}`;
    }

    return address;
};

export const convertLinks = (target: HTMLElement, prefix: string = '') => {
    target.querySelectorAll('a').forEach((element: Element): void => {
        const anchor: HTMLAnchorElement = (element as HTMLAnchorElement);
        anchor.onclick = (event: Event): void => {
            UI.getComponent('ContentWindow').showContent(
                `${prefix}/${anchor.getAttribute('href')!}`);
            event.preventDefault();
            event.stopPropagation();
        };
    });
};

export const appendContentTo = async (content: string, target: HTMLElement,
                                fetchSource: boolean = false): Promise<string> => {

    return loadContent(content, fetchSource)
    .then((content: string) => {
        if (!fetchSource) {
            target.innerHTML = content;
            convertLinks(target);
        } else {
            target.textContent = content;
        }
        return Promise.resolve(content);
    })
};

export const convertContent = (content: string): string => {
    if (MD === null) {
        console.error('Failed to load markdown-it');
    }
    return MD.render(content);
};
