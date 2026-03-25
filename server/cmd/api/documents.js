const documentModel = require("../../internal/data/documents");
const documentQueue = require("../../internal/jobs/QueueManager");
const { StatusCodes } = require("http-status-codes");
const path = require("path");
const fs = require("fs/promises");
const {
  serverErrorResponse,
  failedValidationResponse,
  notFoundResponse,
} = require("./errors");
const { sendSuccessResponse } = require("./helpers");
const Validator = require("../../internal/validators/validator");
const { Filters, calculateMetadata } = require("../../internal/data/filters");

/**
 * POST /v1/documents/upload
 * Handles PDF upload: validates, creates DB record, triggers async RAG processing.
 */
const uploadDocumentHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;

    const validator = new Validator();

    validator.check(file !== undefined, "file", "a document must be provided");

    if (file) {
      validator.check(
        file.mimetype === "application/pdf",
        "file",
        "must be a valid PDF document",
      );
      const MAX_SIZE_BYTES = 10 * 1024 * 1024;
      validator.check(
        file.size <= MAX_SIZE_BYTES,
        "file",
        "must not exceed 10MB",
      );
    }

    if (!validator.valid()) {
      // Delete the bad file from disk before returning the error!
      if (file) {
        await fs
          .unlink(file.path)
          .catch((err) => console.error("Cleanup failed:", err));
      }
      return failedValidationResponse(res, validator.errors);
    }

    const docData = {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };

    // 1. Create a pending document record in the database
    const doc = await documentModel.insert(userId, docData);

    // 2. Kick off RAG processing
    const filePath = path.resolve(file.path);

    await documentQueue.addDocumentJob({
      filePath: filePath,
      docId: doc.id,
      userId: userId,
    });

    console.log(
      `[Upload] Document ${doc.id} queued for background processing.`,
    );

    // 3. Respond immediately with the pending document
    const response = {
      document: {
        id: doc.id,
        name: doc.originalName,
        size: doc.size,
        status: doc.status,
        version: doc.version,
        createdAt: doc.createdAt,
      },
    };

    sendSuccessResponse(res, StatusCodes.ACCEPTED, response);
  } catch (err) {
    console.error("[Upload] Error:", err);
    // If the DB or Queue failed, clean up the orphaned file!
    if (req.file) {
      await fs
        .unlink(req.file.path)
        .catch((cleanupErr) =>
          console.error("Emergency cleanup failed:", cleanupErr),
        );
    }
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
    const { page, pageSize, sort = "-createdAt" } = req.query;

    const filters = new Filters(page, pageSize, sort, [
      "id",
      "createdAt",
      "originalName",
      "-id",
      "-createdAt",
      "-originalName",
    ]);

    const v = new Validator();
    filters.validate(v);

    if (!v.valid()) {
      return failedValidationResponse(res, v.errors);
    }
    const { docs, totalRecords } = await documentModel.getAllForUser(
      userId,
      filters,
    );

    // Map the DTOs for the presentation layer
    const documents = docs.map((doc) => ({
      id: String(doc.id),
      name: doc.originalName,
      size: doc.size,
      uploadedAt: doc.createdAt.toISOString(),
      status: doc.status === "indexed" ? "ready" : doc.status,
    }));

    const metadata = calculateMetadata(
      totalRecords,
      filters.page,
      filters.pageSize,
    );

    const response = {
      metadata,
      documents,
    };

    sendSuccessResponse(res, StatusCodes.OK, response);
  } catch (err) {
    console.error("[Documents] List error:", err);
    serverErrorResponse(res);
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

    const validator = new Validator();

    validator.check(
      !Number.isNaN(docId) && docId > 0,
      "id",
      "must be a valid positive integer",
    );

    if (!validator.valid()) {
      return failedValidationResponse(res, validator.errors);
    }

    const doc = await documentModel.getById(docId, userId);

    if (!doc) {
      return notFoundResponse(res, "document not found");
    }

    const response = {
      document: {
        id: String(doc.id),
        name: doc.originalName,
        size: doc.size,
        uploadedAt: doc.createdAt.toISOString(),
        status: doc.status === "indexed" ? "ready" : doc.status,
      },
    };

    sendSuccessResponse(res, StatusCodes.OK, response);
  } catch (err) {
    console.error("[Documents] Get error:", err);
    serverErrorResponse(res);
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

    const validator = new Validator();

    validator.check(
      !Number.isNaN(docId) && docId > 0,
      "id",
      "must be a valid positive integer",
    );

    if (!validator.valid()) {
      return failedValidationResponse(res, validator.errors);
    }

    const doc = await documentModel.getById(docId, userId);
    if (!doc) {
      return notFoundResponse(res, "document not found");
    }

    await documentModel.delete(docId, userId);

    sendSuccessResponse(res, StatusCodes.OK, {
      message: "document deleted successfully",
    });
  } catch (err) {
    console.error("[Documents] Delete error:", err);
    serverErrorResponse(res);
  }
};

module.exports = {
  uploadDocumentHandler,
  listDocumentsHandler,
  getDocumentHandler,
  deleteDocumentHandler,
};
