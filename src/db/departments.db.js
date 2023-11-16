const pool = require("./connection.db");
const TABLE='departments'

/**
 * Retorna todos los departamentos
 * @returns 
 */
module.exports.getAll = async function () {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM ${TABLE} d `);
    return rows;
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};

/**
 * Retorna un departamento por su clave primaria
 * @returns 
 */
module.exports.getById = async function (id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM ${TABLE} d WHERE dept_no=?`,[id]);
    return rows[0];
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};

/**
 * Retorna el manager actual de un Departamento y la fecha desde
 * @param {Object} departamento 
 * @returns 
 */
 module.exports.getActualManager = async function (departamento) {
  let conn;
  try {
    conn = await pool.getConnection();
    const SQL=`
SELECT 
  e.*,
  dm.from_date AS fecha_desde
FROM dept_manager dm
	INNER JOIN employees e ON (e.emp_no = dm.emp_no)
WHERE dm.dept_no = ? AND dm.to_date='9999-01-01'
`;
    const rows = await conn.query(SQL,[departamento.dept_no]);
    return rows[0];
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};
//Retorna todos los manager de un dpto determinado
module.exports.getManagerList =async function (departamento){
  let conn;
  try {
    conn = await pool.getConnection();
    const SQL=`
      SELECT 
      e.emp_no,e.last_name,e.first_name,e.gender,
      dm.from_date AS fecha_desde,dm.to_date AS fecha_hasta
      FROM dept_manager dm
	    INNER JOIN employees e ON (e.emp_no = dm.emp_no)
      WHERE dm.dept_no = ?
    `;
    const rows = await conn.query(SQL,[departamento.dept_no]);
    return rows
  } catch (err) {
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
}

/**
 * Agrega un departamento
 * @param {Object} departamento 
 * @returns 
 */
module.exports.add = async function (departamento) {
  let conn;
  try {
    conn = await pool.getConnection();
    // comienza la transacción, despues se puede hacer todas las sentencias
    // SQL DML cómo si fuera una única operación.
    await conn.beginTransaction();
    
    const SQL=`INSERT INTO ${TABLE} (dept_no, dept_name) VALUES(?, ?)`
    const params=[]
    params[0]=departamento.dept_no
    params[1]=departamento.dept_name
    const rows = await conn.query(SQL,params);
    await conn.commit(); // si todas las sentencias SQL fueron correctas entonces confirmamos los cambios.
    return rows;
  } catch (err) {        
    await conn.rollback(); // si falló una sentencias SQL entonces volvemos atras los cambios.
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};

/**
 * eliminar un Departamento
 * @param {Object} departamento 
 * @returns 
 */
module.exports.delete = async function (departamento) {
  let conn;
  try {
    conn = await pool.getConnection();

    // comienza la transacción, despues se puede hacer todas las sentencias
    // SQL DML cómo si fuera una única operación.
    await conn.beginTransaction();
    
    const rows = await conn.query(`DELETE FROM ${TABLE} WHERE dept_no=?`,[departamento.dept_no]);
    await conn.commit();// si todas las sentencias SQL fueron correctas entonces confirmamos los cambios.
    return rows;
  } catch (err) {
    if(conn) await conn.rollback(); // si falló una sentencias SQL entonces volvemos atras los cambios.
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};

/**
 * Modifica un Departamento
 * @param {Object} departamento 
 * @returns 
 */
module.exports.update = async function (departamento) {
  let conn;
  try {
    conn = await pool.getConnection();
    // comienza la transacción, despues se puede hacer todas las sentencias
    // SQL DML cómo si fuera una única operación.
    await conn.beginTransaction();

    const SQL=`UPDATE ${TABLE}  SET dept_name=? WHERE dept_no=?`
    const params=[]
    params[0]=departamento.dept_name
    params[1]=departamento.dept_no    
    const rows = await conn.query(SQL,params);
    await conn.commit();// si todas las sentencias SQL fueron correctas entonces confirmamos los cambios.  
    return rows;
  } catch (err) {
    if (conn) await conn.rollback(); // si falló una de las sentencias SQL entonces volvemos atras los cambios.
    return Promise.reject(err);
  } finally {
    if (conn) await conn.release();
  }
};