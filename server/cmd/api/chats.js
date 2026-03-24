const ChatModel = require("../../internal/data/chats");
const MessageModel = require("../../internal/data/messages");
const DocumentModel = require("../../internal/data/documents");
const ChatService = require("../../internal/services/chatService");
const Validator = require("../../internal/validators/validator");
const { sendSuccessResponse } = require("./helpers");
const { StatusCodes } = require("http-status-codes");
const {
  serverErrorResponse,
  failedValidationResponse,
  notFoundResponse,
} = require("./errors");
const { Filters, calculateMetadata } = require("../../internal/data/filters");

const chatModel = new ChatModel();
const messageModel = new MessageModel();
const chatService = new ChatService();

/**
 * POST /v1/chats
 * Creates a new chat session linked to a document.
 */
const createChatHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { documentId } = req.body;

    const validator = new Validator();

    validator.check(documentId, "documentId", "documentId is requied");
    validator.check(
      !Number.isNaN(parseInt(documentId, 10)),
      "documentId",
      "documentId must be a valid integer",
    );

    if (!validator.valid()) {
      failedValidationResponse(res, validator.errors);
      return;
    }

    const docId = parseInt(documentId, 10);

    // Verify the document exists and belongs to the user
    const doc = await DocumentModel.getById(docId, userId);
    if (!doc) {
      notFoundResponse(res, "document not found");
      return;
    }

    // Create the chat session
    const chat = await chatModel.insert(userId, docId);

    const response = {
      chat: {
        id: String(chat.id),
        documentId: String(chat.documentId),
        documentName: doc.originalName,
        documentSize: doc.size,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        messages: [],
      },
    };

    sendSuccessResponse(res, StatusCodes.CREATED, response);
  } catch (err) {
    console.error("[Chats] Create error:", err);
    serverErrorResponse(res);
  }
};

/**
 * GET /v1/chats
 * Lists all chat sessions for the authenticated user.
 */
const listChatsHandler = async (req, res) => {
  try {
    const userId = "user_39SvjVBriV2rJWmc6R78VxWkQSh";
    const { page, pageSize, sort = "-updatedAt" } = req.query;

    const filters = new Filters(page, pageSize, sort, [
      "id",
      "updatedAt",
      "-id",
      "-updatedAt",
    ]);
    const validator = new Validator();

    filters.validate(validator);

    if (!validator.valid()) {
      return failedValidationResponse(res, validator.errors);
    }

    const { chatList, totalRecords } = await chatModel.getAllForUser(
      userId,
      filters,
    );

    //Why mapping? -> to convert the types for frontend (optimization required later)
    const chats = chatList.map((chat) => ({
      id: String(chat.id),
      documentId: String(chat.documentId),
      documentName: chat.documentName,
      documentSize: chat.documentSize,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));

    const metadata = calculateMetadata(
      totalRecords,
      filters.page,
      filters.pageSize,
    );

    const response = {
      metadata,
      chats,
    };

    sendSuccessResponse(res, StatusCodes.OK, response);
  } catch (err) {
    console.error("[Chats] List error:", err);
    serverErrorResponse(res);
  }
};

/**
 * GET /v1/chats/:id
 * Gets a single chat session with all its messages.
 */
const getChatHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const chatId = parseInt(req.params.id, 10);

    const validator = new Validator();

    validator.check(!Number.isNaN(chatId) && chatId > 0, "id", "must be a valid positive integer")

    if (!validator.valid()) {
      return failedValidationResponse(res, validator.errors)
    }

    const chat = await chatModel.getById(chatId, userId);
    if (!chat) {
      return notFoundResponse(res, "chat session not found");
    }

    // Load all messages for this chat
    const messageList = await messageModel.getAllForChat(chatId);

    const messages = messageList.map((msg) => ({
      id: String(msg.id),
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));

    const response = {
      chat: {
        id: String(chat.id),
          documentId: String(chat.documentId),
          documentName: chat.documentName,
          documentSize: chat.documentSize,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          messages,
      },
    }

    sendSuccessResponse(res, StatusCodes.OK, response);
  } catch (err) {
    console.error("[Chats] Get error:", err);
    serverErrorResponse(res);
  }
};

/**
 * DELETE /v1/chats/:id
 * Deletes a chat session and its messages.
 */
const deleteChatHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const chatId = parseInt(req.params.id, 10);
    
    const validator = new Validator();

    validator.check(!Number.isNaN(chatId) && chatId > 0, "id", "must be a valid positive integer");

    if(!validator.valid()){
      return failedValidationResponse(res, validator.errors);
    }

    const chat = await chatModel.getById(chatId, userId);
    if (!chat) {
      return notFoundResponse(res, "chat session not found");
    }

    await chatModel.delete(chatId, userId);

    sendSuccessResponse(res, StatusCodes.OK, { message: "chat session deleted successfully"});
  } catch (err) {
    console.error("[Chats] Delete error:", err);
    serverErrorResponse(res);
  }
};

/**
 * POST /v1/chats/:id/messages
 * Sends a user message, triggers RAG query, returns AI response.
 * This is the main RAG endpoint.
 */
const sendMessageHandler = async (req, res) => {
  try {
    const userId = "user_39SvjVBriV2rJWmc6R78VxWkQSh";
    const chatId = parseInt(req.params.id, 10);
    const { message } = req.body;

    const validator = new Validator();

    validator.check(!Number.isNaN(chatId) && chatId > 0, "id", "must be a valid positive integer");
    validator.check(message, "message", "message is required");
    // validator.check(message.trim().length !== 0, "message", "must not be empty");

    if(!validator.valid()){
      return failedValidationResponse(res, validator.errors);
    }

    // 1. Verify chat exists and belongs to user
    const chat = await chatModel.getById(chatId, userId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "chat session not found" },
      });
    }

    // 2. Store the user's message
    await messageModel.insert(chatId, "user", message.trim());

    // 3. Generate AI response using the RAG pipeline
    const aiResponse = await chatService.generateAnswer(
      message.trim(),
      chat.documentId,
    );

    // 4. Store the AI response
    const aiMessage = await messageModel.insert(
      chatId,
      "assistant",
      aiResponse,
    );

    // 5. Touch the chat to update its timestamp
    await chatModel.touch(chatId);

    // 6. Return the AI message
    res.status(200).json({
      success: true,
      data: {
        message: {
          id: String(aiMessage.id),
          role: aiMessage.role,
          content: aiMessage.content,
          timestamp: aiMessage.createdAt.toISOString(),
        },
      },
    });
  } catch (err) {
    console.error("[Messages] Send error:", err);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "failed to process message" },
    });
  }
};

module.exports = {
  createChatHandler,
  listChatsHandler,
  getChatHandler,
  deleteChatHandler,
  sendMessageHandler,
};
