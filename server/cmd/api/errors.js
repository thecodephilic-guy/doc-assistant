const { sendResponse } = require('./helpers');

const logError = (req, err, logger) => {
    logger.error({
        err: err, // In Pino/JSON logs, this captures the stack trace
        request_method: req.method,
        request_url: req.originalUrl 
    }, err.message);
};

const errorResponse = (res, req, status, message) => {
    const envelope = { error: message };

    // In Node, writing to the response rarely fails (unlike Go), 
    // but we wrap it in a try-catch to be strictly equivalent.
    try {
        sendResponse(res, status, envelope);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    serverErrorResponse: (res, req) => {
        const message = 'the server encountered a problem and could not process your request';
        errorResponse(res, req, 500, message);
    },

    notFoundResponse: (res, req) => {
        const message = 'the requested resource could not be found';
        errorResponse(res, req, 404, message);
    },

    methodNotAllowedResponse: (res, req) => {
        const message = `the ${req.method} method is not supported for this resource`;
        errorResponse(res, req, 405, message);
    },

    badRequestResponse: (res, req, err) => {
        errorResponse(res, req, 400, err.message);
    },

    /**
     * Sends a 422 Unprocessable Entity response.
     * Used for validation errors.
     */
    failedValidationResponse: (res, req, errors) => {
        errorResponse(res, req, 422, errors);
    },

    /**
     * Sends a 409 Conflict response.
     */
    editConflictResponse: (res, req) => {
        const message = 'unable to update the record due to an edit conflict, please try again';
        errorResponse(res, req, 409, message);
    },

    /**
     * Sends a 429 Too Many Requests response.
     */
    rateLimitExceededResponse: (res, req) => {
        const message = 'rate limit exceeded';
        errorResponse(res, req, 429, message);
    }
}