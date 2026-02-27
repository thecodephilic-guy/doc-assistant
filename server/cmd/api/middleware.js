const { getAuth } = require("@clerk/express");

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

module.exports = { requireAuth };
