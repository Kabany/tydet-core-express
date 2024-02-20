import supertest from "supertest"
import express from "express"
import { Context, CoreError } from "tydet-core"
import { Express, RequestExtended, SuccessResponse } from "../src/express.service"

let router = express.Router()
router.get("/test", async (req: RequestExtended, res: express.Response) => {
  return res.json(SuccessResponse(req, {ok: 1}, "Ok!"))
})

describe("Express Service", () => {
  it("Should handle http requests", async () => {
    let app = new Context()
    let express = new Express({port: 3000, host: 'localhost'}, [router])
    express.on404 = (request, service, context) => {
      return {code: -1, error: "This is a 404"}
    }
    await app.mountService("express", express)
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
    await app.unmountServices()
  })
})