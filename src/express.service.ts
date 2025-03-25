import express from "express"
import * as bodyParser from "body-parser";
import helmet, { HelmetOptions } from "helmet";
import cors, { CorsOptions } from "cors";
import { StatusCodes } from "http-status-codes";

import { Context, Service } from "tydet-core";

const ROUTES = "ROUTES";
const PORT = "PORT";
const HOST = "HOST";
const CORS = "CORS";
const HELMET = "HELMET";

export interface RequestExtended extends express.Request {
  context?: Context
  service?: Express
}

interface ExpressServerConfiguration {
  port?: number,
  host?: string,
  cors?: CorsOptions
  helmet?: HelmetOptions
}

interface RequestInfo {
  url: string, method: string, body?: any, query?: any, headers?: any, path?: string
}

export type ExpressResponseCallback = (request: RequestInfo, response: any, service: Express, context: Context) => void
export type ExpressFailedResponseCallback = (request: RequestInfo, response: any, service: Express, context: Context, error?: any, errorMessage?: string) => void
export type Express404InterceptorCallback = (request: RequestInfo, service: Express, context: Context) => {message: string, code: number}
export type ExpressErrorInterceptorCallback = (request: RequestInfo, error: any, service: Express, context: Context) => {message?: string, code: number, error?: any}
export type ExpressListeningCallback = (host: string, port: number, service: Express, context: Context) => void

export class Express extends Service {
  server: express.Express
  private instance: any

  onSuccessResponse: ExpressResponseCallback
  onFailedResponse: ExpressFailedResponseCallback
  on404Interceptor: Express404InterceptorCallback
  onErrorInterceptor: ExpressErrorInterceptorCallback
  onReady: ExpressListeningCallback

  constructor(configuration: ExpressServerConfiguration, routes: express.Router[]) {
    let params = new Map()
    params.set(ROUTES, routes);
    params.set(PORT, configuration.port || 3000);
    params.set(HOST, configuration.host || "localhost");
    params.set(CORS, configuration.cors);
    params.set(HELMET, configuration.helmet);
    super(params)
  }

  async beforeMount(context: Context) {
    this.server = express();
    this.server.disable('x-powered-by');
    this.server.use(bodyParser.json() as express.RequestHandler);
    this.server.use(bodyParser.urlencoded({extended: true}) as express.RequestHandler);
    let helmetOpts: HelmetOptions = {}
    if (this.params.get(HELMET) != null) {
      helmetOpts = this.params.get(HELMET) as HelmetOptions
    }
    this.server.use(helmet(helmetOpts));
    let corsOpts: CorsOptions = {}
    if (this.params.get(CORS) != null) {
      corsOpts = this.params.get(CORS) as CorsOptions
    }
    this.server.use(cors(corsOpts));
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
      let data = this.on404Interceptor ? this.on404Interceptor({url, method: req.method, body: req.body, query: req.query, headers: req.headers}, this, this.context) : {message: "Page not found", code: 0}
      res.status(StatusCodes.NOT_FOUND).json(FailureResponse(req, data.code, data.message));
      return;
    });
    // handle errors
    this.server.use((err: any, req: RequestExtended, res: express.Response, _next: express.NextFunction): any => {
      let url = req.protocol + '://' + req.get('host') + req.originalUrl;
      let data = this.onErrorInterceptor ? this.onErrorInterceptor({url, method: req.method, body: req.body, query: req.query, headers: req.headers}, err, this, this.context) : {message: "Whops! Something went wrong!", code: -50}
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(FailureResponse(req, data.code, data.message, data.error))
    });
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
  if (req.service?.onSuccessResponse) {
    req.service.onSuccessResponse({url, path: req.originalUrl, method: req.method, body: req.body, query: req.query, headers: req.headers}, response, req.service, req.service.context)
  }
  return response
}

export function FailureResponse(req: RequestExtended, code: number, message: string, errorBody?: any, errorInt?: any, errorIntMessage?: string) {
  let url = req.protocol + '://' + req.get('host') + req.originalUrl;
  let response = {
    success: false,
    code,
    message,
    errorBody
  }
  if (req.service?.onFailedResponse) {
    req.service.onFailedResponse({url, path: req.originalUrl, method: req.method, body: req.body, query: req.query, headers: req.headers}, response, req.service, req.service.context, errorInt, errorIntMessage)
  }
  return response
}