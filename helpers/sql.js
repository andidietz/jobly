const { BadRequestError } = require("../expressError");

  /** Creates portion of sql request string depending on the values 
   * given in the request.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only creates the sql values and SET params from the 
   * provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {setCols, values}
   *
   * Throws NotFoundError if No data not found in params.
   */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
