const { parseArgs } = require('node:util');
const path = require('path');
require('dotenv').config(); // Load .env file if present

// 1. Define Defaults
const defaults = {
    port: 8080,
    env: 'development',
    version: '1.0.0',
    db: {
        maxOpenConns: 25,
        maxIdleConns: 25,
        maxConnIdleTime: '15m'
    },
    limiter: {
        rps: 2,
        burst: 4,
        enabled: true
    }
};

// 2. Parse Flags
const options = {
    env: { type: 'string' },
    port: { type: 'string' },
    'db-dsn': {type: 'string'}, //Allow passing DB URL via flag
    limiter: {type: 'string'}
};

// parseArgs can throw if args are malformed, so we wrap it safely or let it crash early
const { values } = parseArgs({ 
    args: process.argv.slice(2), 
    options,
    strict: false // Allows other flags to exist without crashing
});

// 3. Hierarchy Helper
const getEnvVar = (flag, envName, defaultVal) => {
    if (flag) return flag;
    if (process.env[envName]) return process.env[envName];
    if (defaultVal !== undefined) return defaultVal;
    // Critical configs should crash if missing
    throw new Error(`${envName} is missing in .env or flags`);
};

// 4. Export the FINAL object
const config = {
    port: parseInt(values.port || process.env.PORT || defaults.port, 10),
    env: values.env || process.env.NODE_ENV || defaults.env,
    version: defaults.version,

    //Database (Neon/Postgres)
    db: {
        dsn: getEnvVar(values['db-dsn'], 'DATABASE_URL'),
        maxOpenConns: parseInt(process.env.DB_MAX_OPEN_CONNS || defaults.db.maxOpenConns, 10),
        maxIdleConns: parseInt(process.env.DB_MAX_IDLE_CONNS || defaults.db.maxIdleConns, 10),
        maxConnIdleTime: process.env.DB_MAX_CONN_IDLE_TIME || defaults.db.maxConnIdleTime,
    },

    // ImageKit (File Storage)
    // imagekit: {
    //     publicKey: getEnvVar(null, 'IMAGEKIT_PUBLIC_KEY'),
    //     privateKey: getEnvVar(null, 'IMAGEKIT_PRIVATE_KEY'),
    //     urlEndpoint: getEnvVar(null, 'IMAGEKIT_URL_ENDPOINT'),
    // },

    // AI / Vector (OpenAI)
    ai: {
        apiKey: getEnvVar(null, 'GEMINI_API_KEY'),
        embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
        // Gemini text-embedding-004 outputs 768 dimensions
        vectorDim: parseInt(process.env.VECTOR_DIM || 768, 10)
    },
    // Helper to ensure absolute path for uploads
    uploadDir: path.join(process.cwd(), 'uploads'),
    limiter: {
        enabled: (values.limiter || process.env.LIMITER_ENABLED) !== 'false',
        rps: parseFloat(process.env.LIMITER_RPS || defaults.limiter.rps),
        burst: parseInt(process.env.LIMITER_BURST || defaults.limiter.burst, 10),
    }
};

// Freeze it so no one can accidentally change it later
module.exports = Object.freeze(config);