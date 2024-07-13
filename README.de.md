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

* fügt eine `CSS`-Klasse hinzu (`.item_XXX`, z.B.: `.item_cap`)
* `cap`tion: der Text dieser Schaltfläche erscheint fett
* `txt`: kein spezielles Markup
* `ref`: diese Schaltfläche wird als Referenzwert oder positiv markiert (grün)
* `pat`: diese Schaltfläche wird als pathologisch oder negativ markiert (rot)
* `int`: diese Schaltfläche wird als Intervention markiert
* `res`: diese Schaltfläche wird als das Resultat einer Intervention markiert

**label**:

Der Text auf der Schaltfläche.

**text**:

Der Text, der der Dokumentation hinzugefügt wird.

### Einen neuen Eintrag in `/data/list.json` anlegen:

```json
{
    "list": [
        {
            "name": "DATEINAME_OHNE_SUFFIX",
            "label": "Schöne Bezeichnung, die der Nutzer sieht"
        },
        ...
    ]
}

```

## Eine neue Oberflächensprache hinzufügen:

Dies ist aktuell möglich, aber noch nicht elegant gelöst:

### Füge eine neue Datei unter `/lang` hinzu:

Füge eine neue Übersetzungsdatei (`JSON`) unter `/lang` ein. Als Name muss der
entsprechende Sprache-Code gewähnt werden (zwei Kleinbuchstaben), z.B. `en.json`.

**Struktur:**

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

Man kann multiple Regionen pro Sprache hinzufügen. Wenn die eingestellte Region
nicht gefunden werden kann, wird die erste verfügbare Region gewählt.

### Die Sprache einstellen:

Aktuell kann der Benutzer die Sprache nicht selbst einstellen.

In `/ts/app.ts`:

```ts
const run = (): void => {
    UI.init();
    # hiermit wird die Sprache eingestellt
    TR.initLanguage('de-DE');
    loadDataList();
};
```

Wenn die App als `Progressive Web App` genutzt werden soll, muss in
`/ts/sw.ts` die neue Übersetzungsdatei hinzugefügt werden, damit diese in den
Cache aufgenommen wird:

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
