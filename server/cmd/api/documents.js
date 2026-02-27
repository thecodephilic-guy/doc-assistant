const DocumentModel = require("../../internal/data/documents");
const RagProcessor = require("../../internal/services/ragProcessor");
const path = require("path");
const { badRequestResponse, serverErrorResponse } = require("./errors");
const { sendSuccessResponse } = require("./helpers");

const documentModel = new DocumentModel();
const ragProcessor = new RagProcessor();

/**
 * POST /v1/documents/upload
 * Handles PDF upload: validates, creates DB record, triggers async RAG processing.
 */
const uploadDocumentHandler = async (req, res) => {
  try {
    if (!req.file) {
      badRequestResponse(res, new Error("please upload a PDF file"));
      return;
    }

    const userId = req.userId;

    // 1. Create a pending document record in the database
    const doc = await documentModel.insert(userId, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });

    // 2. Kick off RAG processing
    const filePath = path.resolve(req.file.path);
    const ragResponse = await ragProcessor.process(filePath, doc.id, userId).catch((err) => {
        console.error(`[Upload] Processing failed for doc ${doc.id}:`, err);
    });

    // 3. Respond immediately with the pending document
    const response = {
      id: doc.id,
      name: doc.originalName,
      size: doc.size,
      status: doc.status,
      version: doc.version,
      createdAt: doc.createdAt,
    };
    sendSuccessResponse(res, 201, response);
  } catch (err) {
    console.error("[Upload] Error:", err);
    serverErrorResponse(res);
  }
};

/**
 * GET /v1/documents
 * Lists all documents for the authenticated user.
 */
const listDocumentsHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const docs = await documentModel.getAllForUser(userId);

    const documents = docs.map((doc) => ({
      id: String(doc.id),
      name: doc.originalName,
      size: doc.size,
      uploadedAt: doc.createdAt.toISOString(),
      status: doc.status === "indexed" ? "ready" : doc.status,
    }));

    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (err) {
    console.error("[Documents] List error:", err);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "failed to fetch documents" },
    });
  }
};

/**
 * GET /v1/documents/:id
 * Gets a single document for the authenticated user.
 */
const getDocumentHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const docId = parseInt(req.params.id, 10);

    if (isNaN(docId)) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "invalid document ID" },
      });
    }

    const doc = await documentModel.getById(docId, userId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "document not found" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        document: {
          id: String(doc.id),
          name: doc.originalName,
          size: doc.size,
          uploadedAt: doc.createdAt.toISOString(),
          status: doc.status === "indexed" ? "ready" : doc.status,
        },
      },
    });
  } catch (err) {
    console.error("[Documents] Get error:", err);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "failed to fetch document" },
    });
  }
};

/**
 * DELETE /v1/documents/:id
 * Deletes a document for the authenticated user (cascades to embeddings).
 */
const deleteDocumentHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const docId = parseInt(req.params.id, 10);

    if (isNaN(docId)) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "invalid document ID" },
      });
    }

    await documentModel.delete(docId, userId);

    res.status(200).json({
      success: true,
      data: { message: "document deleted successfully" },
    });
  } catch (err) {
    console.error("[Documents] Delete error:", err);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "failed to delete document" },
    });
  }
};

module.exports = {
  uploadDocumentHandler,
  listDocumentsHandler,
  getDocumentHandler,
  deleteDocumentHandler,
};
