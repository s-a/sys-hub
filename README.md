# sys-hub
[![NPM Version](http://img.shields.io/npm/v/sys-hub.svg)](https://www.npmjs.org/package/sys-hub)
[![Build Status](https://travis-ci.org/s-a/sys-hub.svg)](https://travis-ci.org/s-a/sys-hub)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/c49184297eae46b19b401c598e433784)](https://www.codacy.com/app/stephanahlf/sys-hub)
[![Dependency Status](https://david-dm.org/s-a/sys-hub.svg)](https://david-dm.org/s-a/sys-hub)
[![devDependency Status](https://david-dm.org/s-a/sys-hub/dev-status.svg)](https://david-dm.org/s-a/sys-hub#info=devDependencies)
[![NPM Downloads](https://img.shields.io/npm/dm/sys-hub.svg)](https://www.npmjs.org/package/sys-hub)
[![Massachusetts Institute of Technology (MIT)](https://s-a.github.io/license/img/mit.svg)](/LICENSE.md#mit)
[![Donate](http://s-a.github.io/donate/donate.svg)](http://s-a.github.io/donate/)


```bash
$ npm i -g sys-hub;
```

a command line app to share commands with co-workers across the network.



## [Local configuration example](example.config.json)

### argumentDatasource
For JSON selector syntax see http://jsonselect.org/. The ```filename``` attribute supports XML and JSON datasources.

## [Global configuration example](/example.global-config.json)


## Supported commands
 - "open" (path or url to document)
 - "open-latest-file" (path to file folder)
 - "tail-latest-file" (path to file folder)
 - "type-latest-file" (path to file folder)
 - "shell" (custom shell command)

## Supported types
 - "folder" (adds a bundle of commands for given folder)
 - "file" (adds a bundle of commands for given file)


## local config
This defines a default program to open a folder or file in a custom filemanager

```javascript
    "shell": {
        "openFolderCommand": "c:\\totalcmd\\TOTALCMD.EXE /O /T /R=\"@dir@\""
    },
```
 