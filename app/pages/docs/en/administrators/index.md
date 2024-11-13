# Setup

## General idea

`PAPIERTIGER` is a web site / progressive web app that lets the user build documentation using textblocks (`Entity`s).

It is intentionally very simple and lean (basically `HTML` + `CSS` + `JavaScript` + `JSON`), stores al content in human readable / editable form (`JSON`, `Markdown`) and makes use of as little other technologies as possible.

`Entity`s are organised in `Collection`s. Each `Collection` is stored in its own `json` file under `/app/data` (see [here](/docs/content-creators/index.md) for more information).

The format of those `json` files is human friendly and can be edited directly by a [content creator](/docs/content-creators/index.md) with access to the files (e.g. via `FTP`).

Optionally, there is an editor built into `PAPIERTIGER` (append `?mode=EntityEditor`).

Additionally, `Content` can provide hints or SOPs to the user.

`Content` is written in (Markdown)[https://spec.commonmark.org/] and translated into `HTML`, so there are two files per `Content` under `/app/content`. Documentation is organised slightly differently as discussed [later](#docs).

Again, files can be edited directly by a [content creator](/docs/content-creators/index.md) with access to the files but it needs to be converted to `HTML`, ideally using the same converter as is used for generating documentation ([markdown-it](https://github.com/markdown-it/markdown-it)).

There's an optional editor (append `?mode=ContentEditor`) which will convert the markdown automatically.

## Prerequisites

* a simple `HTTP server`: sufficient for basic usage, i.e., use the interface to build documentation using textblocks

### Optional prerequisites

* `PHP > 8.0.0`: necessary for using the built in editor for editing `Content` or `Entity`s.
* `Apache2`: in order to use the preconfigured `/app/.htaccess` / `/app/.htpasswd` files

### Development

* `Make`, `Git`, `awk`, `Bash`: This project contains a `Makefile` to ease some develeopment steps
* `Python3`: to start a simple server for testing just call `make serve` (server functionality, i.e. the `/app/save_data.php` script cannot be tested this way)
* `tsc`: the `TypeScript` converter, can be started using `make transpile`

## Setup

* clone this project (`git clone git@github.com/randomchars42/papiertiger.git`) or download a (release)[https://github.com/randomchars42/papiertiger/releases]
* copy all files under `/app` onto your server
* **DONE**

### Use as a Progressive Web App (PWA)

`PAPIERTIGER` can be used as a `PWA` under `Chrome` / `Chromium` / `Edge` or related browsers. This requires some headers regarding `content security policy` (`CSP`) to be set.

An example configuration is provided in `/app/.htaccess`. Just fill it in or have a look at it if you want to configure a different server.

### Restricting access to the editor

`PAPIERTIGER` does not have any login functionality, i.e. the editors can be access by everybody. In its default configuration on an `Apache2` server the endpoint for saving is protected by `HTML` authentication, meaning changes made using the editor can only be stored after authenticating as a known user.

To add / edit users have a look at `/app/.htpasswd`.

## Development


## Docs

