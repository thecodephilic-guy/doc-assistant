const { getAuth } = require("@clerk/express");
const config = require("./config");
const { rateLimit } = require("express-rate-limit");
const { rateLimitExceededResponse } = require("./errors");

const baseLimiter = rateLimit({
  windowMs: config.limiter.windowMs,
  limit: config.limiter.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res, next) => rateLimitExceededResponse(res),
});

const uploadLimiter = rateLimit({
  windowMs: config.limiter.windowMs,
  limit: config.limiter.maxUploadRequests,
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
  handler: (req, res, next) => rateLimitExceededResponse(res),
});

/**
 * Authentication middleware using Clerk.
 */
const requireAuth = async (req, res, next) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "you must be authenticated to access this resource",
      },
    });
  }

  // Attach userId to request for downstream handlers
  req.userId = userId;
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
