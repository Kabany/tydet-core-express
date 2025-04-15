import { StatusCodes } from "http-status-codes";
import { CoreError } from "tydet-core";

export class ExpressFailedResponse extends CoreError {
  code: number
  errBody: any
  reason: string
  statusCode: number

  constructor(code: number, message: string, errBody?: any, statusCode?: number, reason?: any) {
    super();
    Object.setPrototypeOf(this, ExpressFailedResponse.prototype);
    this.name = this.constructor.name
    this.message = message;
    this.errBody = errBody;
    this.code = code;
    if (reason != null) {
      if (reason instanceof Error) {
        if (reason.stack) {
          this.reason = reason.stack
        } else {
          this.reason = reason.message
        }
      } else {
        this.reason = `${reason}`
      }
    }
    this.statusCode = statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    if (Error.captureStackTrace) Error.captureStackTrace(this, ExpressFailedResponse);
  }
}