# PAPIERTIGER - DOKUMENTATIONSHELFER

Baukasten für ([notfall-] medizinische) Dokumentation.

[https://www.knopfdruckmassage.de/apps/site/media/images/papiertiger_short.gif]

## Dependencies

* **keine**: es werden keine Libraries / Frameworks o.ä. eingebunden

## Building

```bash
# einfacher Python-Server (0.0.0.0:8000) zum Testen
make serve

# beobachtet `./ts/` und übersetzt geänderte TypeScript-Dateien in
# Javascript (`./js/`)
make transpile
```

## Toolchain

* (`Python3`) -> Testserver
* `tsc` -> TypeScript compiler
* (`Apache2`) -> Server mit Headern via `.htaccess`
*  (`PHP`) -> falls zunächst einmal `csp_report.php` genutzt werden soll

## Hosting

* funktioniert auf jedem einfachen Webserver
* für die WebApp-Funktionalität werden je nach Browser diverse
  Sicherheitsmerkmale als `Header` benötigt, diese sind momentan in
  der `.htaccess` definiert und benötigen somit einen 'Apache2'-server
* um den csp-report endpoint zu bedienen ist hier optional
  `/csp_report.php` enthalten; eingehende csp violation reports werden
  in `/report` abgelegt; wird die Datei > 2 MB werden alle Einträge vor
  dem Aktuellen gelöscht
