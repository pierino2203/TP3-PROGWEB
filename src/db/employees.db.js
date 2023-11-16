const pool = require("./connection.db");
const TABLE = 'employees'
const TABLE2 = 'salaries'

module.exports.getAll = async function () {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM ${TABLE} e `);
    return rows;
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
    
  }
};
module.exports.getById = async function (id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const row = await conn.query(`SELECT * FROM ${TABLE} e WHERE emp_no=?`, [id])
    return row[0];
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
}

module.exports.getActualSalario = async function (employee) {
  let conn;
  try {
    conn = await pool.getConnection();
    const SQL = `
      SELECT
      e.emp_no,
      e.last_name,
      e.first_name,
      s.salary,
      DATE_FORMAT(s.from_date, '%Y-%m-%d') AS from_date,
      DATE_FORMAT(s.to_date, '%Y-%m-%d') AS to_date
      FROM salaries s
      INNER JOIN employees e USING (emp_no)
      WHERE emp_no= ?
      ORDER BY to_date DESC`;
    const rows = await conn.query(SQL, [employee.emp_no]);
    const newRow = { emp_no: rows[0].emp_no, last_name: rows[0].last_name, first_name: rows[0].first_name }
    const salarios = rows.map((e) => {
      return ({
        salary: e.salary,
        from_date: e.from_date,
        to_date: e.to_date
      })
    })
    newRow.salaries = salarios;
    return newRow;
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
}

module.exports.updateSalary = async function (employee, reqSalary) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    const SQL1 = `SELECT
      e.emp_no,
      e.last_name,
      e.first_name,
      s.salary,
      DATE_FORMAT(s.from_date, '%Y-%m-%d') AS from_date,
      DATE_FORMAT(s.to_date, '%Y-%m-%d') AS to_date
      FROM salaries s
      INNER JOIN employees e USING (emp_no)
      WHERE emp_no= ?
      AND s.to_date = '9999-01-01'`
    const SQL_ADD = `INSERT INTO salaries (emp_no, salary, from_date, to_date)
      VALUES (?, ?, NOW(), '9999-01-01');`
    const rows = await conn.query(SQL1, [employee.emp_no]);
    if (rows[0]) {
      const fechaActual = new Date();
      const dia = fechaActual.getDate();
      const mes = fechaActual.getMonth() + 1;
      const anio = fechaActual.getFullYear();
      const fechaFormateada = `${anio}-${mes < 10 ? '0' + mes : mes}-${dia < 10 ? '0' + dia : dia}`;
      if (rows[0].from_date === fechaFormateada) {
        return 1
      } else {
        const SQL_UPDATE = `UPDATE salaries
          SET to_date = NOW()
          WHERE emp_no = ? AND to_date = '9999-01-01';`
        const update = await conn.query(SQL_UPDATE, [employee.emp_no])
        // aqui agrego el nuevo salario 
        const params = [];
        params[0] = employee.emp_no;
        params[1] = reqSalary;
        const add = await conn.query(SQL_ADD, params);
        // const SQL1 = `SELECT
        //   e.emp_no,
        //   e.last_name,
        //   e.first_name,
        //   s.salary,
        //   s.from_date,
        //   s.to_date
        //   FROM salaries s
        //   INNER JOIN employees e USING (emp_no)
        //   WHERE emp_no= ?`
        // const prueba = await conn.query(SQL1, [employee.emp_no]);
        await conn.commit();
      }

    }
    else {
      return 0
    }

    // si todas las sentencias SQL fueron correctas entonces confirmamos los cambios.  
  } catch (err) {
    if (conn) await conn.rollback();
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
}
//Mueve un empleado de un departamento a otro
module.exports.moverEmpleado = async function (employee, dpto_no) {
  let conn
  try {
    conn = await pool.getConnection();
    const SQL = `SELECT 
    e.emp_no,
    e.last_name,
    e.first_name,e.gender,
    dm.from_date AS fecha_desde,
    dm.to_date AS fecha_hasta,
    dm.dept_no
    FROM dept_emp  dm
    INNER JOIN employees e ON (e.emp_no = dm.emp_no)
    AND e.emp_no=?
    AND dm.to_date='9999-01-01';
  `
    console.log(employee.emp_no)
    console.log(dpto_no);
    const rows = await conn.query(SQL, [employee.emp_no]);
    console.log(rows[0])
    if (rows[0]) {
      const fechaActual = new Date();
      const dia = fechaActual.getDate();
      const mes = fechaActual.getMonth() + 1;
      const anio = fechaActual.getFullYear();
      const fechaFormateada = `${anio}-${mes < 10 ? '0' + mes : mes}-${dia < 10 ? '0' + dia : dia}`;
      if (rows[0].dept_no === dpto_no) {
        return 1
      } else {
        const SQL_UPDATE = `UPDATE dept_emp
        SET to_date = NOW()
        WHERE emp_no =? 
        AND dept_no =?
        AND to_date = '9999-01-01';`
        // console.log(employee)
        // console.log(rows[0].dept_no)
        const params = []
        params[0] = employee.emp_no
        params[1] = rows[0].dept_no
        const update = await conn.query(SQL_UPDATE, params)
        const SQL2 = `INSERT INTO dept_emp (emp_no,dept_no,from_date,to_date)
      VALUES (?,?, NOW(), '9999-01-01')`
        params[1] = dpto_no
        const modificar = await conn.query(SQL2, params)
        await conn.commit();
      }
    } else {
      return 0;
    }
    return (rows[0])

  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
}