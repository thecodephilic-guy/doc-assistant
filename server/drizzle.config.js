const {defineConfig} = require('drizzle-kit')
const config = require('./cmd/api/config')

module.exports = defineConfig({
    schema: "./internal/data/schema.js",
    out: "./migrations",
    dialect: 'postgresql',
    dbCredentials: {
        url: config.db.dsn,
    }
})
