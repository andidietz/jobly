"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
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

const updatedJob = {
  title: "update",
  salary: "400",
  equity: "0.4",
  company_handle: "c1"
};

const updatedJobWithId = {
  id: testJobIds[0], 
  title: "update", 
  salary: "400",
  equity: "0.4",
  company_handle: "c1"
}


/************************************** create */

describe("create", function () {
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle 
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([newJob]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([job1, job2, job3]);
  });

  test("works: by title", async function () {
    let jobs = await Job.findAll( {title: "job1"});
    expect(jobs).toEqual([job1]);
  });

  test("works: by minSalary", async function () {
    let jobs = await Job.findAll( {minSalary: 200});
    expect(jobs).toEqual([job2, job3]);
  });

  test("works: by hasEquity", async function () {
    let jobs = await Job.findAll( {hasEquity: true});
    expect(jobs).toEqual([job1, job2, job3]);
  });

  test("works: returning empty list if nothing found", async function () {
    let jobs = await Job.findAll( {title: "not name"} );
    expect(jobs).toEqual([]);
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("job1");
    expect(job).toEqual({
      id: testJobIds[0],
      title: "job1",
      salary: "100",
      equity: "0.1",
      company_handle: 'c1',
      company: {handle:'c1', 
                name:'C1', 
                numEmployees: 1, 
                description: 'Desc1', 
                logoUrl: 'http://c1.img'
              }});
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/************************************** update */

describe("update", function () {
  test("works", async function () {
    let job = await Job.update("job1", updatedJob);
    expect(job).toEqual(updatedJobWithId);

    const result = await db.query(
          `SELECT title, salary, equity, company_handle 
          FROM jobs
          WHERE title = 'job1`);
    expect(result.rows).toEqual([updatedJobWithId]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update("nope", updateJob);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("job1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("job1");
    const res = await db.query(
        "SELECT id FROM jobs WHERE title='job1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
