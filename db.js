const mysql = require('mysql2/promise');
require('dotenv').config();

const masterPool = mysql.createPool({
  host: process.env.DB_HOST_MASTER || 'localhost',
  port: process.env.DB_PORT_MASTER || 3306,
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'userpassword',
  database: process.env.DB_NAME || 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const replicaPool = mysql.createPool({
  host: process.env.DB_HOST_REPLICA || 'localhost',
  port: process.env.DB_PORT_REPLICA || 3307,
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'userpassword',
  database: process.env.DB_NAME || 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = { masterPool, replicaPool };
