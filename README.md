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
import { Express, RequestExtended, SuccessResponse } from 'tydet-core-express';

let router = express.Router()
router.get("/test", async (req: RequestExtended, res: express.Response) => {
  return res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
})

let app = new Context()
let express = new Express({host: 'localhost', port: 3000}, [router])
await app.mountService("express", express)
```

Check the [docs][docs] for more details about the service.

## Changelog

[Learn about the latest improvements][changelog].

## License

[MIT License][license].

## Contributing

We'd love for you to contribute to TyAPI Core Express and help make it even better than it is today! Find out how you can contribute [here][contribute].



<!-- Markdown link & img dfn's -->
[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[contribute]: ./CONTRIBUTING.md
[tydet-core]: https://github.com/Kabany/tydet-core
[docs]: ./docs/README.md