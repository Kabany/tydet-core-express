import express from "express"
import * as bodyParser from "body-parser";
import helmet, { HelmetOptions } from "helmet";
import cors, { CorsOptions } from "cors";
import { StatusCodes } from "http-status-codes";
import cookieParser from "cookie-parser"

import { Context, Service } from "tydet-core";
import { ExpressFailedResponse } from "./express.error";

const ROUTES = "ROUTES";
const PORT = "PORT";
const HOST = "HOST";
const CORS = "CORS";
const HELMET = "HELMET";
const COOKIE = "COOKIE";

export interface RequestExtended extends express.Request {
  context?: Context
  service?: Express
}

export interface ExpressServerConfiguration {
  port?: number,
  host?: string,
  cors?: CorsOptions
  helmet?: HelmetOptions
  cookie?: CookieOptions
}

export interface CookieOptions extends cookieParser.CookieParseOptions {
  secret: string
}

export interface RequestInfo {
  url: string, method: string, body?: any, query?: any, headers?: any, path?: string
}

export type ExpressResponseCallback = (request: RequestInfo, response: any, service: Express, context: Context) => void
export type ExpressFailedResponseCallback = (request: RequestInfo, response: any, service: Express, context: Context, error?: ExpressFailedResponse) => void
export type Express404InterceptorCallback = (request: RequestInfo, service: Express, context: Context) => {message: string, code: number}
export type ExpressErrorInterceptorCallback = (request: RequestInfo, error: any, service: Express, context: Context) => {message?: string, code: number, error?: any, statusCode: number}
export type ExpressConnectionCallback = (host: string, port: number, service: Express, context: Context) => void

export class Express extends Service {
  server: express.Express
  private instance: any

  onSuccessResponse: ExpressResponseCallback
  onFailedResponse: ExpressFailedResponseCallback
  on404Interceptor: Express404InterceptorCallback
  onErrorInterceptor: ExpressErrorInterceptorCallback
  onReady: ExpressConnectionCallback
  onDisconnected: ExpressConnectionCallback

  constructor(configuration: ExpressServerConfiguration, routes: express.Router[]) {
    let params = new Map()
    params.set(ROUTES, routes);
    params.set(PORT, configuration.port || 3000);
    params.set(HOST, configuration.host || "localhost");
    params.set(CORS, configuration.cors);
    params.set(HELMET, configuration.helmet);
    params.set(COOKIE, configuration.cookie)
    super(params)
  }

  async beforeMount(context: Context) {
    await this.createServer()
    super.beforeMount(context);
  }

  async onMount() {
    await this.addEndpoints()
    super.onMount()
  }

  async afterMount() {
    if (this.onReady) this.onReady(this.params.get(HOST), this.params.get(PORT) as number, this, this.context)
    super.afterMount()
  }

  async beforeReset() {
    await this.closeServer()
    if (this.onDisconnected) this.onDisconnected(this.params.get(HOST), this.params.get(PORT) as number, this, this.context)
    await super.beforeReset()
  }

  async onReset() {
    await this.createServer()
    await this.addEndpoints()
    await super.onReset()
  }

  async afterReset() {
    if (this.onReady) this.onReady(this.params.get(HOST), this.params.get(PORT) as number, this, this.context)
    await super.afterReset()
  }

  async onEject() {
    await this.closeServer()
    await super.onEject()
  }

  async afterEject() {
    if (this.onDisconnected) this.onDisconnected(this.params.get(HOST), this.params.get(PORT) as number, this, this.context)
    await super.afterEject()
  }

  private async createServer() {
    this.server = express();
    this.server.disable('x-powered-by');
    let cookieOpts: CookieOptions = {secret: ""}
    if (this.params.get(COOKIE) != null) {
      cookieOpts = this.params.get(COOKIE)
    }
    this.server.use(cookieParser(cookieOpts.secret, cookieOpts) as express.RequestHandler)
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
  }

  private async addEndpoints() {
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
      let data = this.onErrorInterceptor ? this.onErrorInterceptor({url, method: req.method, body: req.body, query: req.query, headers: req.headers}, err, this, this.context) : {message: "Whops! Something went wrong!", code: -50, statusCode: StatusCodes.INTERNAL_SERVER_ERROR}
      return res.status(data.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(FailureResponse(req, data.code, data.message, data.error))
    });
    // listen port
    this.instance = this.server.listen({port: this.params.get(PORT) as number, host: this.params.get(HOST)});
  }

  private async closeServer() {
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

export function FailureResponse(req: RequestExtended, code: number, message: string, errorBody?: any, error?: ExpressFailedResponse) {
  let url = req.protocol + '://' + req.get('host') + req.originalUrl;
  let response = {
    success: false,
    code,
    message,
    errorBody
  }
  if (req.service?.onFailedResponse) {
    req.service.onFailedResponse({url, path: req.originalUrl, method: req.method, body: req.body, query: req.query, headers: req.headers}, response, req.service, req.service.context, error)
  }
  return response
}