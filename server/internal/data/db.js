const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const config = require('../../cmd/api/config');

// Create the connection
const sql = neon(config.db.dsn);
const db = drizzle(sql);

module.exports = db;