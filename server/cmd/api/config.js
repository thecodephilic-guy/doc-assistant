require("dotenv").config();
const { parseArgs } = require("node:util");
const path = require("path");

// 1. Define Defaults
const defaults = {
  port: 8080,
  env: "development",
  version: "1.0.0",
  limiter: {
    windowMs: 1 * 60 * 1000,
    maxRequests: 50,
    maxUploadRequests: 5,
    enabled: true,
  },
};

// 2. Parse Flags
const options = {
  env: { type: "string" },
  port: { type: "string" },
  "db-dsn": { type: "string" }, //Allow passing DB URL via flag
  limiter: { type: "string" },
};

// parseArgs can throw if args are malformed, so we wrap it safely or let it crash early
const { values } = parseArgs({
  args: process.argv.slice(2),
  options,
  strict: false, // Allows other flags to exist without crashing
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
    dsn: getEnvVar(values["db-dsn"], "DATABASE_URL"),
  },

  // Redis (Unstash)
  redis: {
    url: getEnvVar(null, "REDIS_URL"),
    options: {
      maxRetriesPerRequest: null,
      // tls: { rejectUnauthorized: false }, //This is needed if you I use Upstash as provider (becuase of residss (extra s))
    },
  },

  // AI / Vector (Gemini)
  ai: {
    apiKey: getEnvVar(null, "GEMINI_API_KEY"),
    embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
    vectorDim: parseInt(process.env.VECTOR_DIM || 768, 10),
  },
  // Helper to ensure absolute path for uploads
  uploadDir: path.join(process.cwd(), "uploads"),

  // Rate Limiters Config
  limiter: {
    windowMs: parseInt(
      process.env.LIMITER_WINDOW_MS || defaults.limiter.windowMs,
      10,
    ),
    maxRequests: parseInt(
      process.env.LIMITER_MAX_REQUESTS || defaults.limiter.maxRequests,
      10,
    ),
    maxUploadRequests: parseInt(
      process.env.LIMITER_MAX_UPLOAD_REQUESTS ||
        defaults.limiter.maxUploadRequests,
      10,
    ),
    enabled: (values.limiter || process.env.LIMITER_ENABLED) !== "false",
  },
};

// Freeze it so no one can accidentally change it later
module.exports = Object.freeze(config);
