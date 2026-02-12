const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const config = require('./config');

const app = express();


// --- Middleware ---
app.use(express.json());
app.use(cors());
// Serve static files (using the safe absolute path from config)
// Access files at: http://localhost:8080/uploads/file.pdf
app.use('/uploads', express.static(config.uploadDir));


// --- Routes ---
app.use("/v1", routes);

// --- Start Server ---
// Catch startup errors (like port already in use)
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

server.on('error', (err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
});

