"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const job1 = {
    id: testJobIds[0],
    title: "job1",
    salary: "100",
    equity: "0.1",
    company_handle: 'c1'
  };
  
  const job2 = {
    id: testJobIds[1],
    title: "job2",
    salary: "200",
    equity: "0.2",
    company_handle: 'c1'
  };
  
  const job3 = {
    id: testJobIds[2],
    title: "job3",
    salary: "300",
    equity: "0.3",
    company_handle: 'c1'
  };
  
  const newJob = {
    title: "new",
    salary: "400",
    equity: "0.4",
    company_handle: "c1"
  };
  

/************************************** POST /jobs */

describe("POST /jobs", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("no auth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: 3,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [job1, job2, job3]
    });
  });

  test("filtering works", async function() {
    const res = await request(app).get("/jobs")
      .query({ title: "job1"})
    expect(res.body).toEqual({
      jobs: [job1]
    })
  })
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/job1`);
    expect(resp.body).toEqual({
      job: {
        ...job1,
        company: [{handle:'c1', 
                    name:'C1', 
                    numEmployees: 1, 
                    description: 'Desc1', 
                    logoUrl: 'http://c1.img'
      }]
      },
    });
  });

  test("works for anon: job w/o company", async function () {
    const resp = await request(app).get(`/jobs/job2`);
    expect(resp.body).toEqual({job: {job2}});
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/job1`)
        .send({
          title: "new-title",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "new-title",
        salary: "100",
        equity: "0.1",
        company_handle: 'c1'
      },
    });
  });

  test("no auth for non-admin", async function() {
    const resp = await request(app)
        .patch("/jobs/job1")
        .send({
            title: "new-title"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(res.statusCode).toEqual(401)
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/job1`)
        .send({
            title: "new-title"
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/nope`)
        .send({
            title: "new-title"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/job1`)
        .send({
          id: 1000000
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/job1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "job1" });
  });

  test("no auth for non-admin", async function() {
    const resp = await request(app)
        .delete("/jobs/job1")
        .set("authorization", `Bearer ${u1Token}`);
    expect(res.statusCode).toEqual(401)
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/user1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});