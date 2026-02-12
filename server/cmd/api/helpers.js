const sendResponse = (res, status, data, headers = {}) => {
    // Set custom headers if provided
    for (const key in headers) {
        res.setHeader(key, headers[key]);
    }

    // Express handles JSON marshaling automatically
    res.status(status).json(data);
};

module.exports = {
    sendResponse,
}