# Documentation

TyDeT Core Express is a module for TyDeT Core to handle HTTP requests using Express JS.

The main purpose is to easy hanlde Express JS events that can align with the TyDeT Core lifecycle events.

## Basic usage

```js
import { Context } from 'tydet-core';
import { Express, RequestExtended, SuccessResponse } from 'tydet-core-express';

// Set routes
let router = express.Router()
router.get("/test", async (req: RequestExtended, res: express.Response) => {
  return res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
})

// Set Express as a Service
let app = new Context()
let express = new Express({host: 'localhost', port: 3000}, [router])
await app.mountService("express", express)
```

## Configurations

The input arguments are required and will define the configuration and the list of routes for the server

```js
let express = new Express({host: 'localhost', port: 3000}, [router])
```

The first argument (`ExpressServerConfiguration`) define the server `host` and `port`. Normaly Node JS servers use `localhost` as the host and `3000` as the port.

The second argument is an array of routes (`express.Router`). In the express Router you can define all middlewares and endpoints for your server.

```js
let router = express.Router()
router.get("/ok", async (req: RequestExtended, res: express.Response) => {
  return res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
})
router.get("/error", async (req: RequestExtended, res: express.Response) => {
  return res.json(FailureResponse(req, {ok: 1}, "Ok!"))
})
```


### Route Parameters

Normally when you define and endpoint in the router, you use the `express.Request` and `express.Response` as arguments to handle the HTTP request. 

The Express instance add a middleware to get the service and the context. You can access these variables with `req.service` and `req.context`. If you are using TypeScript, you can use extended `express.Request` with the type `RequestExtended`.

```js
let router = express.Router()
router.get("/ok", async (req: RequestExtended, res: express.Response) => {
  req.context // TyDeT Context
  req.service // Express Service
  return res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
})
```

### Express Responses

The main purpose for this module is to normalize the responses, so it's recommended to simplify the responses for a success and a failed messages. For both cases you can use the `SuccessResponse()` and `FailureResponse()` methods to normalize the response.

```js
console.log(SuccessResponse(req, {ok: 1}, "Ok!"))
//{
//  "success": true,
//  "message": "Ok!",
//  "data": {
//    "ok": 1
//  }
//}

console.log(FailureResponse(req, 10, "Some errors were found!", {parameter: "required"}))
//{
//  "success": false,
//  "message": "Some errors were found!",
//  "code": 10,
//  "error": {
//    "parameter": "required"
//  }
//}
```

#### `SuccessResponse(req: RequestExtended, data: any, message?: string)` -> `{success: boolean, message?: string, data?: any}`

- **req**: The Express Request. Used to access request data, the app context and services.
- **data**: The payload to send as response. It is recommended for easy body parsing on the client side to use an object, so if you need to send an array, you can embed the array in an object. For example: `data: {users: [...]}`.
- **message**: (Optional). A custom message to add to the response.

#### `FailureResponse(req: RequestExtended, code: number, message: string, error?: any)` -> `{success: boolean, message?: string, code: number, error?: any}`

- **req**: The Express Request. Used to access request data, the app context and services.
- **code**: A number code for error reference. This is recommeded to handle errors with ease on the client side.
- **message**: A custom message to describe the error.
- **error**: (Optional). The payload to send as response. It is used to explain in detail the error. Same case as the `data`, it is recommended to send an array embedded in an object. For example: `error: {parameter_1: "required", parameter_2: "Too long"}`.

### Express Callbacks

The are some callbacks that you can define on the configuration of this service. The callbacks are called for the following events:

#### `onSuccess(request: RequestInfo, response: any, service: Express, context: Context) => void`

- **req**: Information recieved about the request.
- **response**: Data that will be sent as response.
- **service**: The Express Service.
- **context**: The TyDeT Context.

This method is called each time you use the `SuccessResponse()` method.

```js
let express = new Express({host: 'localhost', port: 3000}, [router])
express.onSuccess = (request, response, service, context) {
  console.log("Success", request.method, request.url, response) // You can use the TyDeT Logger or any custom logger.
}
```

#### `onFailure(request: RequestInfo, response: any, service: Express, context: Context) => void`

- **req**: Information recieved about the request.
- **response**: Data that will be sent as response.
- **service**: The Express Service.
- **context**: The TyDeT Context.

This method is called each time you use the `FailureResponse()` method.

```js
let express = new Express({host: 'localhost', port: 3000}, [router])
express.onFailure = (request, response, service, context) {
  console.log("Success", request.method, request.url, response) // You can use the TyDeT Logger or any custom logger.
}
```

#### `on404(request: RequestInfo, service: Express, context: Context) => {code: number, error: message}`

- **req**: Information recieved about the request.
- **service**: The Express Service.
- **context**: The TyDeT Context.

This callback, unlike the previous ones, you can customize the payload to send, so its required to send the error `code` and the erorr `message`:

```js
let express = new Express({host: 'localhost', port: 3000}, [router])
express.on404 = (request, service, context) {
  return {code: 404, message: "This is a 404 error".}
}
```

It is important to known that the error `code` is not the HTTP Status code.
Also, because a response is sent, the `onFailure` method will be called after the `on404`.

#### `onReady(host: string, port: number, service: Express, context: Context) => void`

- **req**: Express instance server host (set on the Express configuration).
- **port**: Express instance server port (set on the Express configuration).
- **service**: The Express Service.
- **context**: The TyDeT Context.

This callback is executed when the express instance listener is ready.

```js
let express = new Express({host: 'localhost', port: 3000}, [router])
express.onReady = (host, port, service, context) => {
  console.log(`Server ${host} is listening HTTP requests on the port ${port}`) // You can use the TyDeT Logger or any custom logger.
}
```