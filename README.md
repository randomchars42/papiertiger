# PAPIERTIGER - DOCUMENTATION TOOL

[🇩🇪](README.de.md)

Tool to "point & click" your documentation, especially on touch devices.

The data / text won't leave your browser - the magic happens locally.

Phrases to choose from can be configured in a single or multiple `JSON` files.

The interface can also be translated via a simple `JSON` file.

![PAPIERTIGER - DOKUMENTATIONSHELFER, Demo](https://www.knopfdruckmassage.de/apps/site/media/images/papiertiger_short.gif)

## Demo

[PAPIERTIGER - DOKUMENTATIONSHELFER, Demo](https://www.knopfdruckmassage.de/apps/papiertiger_rd/)

## Dependencies

* **none**: no libraries are used - only plain `HTML` + `TypeScript` + `JSON`

## Building

```bash
# simple Python server for testing purposes (0.0.0.0:8000)
make serve


# transpiler for TypeScript (tsc)
# watches ./ts/ and transpiles TypeScript to Javascript in ./js/
make transpile
```

## Toolchain

* `tsc` -> TypeScript compiler

Optional:
* `Python3` -> server for testing
* `Apache2` -> use headers defined in `.htaccess` if necessary for your
  deployment
* `PHP` -> in case you want to use the very basic CSP endpoint (`csp_report.php`)

## Hosting

* runs on every basic web server no `npm`, `php` or anything required for basic
  usage
* some browsers will require `Content Security Policy headers` to be set for use
  as `Progressive Web App` those might be defined in `/.htaccess`
  if you are on an Apache2` server
* to offer an csp-report endpoint an optional
  `/csp_report.php` can be found in the repository;
  incoming `csp violation reports` will be written to a plain text
  file (`/report`) ; the file will be truncated when growing to > 2 MB

## Adding a new collection of phrases

### Add a new `JSON` file under `/data/`:

**Structure:**

```json
[{
    "label": "Heading",
    "items": [
        [
            {"type": "def", "del": 0, "cat": "cap", "label": "First: ", "text": "\nFirst: "},
            {"type": "def", "del": 0, "cat": "txt", "label": "item 1", "text": "some text; "},
            {"type": "def", "del": 0, "cat": "ref", "label": "item 2", "text": "some other text; "},
            {"type": "ext", "del": 0, "cat": "pat", "label": "item 3", "text": "rarely needed phrase; "}
            ...
        ],
        [
            {"type": "def", "del": 1, "cat": "cap", "label": "Second:", "text": "\nSecond:"},
            {"type": "def", "del": 1, "cat": "txt", "label": "item 4", "text": "and so forth; "},
            ...
        ]
    ]
},
...
]
```

**type**:

* `def`ault: button for item is always visible
* `ext`ended: button for item is only visible in extended mode

**del**:

* `0`: the item can be used multiple times
* `1`: clicking on the item a second time removes the item from the text

**cat**:

* adds `CSS` classes for markup (`.item_XXX`, e.g., `.item_cap`)
* `cap`tion:  text of the button will be printed fat
* `txt`: no special markup
* `ref`: text will be highlighted as reference or positive (green)
* `pat`: text will be highlighted as pathological or negative (red)
* `int`: text will be highlighted as intervention
* `res`: text will be highlighted as the result of an intervention

**label**:

Label as it will appear on the button.

**text**:

Text that will be added to the documentation once the button is pressed

### Add an entry in entry in `/data/list.json`:

```json
{
    "list": [
        {
            "name": "FILE_NAME_WITHOUT_SUFFIX",
            "label": "Pretty label for the user to see"
        },
        ...
    ]
}

```

## Adding a new interface language

This is currently supported but not elegantly solved:

### Add a new language file under `/lang/`:

Add a new language file (`JSON`) under `/lang/` and name it using the
proper language code (lower case, two letters), e.g., `en.json`.

**Structure:**

```JSON
{
    "lang": "en",
    "region": [{
        "region": "en-GB",
        "dict": {
            "page_title": "PAPIERTIGER - DOCUMENTATION made easy",
            "page_noscript": "In order to use this app javacript needs to be enabled.",
            "page_about": "PAPIERTIGER\nDOCUMENTATION\n\nCopyright 2024, Eike Kühn\nApache License 2.0",
            "app_title": "PAPIERTIGER",
            "app_subtitle": "DOCUMENTATION",
            "control_about": "?",
            "control_copy": "⎘",
            "control_copied": "☑",
            "control_clear": "⌧",
            "control_newline": "↵",
            "control_change_colour": "🔾",
            "control_show_extended": "☶",
            "confirmation_clear": "Do you really want to delete the text?"
        }
    }
    ]
}
```

You may define multiple regions per language. If the requested region can't be
found the first available region will be used.

### Setting the language:

Currently, there is no way for the user to choose the language.

You have to edit `/ts/app.ts` and set your language:

```ts
const run = (): void => {
    UI.init();
    # set your language here
    TR.initLanguage('de-DE');
    loadDataList();
};
```

If you intend to use this app as a `Progressive Web App` edit
`/ts/sw.ts` and add your language file for offline caching:

```ts
const APP_STATIC_RESOURCES = [
    "../index.html",
    "../style.css",
    "../js/app.js",
    "../js/ui.js",
    "../js/translate.js",
    "../js/constants.js",
    "../icon.svg",
    "../manifest.json",
    "../data/list.json",
    "../data/rd.json",
    "../data/zna.json",
    "../lang/de.json",
    "../lang/en.json",
];
```
