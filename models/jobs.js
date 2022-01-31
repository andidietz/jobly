"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a Job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({title, salary, equity, companyHandle}) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   *  Can filter on provided search filters:
   * - title
   * - minSalary
   * - hasEquity
   * 
   *  Returns [{ id, title, salary, equity, company_handle }, ...]
   */

  static async findAll(dataFilters) {
    const jobsRes = 
      `SELECT title,
          salary,
          equity,
          company_handle AS companyHandle
        FROM jobs`;
    let whereSqlStatements = [];
    let queryValues = [];

    const { title, minSalary, hasEquity } = dataFilters;

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereSqlStatements.push(`title ILKIE $${queryValues.length}`)
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereSqlStatements.push(`salary >= $${queryValues.length}`);
    }
    
    if (hasEquity === true) {
      queryValues.push(hasEquity);
      whereSqlStatements.push(`equity > 0`);
    }

    if (whereSqlStatements.length > 0) {
      query += "WHERE" + whereSqlStatements.join("AND")
    }

    query += "ORDER BY title"
    const jobsRes = await db.query(query, queryValues)
    return jobsRes.rows;
  }

  /** Given a job handle, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where company is [{ handle, name, description,
   *      num_employees AS "numEmployees", logo_url AS "logoUrl}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const jobRes = await db.query(
        `SELECT id,
          title,
          salary,
          equity,
          company_handle AS companyHandle
        FROM jobs
        WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
    
    const companiesRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
      FROM companies
      WHERE handle = $1`, 
      [job.companyHandle]);
    
    delete job.companyHandle;
    job.company = companiesRes.rows[0]

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, company_handle}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data, {companyHandle: "company_handle"});

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING title,
                                salary,
                                equity,
                                company_handle AS companyHandle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
