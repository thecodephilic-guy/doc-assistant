const { getAuth } = require("@clerk/express");
const config = require("./config");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { rateLimitExceededResponse } = require("./errors");

// Helper to reliably extract the client's public IP:
// Behind Cloudflare Tunnel, CF-Connecting-IP is populated at the edge and cannot be spoofed.
// Falls back to req.ip for direct/Tailscale network calls.
const getClientIp = (req) => {
  return req.headers["cf-connecting-ip"] || req.ip || "127.0.0.1";
};

const baseLimiter = rateLimit({
  windowMs: config.limiter.windowMs,
  limit: config.limiter.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(getClientIp(req), 56),
  handler: (req, res, next) => rateLimitExceededResponse(res),
});

const uploadLimiter = rateLimit({
  windowMs: config.limiter.windowMs,
  limit: config.limiter.maxUploadRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(getClientIp(req), 56),
  handler: (req, res, next) => rateLimitExceededResponse(res),
});

/**
 * Authentication middleware using Clerk.
 */
const requireAuth = async (req, res, next) => {
  const auth = getAuth(req);

  if (!auth.isAuthenticated || !auth.userId) {
    const hasAuthHeader = Boolean(req.headers.authorization);
    console.warn(`[AUTH 401] ${req.method} ${req.originalUrl} | AuthHeader: ${hasAuthHeader ? "PRESENT" : "MISSING"} | ClerkStatus: ${auth.sessionStatus || "signed-out"} | Reason: ${req.headers["x-clerk-auth-reason"] || "none"}`);
    
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "you must be authenticated to access this resource",
      },
    });
  }

  // Attach userId to request for downstream handlers
  req.userId = auth.userId;
  next();
};

const globalRateLimiter =  (req, res, next) => {
  if (!config.limiter.enabled) {
    return next();
  }

  //else execute the middleware offered by package
  baseLimiter(req, res, next);
};

const uploadRateLimiter = (req, res, next) => {
  if (!config.limiter.enabled){
    return next();
  }

  uploadLimiter(req, res, next);
}

module.exports = { requireAuth, globalRateLimiter, uploadRateLimiter };
