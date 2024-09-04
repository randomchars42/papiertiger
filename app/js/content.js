import * as APP from './app.js';
import * as UI from './ui.js';
let MD;
export const init = (params) => {
    if (params.mode === 'ContentEditor') {
        import('../external/markdown-it.min.js')
            .then(() => {
            MD = markdownit();
        });
    }
};
export const loadContent = async (content, fetchSource = false) => {
    return APP.load(getAddress(content, fetchSource), 'string')
        .then((data) => {
        console.log('Content fetched');
        return Promise.resolve(data);
    });
};
export const getAddress = (contentID, fetchSource) => {
    if (contentID.substring(0, 1) !== '/') {
        console.error(`Not a root-relative address (${contentID})`);
        contentID = '/page/error.html';
    }
    contentID = contentID.substring(1);
    if (!fetchSource) {
        return `./content/${contentID.replace(/md$/, 'html')}`;
    }
    let address = contentID.replace(/html$/, 'md');
    if (contentID.substring(0, 4) === 'docs') {
        address = `./pages/${contentID}`;
    }
    else {
        address = `./content/${contentID}`;
    }
    return address;
};
export const convertLinks = (target, prefix = '') => {
    target.querySelectorAll('a').forEach((element) => {
        const anchor = element;
        anchor.onclick = (event) => {
            UI.getComponent('ContentWindow').showContent(`${prefix}/${anchor.getAttribute('href')}`);
            event.preventDefault();
            event.stopPropagation();
        };
    });
};
export const appendContentTo = async (content, target, fetchSource = false) => {
    return loadContent(content, fetchSource)
        .then((content) => {
        if (!fetchSource) {
            target.innerHTML = content;
            convertLinks(target);
        }
        else {
            target.textContent = content;
        }
        return Promise.resolve(content);
    });
};
export const convertContent = (content) => {
    if (MD === null) {
        console.error('Failed to load markdown-it');
    }
    return MD.render(content);
};
