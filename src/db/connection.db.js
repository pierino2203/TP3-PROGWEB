const mariadb = require('mariadb')
require('dotenv').config()

const pool = mariadb.createPool({
    host: process.env.DB_HOST           ||'localhost',
    port: process.env.DB_PORT           || 3306, 
    user: process.env.DB_USER           ||'root', 
    password: process.env.DB_PASSWORD   ||'Ummanestor22.',
    database: process.env.DB_DATABASE   ||'employee',
    connectionLimit: 10,
    allowPublicKeyRetrieval: true
});


module.exports=pool