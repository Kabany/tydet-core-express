import supertest from "supertest"
import express from "express"
import { Context, CoreError } from "tydet-core"
import { Express, FailureResponse, RequestExtended, SuccessResponse } from "../src/express.service"

let router = express.Router()
router.get("/test", async (req: RequestExtended, res: express.Response) => {
  res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
  return
})
router.get("/fail", async (req: RequestExtended, res: express.Response) => {
  res.json(FailureResponse(req, 1, "Ok!"))
  return
})
router.get("/throw", async (req: RequestExtended, res: express.Response, next: express.NextFunction) => {
  return next(new CoreError("This is a custom error"))
})

describe("Express Service", () => {
  let app: Context
  let express: Express
  beforeAll(async () => {
    app = new Context()
    express = new Express({port: 3000, host: 'localhost'}, [router])
    express.onSuccessResponse = (request, response, service, context) => {
      console.log("It works on success response", request, response)
    }
    express.onFailedResponse = (request, response, service, context) => {
      console.log("It works on failred response", request, response)
    }
    express.on404Interceptor = (request, service, context) => {
      console.log("404 Intercerptor works", request)
      return {code: -1, message: "This is a 404"}
    }
    express.onErrorInterceptor = (request, error, service, context) => {
      console.log("error interceptor works", request, error)
      return {code: -51, message: error.message, error}
    }
    await app.mountService("express", express)
  })

  it("Should handle http requests", async () => {
    
    // Test declared endpoint
    const res1 = await supertest(express.server).get('/test')
    expect(res1.status).toBe(200)
    expect(res1.body.data.ok).toBe(1)
    expect(res1.body.message).toBe("Ok!")
    expect(res1.body.success).toBeTruthy()
    // Test 404
    const res2 = await supertest(express.server).get('/unknown')
    expect(res2.status).toBe(404)
    expect(res2.body.success).toBeFalsy()
    expect(res2.body.code).toBe(-1)
    expect(res2.body.message).toBe("This is a 404")
    // Test throw
    const res3 = await supertest(express.server).get('/throw')
    expect(res3.status).toBe(500)
    expect(res3.body.success).toBeFalsy()
    expect(res3.body.code).toBe(-51)
    expect(res3.body.message).toBe("This is a custom error")
    
  })

  afterAll(async () => {
    await app.ejectAllServices()
  })
})