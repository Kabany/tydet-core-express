import express from "express"
import * as bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import { StatusCodes } from "http-status-codes";

import { Context, Service } from "tydet-core";

const ROUTES = "ROUTES";
const PORT = "PORT";
const HOST = "HOST";

export interface RequestExtended extends express.Request {
  context?: Context
  service?: Express
}

interface ExpressServerConfiguration {
  port: number,
  host: string
}

interface RequestInfo {
  url: string, method: string, body?: any, query?: any, headers?: any, path?: string
}

export type ExpressCallback = (request: RequestInfo, response: any, service: Express, context: Context) => void
export type Express404Callback = (request: RequestInfo, service: Express, context: Context) => {error: string, code: number}
//export type ExpressErrorCallback = (request: RequestInfo, error: any, service: Express, context: Context) => {error: string, code: number}
export type ExpressListeningCallback = (host: string, port: number, service: Express, context: Context) => void

export class Express extends Service {
  server: express.Express
  private instance: any

  onSuccess: ExpressCallback
  onFailure: ExpressCallback
  on404: Express404Callback
  //onError: ExpressErrorCallback
  onReady: ExpressListeningCallback

  constructor(configuration: ExpressServerConfiguration, routes: express.Router[]) {
    let params = new Map()
    params.set(ROUTES, routes);
    params.set(PORT, configuration.port);
    params.set(HOST, configuration.host);
    super(params)
  }

  async beforeMount(context: Context) {
    this.server = express();
    this.server.disable('x-powered-by');
    this.server.use(bodyParser.json() as express.RequestHandler);
    this.server.use(bodyParser.urlencoded({extended: true}) as express.RequestHandler);
    this.server.use(helmet());
    this.server.use(cors());
    super.beforeMount(context);
  }

  async onMount() {
    // set service parameter on request
    this.server.use((req: RequestExtended, _res: express.Response, next: express.NextFunction) => {
      req.context = this.context;
      req.service = this;
      return next();
    });
    // set endpoints
    let routes = this.params.get(ROUTES) as express.Router[];
    for (let route of routes) {
      this.server.use(route);
    }
    // set 404
    this.server.use((req: RequestExtended, res: express.Response, next: express.NextFunction) => {
      let url = req.protocol + '://' + req.get('host') + req.originalUrl;
      let data = this.on404 ? this.on404({url, method: req.method, body: req.body, query: req.query, headers: req.headers}, this, this.context) : {error: "Page not found", code: 0}
      res.status(StatusCodes.NOT_FOUND).json(FailureResponse(req, data.code, data.error));
      return;
    });
    // handle errors
    //this.server.use((err: any, req: RequestExtended, res: express.Response, _next: express.NextFunction) => {
    //  let url = req.protocol + '://' + req.get('host') + req.originalUrl;
    //  let data = this.onError ? this.onError({url, method: req.method, body: req.body, query: req.query, headers: req.headers}, err, this, this.context) : {error: "Whops! Something went wrong!", code: -50}
    //  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(FailureResponse(req, data.code, data.error))
    //});
    // listen port
    this.instance = this.server.listen({port: this.params.get(PORT) as number, host: this.params.get(HOST)});
    if (this.onReady) this.onReady(this.params.get(HOST), this.params.get(PORT) as number, this, this.context)
    super.onMount()
  }

  async onUnmount() {
    await (new Promise<void>((resolve, reject) => {
      this.instance?.close(() => {
        resolve()
      })
    }))
  }
}

export function SuccessResponse(req: RequestExtended, data?: any, message?: string) {
  let url = req.protocol + '://' + req.get('host') + req.originalUrl;
  let response = {
    success: true,
    data,
    message
  }
  if (req.service?.onSuccess) {
    req.service.onSuccess({url, path: req.originalUrl, method: req.method, body: req.body, query: req.query, headers: req.headers}, response, req.service, req.service.context)
  }
  return response
}

export function FailureResponse(req: RequestExtended, code: number, message: string, error?: any) {
  let url = req.protocol + '://' + req.get('host') + req.originalUrl;
  let response = {
    success: false,
    code,
    message,
    error
  }
  if (req.service?.onFailure) {
    req.service.onFailure({url, path: req.originalUrl, method: req.method, body: req.body, query: req.query, headers: req.headers}, response, req.service, req.service.context)
  }
  return response
}