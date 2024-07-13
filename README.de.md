# PAPIERTIGER - DOKUMENTATIONSHELFER

[🇬🇧](README.md)

Baukasten für ([notfall-] medizinische) Dokumentation. Setze Dokumentation durch
Auswahl vordefinierter Phrasen zusammen!

Der Text / die Daten bleiben in Deinem Browser, nichts wird ins Internet
geschickt.

Dokumentationsbausteine können in einer oder mehrerer `JSON`-Dateien
konfiguriert werden.

Die Oberfläche kann, falls notwendig, ebenfalls mit Hilfe einer einfachen
`JSON`-Datei übersetzt werden.

![PAPIERTIGER - DOKUMENTATIONSHELFER, Demo](https://www.knopfdruckmassage.de/apps/site/media/images/papiertiger_short.gif)

## Demo

[PAPIERTIGER - DOKUMENTATIONSHELFER, Demo](https://www.knopfdruckmassage.de/apps/papiertiger_rd/)

## Dependencies

* **keine**: es werden keine Libraries / Frameworks o.ä. eingebunden

## Building

```bash
# einfacher Python-Server (0.0.0.0:8000) zum Testen
make serve


# startet `tsc`
# beobachtet `./ts/` und übersetzt geänderte TypeScript-Dateien in
# Javascript (`./js/`)
make transpile
```

## Toolchain

* `tsc` -> TypeScript compiler

Optional:
* `Python3` -> Testserver
* `Apache2` -> Server mit Headern via `.htaccess`
* `PHP` -> falls zunächst einmal `csp_report.php` genutzt werden soll

## Hosting

* funktioniert auf jedem einfachen Webserver
* für die WebApp-Funktionalität werden je nach Browser diverse
  Sicherheitsmerkmale als `Header` benötigt, diese sind momentan in
  der `.htaccess` definiert und benötigen somit einen 'Apache2'-server
* um den csp-report endpoint zu bedienen ist hier optional
  `/csp_report.php` enthalten; eingehende `csp violation reports` werden
  in `/report` abgelegt; wächst die Datei auf > 2 MB, werden alle Einträge vor
  dem aktuellen Eintrag gelöscht

## Hinzufügen neuer Textbausteine

### Eine neue `JSON`-Datei unter `/data/` anlegen:

**Struktur:**

```json
[{
    "label": "Überschrift",
    "items": [
        [
            {"type": "def", "del": 0, "cat": "cap", "label": "Punkt 1: ", "text": "\nPunkt 1: "},
            {"type": "def", "del": 0, "cat": "txt", "label": "Item 1", "text": "Text; "},
            {"type": "def", "del": 0, "cat": "ref", "label": "Item 2", "text": "noch mehr Text; "},
            {"type": "ext", "del": 0, "cat": "pat", "label": "Item 3", "text": "selten genutzter Text; "}
            ...
        ],
        [
            {"type": "def", "del": 1, "cat": "cap", "label": "Punkt 2:", "text": "\nPunkt 2:"},
            {"type": "def", "del": 1, "cat": "txt", "label": "usw.", "text": "und so weiter; "},
            ...
        ]
    ]
},
...
]
```

**type**:

* `def`ault: Schaltfläche ist immer sichtbar
* `ext`ended: Schaltfläche ist nur in der erweiterten Ansicht sichtbar

**del**:

* `0`: dieser Textbaustein kann an mehreren Stellen auftauchen
* `1`: wird die Schaltfläche ein zweites Mal gedrückt, wird der Text aus der
  Dokumentation gelöscht (**Achtung**: es wird das erste Vorkommen des Texts gelöscht!)

**cat**:

* adds `CSS` classes for markup
* `cap`tion:  text of the button will be printed fat
* `txt`: no specia markup
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

### Add a new language file under `/lang`

Add a new language file (`JSON`) under `/lang` and name it using the
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

### Setting the language

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
