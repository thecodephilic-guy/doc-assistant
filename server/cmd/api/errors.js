const { sendErrorResponse } = require("./helpers");
const CODE500 = "INTERNAL_SERVER_ERROR";
const CODE404 = "NOT_FOUND";
const CODE405 = "METHOD_NOT_ALLOWED";
const CODE400 = "BAD_REQUEST";
const CODE422 = "VALIDATION_ERROR";
const CODE409 = "EDIT_CONFLICT";
const CODE429 = "RATE_LIMIT_EXCEEDED";

const errorResponse = (res, status, message, code = "error") => {
  const envelope = {
    code,
    message,
  };

  sendErrorResponse(res, status, envelope);
};

module.exports = {
  serverErrorResponse: (res) => {
    const message =
      "the server encountered a problem and could not process your request";
    errorResponse(res, 500, message, CODE500);
  },

  notFoundResponse: (res) => {
    const message = "the requested resource could not be found";
    errorResponse(res, 404, message, CODE404);
  },

  methodNotAllowedResponse: (res, req) => {
    const message = `the ${req.method} method is not supported for this resource`;
    errorResponse(res, 405, message, CODE405);
  },

  badRequestResponse: (res, err) => {
    errorResponse(res, 400, err.message, CODE400);
  },

  /**
   * Sends a 422 Unprocessable Entity response.
   * Used for validation errors.
   */
  failedValidationResponse: (res, errors) => {
    errorResponse(res, 422, errors, CODE422);
  },

  /**
   * Sends a 409 Conflict response.
   */
  editConflictResponse: (res) => {
    const message =
      "unable to update the record due to an edit conflict, please try again";
    errorResponse(res, 409, message, CODE409);
  },

  /**
   * Sends a 429 Too Many Requests response.
   */
  rateLimitExceededResponse: (res) => {
    const message = "rate limit exceeded";
    errorResponse(res, 429, message, CODE429);
  },
};
