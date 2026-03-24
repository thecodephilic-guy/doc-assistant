const express = require('express')
const healthcheckHandler = require('./healthcheck');
const upload = require('../../internal/multer/pdfUpload');
const { requireAuth } = require('./middleware');
const {
    uploadDocumentHandler,
    listDocumentsHandler,
    getDocumentHandler,
    deleteDocumentHandler,
} = require('./documents');
const {
    createChatHandler,
    listChatsHandler,
    getChatHandler,
    deleteChatHandler,
    sendMessageHandler,
} = require('./chats');
const { notFoundResponse } = require('./errors');

const router = express.Router();

// --- Public Routes ---
router.get("/healthcheck", healthcheckHandler);

// --- Protected Routes (require Clerk auth) ---

// Documents
router.post("/documents/upload", requireAuth, upload.single('document'), uploadDocumentHandler);
router.get("/documents", requireAuth, listDocumentsHandler);
router.get("/documents/:id", requireAuth, getDocumentHandler);
router.delete("/documents/:id", requireAuth, deleteDocumentHandler);

// Chats
router.post("/chats",requireAuth, createChatHandler);
router.get("/chats", requireAuth, listChatsHandler);
router.get("/chats/:id", requireAuth, getChatHandler);
router.delete("/chats/:id", requireAuth, deleteChatHandler);

// Messages
router.post("/chats/:id/messages", sendMessageHandler);

//Custom not found error:
router.use((req, res) => {
    notFoundResponse(res);
})

module.exports = router