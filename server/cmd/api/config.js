const { parseArgs } = require('node:util');
require('dotenv').config(); // Load .env file if present

// 1. Define Defaults
const defaults = {
    port: 8080,
    env: 'development',
    version: '1.0.0'
};

// 2. Parse Flags
const options = {
    env: { type: 'string' },
    port: { type: 'string' }
};

// parseArgs can throw if args are malformed, so we wrap it safely or let it crash early
const { values } = parseArgs({ 
    args: process.argv.slice(2), 
    options,
    strict: false // Allows other flags to exist without crashing
});

// 3. Hierarchy: Flag > Env Var > Default
const getPort = () => {
    if (values.port) return parseInt(values.port, 10);
    if (process.env.PORT) return parseInt(process.env.PORT, 10);
    return defaults.port;
};

const getEnv = () => {
    const env = values.env || process.env.NODE_ENV || defaults.env;
    const allowed = ['development', 'production', 'staging'];
    if (!allowed.includes(env)) {
        throw new Error(`Invalid environment: ${env}. Must be one of: ${allowed.join(', ')}`);
    }
    return env;
};

// 4. Export the FINAL object
const config = {
    port: getPort(),
    env: getEnv(),
    version: defaults.version,
    // Helper to ensure absolute path for uploads
    uploadDir: require('path').join(process.cwd(), 'uploads') 
};

// Freeze it so no one can accidentally change it later
module.exports = Object.freeze(config);