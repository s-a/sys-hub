# sys-hub


```bash
$ npm i -g sys-hub;
```

a command line app to share commands with co-workers across the network.


## Local configuration example
```javascript
{
    "globalConfigurationFilename": "/path/to/global/config.js",
    "Client-No-1" : {
        "development" : {
            "tail latest logfile" : {
                "command" : "tail-latest-file",
                "args" : ["/path/to/log/folder/on/local/machine"]
            }
        }
    }
}
```

## Global configuration example
```javascript
{
    "globalConfigurationFilename": "/path/to/global/config.js",
    "Client-No-1" : {
        "staging" : {
            "tail latest logfile" : {
                "command" : "tail-latest-file",
                "args" : ["/path/to/log/folder/on/staging/machine"]
            }
        },
        "production" : {
            "tail latest logfile" : {
                "command" : "tail-latest-file",
                "args" : ["/path/to/log/folder/on/production/machine"]
            }
        }
    }
}
```

## Supported commands
 - "open" (path or url to document)
 - "open-latest-file" (path to file folder)
 - "tail-latest-file" (path to file folder)
 - "shell" (custom shell command)