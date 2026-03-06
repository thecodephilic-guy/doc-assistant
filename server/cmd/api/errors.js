const { sendErrorResponse } = require("./helpers");
const { StatusCodes, ReasonPhrases } = require('http-status-codes');

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
    errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, message, ReasonPhrases.INTERNAL_SERVER_ERROR);
  },

  notFoundResponse: (res) => {
    const message = "the requested resource could not be found";
    errorResponse(res, StatusCodes.NOT_FOUND, message, ReasonPhrases.NOT_FOUND);
  },

  methodNotAllowedResponse: (res, req) => {
    const message = `the ${req.method} method is not supported for this resource`;
    errorResponse(res, StatusCodes.METHOD_NOT_ALLOWED, message, ReasonPhrases.METHOD_NOT_ALLOWED);
  },

  badRequestResponse: (res, err) => {
    errorResponse(res, StatusCodes.BAD_REQUEST, err.message, ReasonPhrases.BAD_REQUEST);
  },

  /**
   * Sends a 422 Unprocessable Entity response.
   * Used for validation errors.
   */
  failedValidationResponse: (res, errors) => {
    errorResponse(res, StatusCodes.UNPROCESSABLE_ENTITY, errors, ReasonPhrases.UNPROCESSABLE_ENTITY);
  },

  /**
   * Sends a 409 Conflict response.
   */
  editConflictResponse: (res) => {
    const message =
      "unable to update the record due to an edit conflict, please try again";
    errorResponse(res, StatusCodes.CONFLICT, message, ReasonPhrases.CONFLICT);
  },

  /**
   * Sends a 429 Too Many Requests response.
   */
  rateLimitExceededResponse: (res) => {
    const message = "rate limit exceeded";
    errorResponse(res, StatusCodes.TOO_MANY_REQUESTS, message, ReasonPhrases.TOO_MANY_REQUESTS);
  },
};
