const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const config = require("./config");
const db = require('../../internal/data/db');
const {sql} = require('drizzle-orm');
const { clerkMiddleware } = require('@clerk/express');

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())
// Serve static files (using the safe absolute path from config)
// Access files at: http://localhost:8080/uploads/file.pdf
app.use("/uploads", express.static(config.uploadDir));

// --- Routes ---
app.use("/v1", routes);

// --- Start Server ---
(async () => {
  try {
    // 1. Check Database Connection
    console.log("Checking database connection...");
    await db.execute(sql`SELECT 1`);
    console.log("Database connected successfully ✅");

    // 2. Only if DB is ready, start the server
    const server = app.listen(config.port, () => {
      console.log(`
            Server started!
            ---------------------------
            Url:      http://localhost:${config.port}
            Env:      ${config.env}
            Version:  ${config.version}
            Uploads:  ${config.uploadDir}
            ---------------------------
            `);
    });

    // 3. Error Handling
    server.on("error", (err) => {
      console.error("Failed to start server:", err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error("CRITICAL: Could not connect to database.");
    console.error(err);
    process.exit(1);
  }
})();
