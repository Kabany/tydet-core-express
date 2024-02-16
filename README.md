# TyDeT Core Express
> TyDeT Core Express is a Typescript & Javascript library for TyDeT Core to handle HTTP requests using Express JS.

TyDeT (Typescript Developer Tools) Core Express is a module for [TyDeT Core][tydet-core] to handle log HTTP requests for a web server app using Express JS.

## Installation

This is a Node.js module available through the npm registry. Installation is done using the npm install command:

```shell
npm install tydet-core tydet-core-express
```

It is required to install [TyDeT Core][tydet-core] to use this module.

## Usage

### Basic usage

```js
import { Context } from 'tydet-core';
import { Logger, LoggerMode, LogLevel } from 'tydet-core-logger';

let app = new Context()
let logger = new Logger([
  {
    mode: LoggerMode.CONSOLE,
    min: LogLevel.INFO
  },
  {
    mode: LoggerMode.FILE,
    path: "./logs/today.log"
    max: LogLevel.SUCCESS
  },
  {
    mode: LoggerMode.WEBHOOK,
    endpoint: "https://mywebhookserver.com/logs",
    only: [LogLevel.ERROR, LogLevel.WARNING]
  }
])
app.mountService("logger", logger)

logger.debug("This is a debug message")
logger.info("This is an info message")
logger.success("This is a success message")
logger.failure("This is a failure message")
logger.warn("This is a warning message")
logger.error("This is an error message")
```

Check the [docs][docs] for more details about the service.

## Changelog

[Learn about the latest improvements][changelog].

## License

[MIT License][license].

## Contributing

We'd love for you to contribute to TyAPI Core Logger and help make it even better than it is today! Find out how you can contribute [here][contribute].



<!-- Markdown link & img dfn's -->
[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[contribute]: ./CONTRIBUTING.md
[tydet-core]: https://github.com/Kabany/tydet-core
[docs]: ./docs/README.md