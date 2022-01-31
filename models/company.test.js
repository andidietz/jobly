"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
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

const company1 = {
  handle: "c1",
  name: "C1",
  description: "Desc1",
  numEmployees: 1,
  logoUrl: "http://c1.img",
}

const company2 = {
  handle: "c2",
  name: "C2",
  description: "Desc2",
  numEmployees: 2,
  logoUrl: "http://c2.img",
}

const company3 = {
  handle: "c3",
  name: "C3",
  description: "Desc3",
  numEmployees: 3,
  logoUrl: "http://c3.img",
}

const newCompany = {
  handle: "new",
  name: "New",
  description: "New Description",
  numEmployees: 1,
  logoUrl: "http://new.img",
}

const updatedCompany = {
  name: "New",
  description: "New Description",
  numEmployees: 10,
  logoUrl: "http://new.img",
}


/************************************** create */

describe("create", function () {
  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([newCompany]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([company1, company2, company3]);
  });

  test("works: by min employees", async function () {
    let companies = await Company.findAll( {minEmployees: 2});
    expect(companies).toEqual([company2, company3]);
  });

  test("works: by max employees", async function () {
    let companies = await Company.findAll( {maxEmployees: 1});
    expect(companies).toEqual([company1]);
  });

  test("works: by min and max employees", async function () {
    let companies = await Company.findAll( {minEmployees: 1, maxEmployees: 2});
    expect(companies).toEqual([company1, company2]);
  });

  test("works: by name", async function () {
    let companies = await Company.findAll( {name: '1'});
    expect(companies).toEqual([company1]);
  });

  test("works: returning empty list if nothing found", async function () {
    let companies = await Company.findAll( {name: "not name"} );
    expect(companies).toEqual([]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
      jobs: [
        { id: testJobIds[0], title: 'job1', salary: '100', equity: '1'},
        { id: testJobIds[1], title: 'job2', salary: '200', equity: '2'},
        { id: testJobIds[2], title: 'job3', salary: '300', equity: '3'}
      ]
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  test("works", async function () {
    let company = await Company.update("c1", updatedCompany);
    expect(company).toEqual({
      handle: "c1",
      ...updatedCompany,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updatedCompany);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
