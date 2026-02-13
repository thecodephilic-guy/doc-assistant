const express = require('express')
const healthcheckHandler = require('./healthcheck');
const upload = require('../../internal/multer/pdfUpload');
const { uploadDocumentHandler } = require('./documents')

const router = express.Router();

router.get("/healthcheck", healthcheckHandler);
router.post("/documents/upload", upload.single('document'), uploadDocumentHandler);

module.exports = router