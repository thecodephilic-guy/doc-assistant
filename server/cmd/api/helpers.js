const sendSuccessResponse = (res, status, data = null, headers = {}) => {
    // Set custom headers if provided
    for (const key in headers) {
        res.setHeader(key, headers[key]);
    }
    const envelope = {
        success: true,
        data
    }

    // Express handles JSON marshaling automatically
    res.status(status).json(envelope);
};

const sendErrorResponse = (res, status, error = null, headers = {}) => {
     // Set custom headers if provided
    for (const key in headers) {
        res.setHeader(key, headers[key]);
    }
    const envelope = {
        success: false,
        error
    }

    res.status(status).json(envelope);
}
module.exports = {
    sendSuccessResponse,
    sendErrorResponse
}