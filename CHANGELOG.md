# CHANGELOG for v3.0.0

## User experience

* add simple editor for text blocks
* allow information / texts to be embedded
* add simple editor for information / texts
* improve translations
* support more favicons

## Technical

* adapt structure of data (`Item`: `"del": number -> "del": boolean`)
* adapt structure of data to allow texts (`Category` may have `ItemRow` or `Text` as children)
* change `es` target
* completely restructure project
* improve variable naming
* add script for versioning
* print version string in multiple locations
* add transpiled `js` for easier deployment
* enable variables in translation strings
* improve server error handling and client <-> server communication
* remove global `CONTENT`, fix feedback on copy / save success
* add some protection for the backend via `.htaccess` / `.htpasswd`
* add simple php backend for writing changes to file
* add option to append item to row / row to collection / collection to collections
* allow editor elements to be set to read-only
* texts can now be incorporated if .md + .html in `app/texts/`
* remove PWA feature from editor
* move `About` from `alert` string to `TextModal`

## Fixes

* harden logic for scrollmenu

## To Do:

* improve documentation
