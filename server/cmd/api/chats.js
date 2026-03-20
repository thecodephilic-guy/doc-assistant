const ChatModel = require('../../internal/data/chats');
const MessageModel = require('../../internal/data/messages');
const DocumentModel = require('../../internal/data/documents');
const ChatService = require('../../internal/services/chatService');

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

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'documentId is required' },
            });
        }

        const docId = parseInt(documentId, 10);

        // Verify the document exists and belongs to the user
        const doc = await DocumentModel.getById(docId, userId);
        if (!doc) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'document not found' },
            });
        }

        // Create the chat session
        const chat = await chatModel.insert(userId, docId);

        res.status(201).json({
            success: true,
            data: {
                chat: {
                    id: String(chat.id),
                    documentId: String(chat.documentId),
                    documentName: doc.originalName,
                    documentSize: doc.size,
                    createdAt: chat.createdAt.toISOString(),
                    updatedAt: chat.updatedAt.toISOString(),
                    messages: [],
                },
            },
        });
    } catch (err) {
        console.error('[Chats] Create error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'failed to create chat session' },
        });
    }
};

/**
 * GET /v1/chats
 * Lists all chat sessions for the authenticated user.
 */
const listChatsHandler = async (req, res) => {
    try {
        const userId = req.userId;
        const chatList = await chatModel.getAllForUser(userId);

        const chats = chatList.map((chat) => ({
            id: String(chat.id),
            documentId: String(chat.documentId),
            documentName: chat.documentName,
            documentSize: chat.documentSize,
            createdAt: chat.createdAt.toISOString(),
            updatedAt: chat.updatedAt.toISOString(),
        }));

        res.status(200).json({
            success: true,
            data: { chats },
        });
    } catch (err) {
        console.error('[Chats] List error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'failed to fetch chat sessions' },
        });
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

        if (isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'invalid chat ID' },
            });
        }

        const chat = await chatModel.getById(chatId, userId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'chat session not found' },
            });
        }

        // Load all messages for this chat
        const messageList = await messageModel.getAllForChat(chatId);
        const messages = messageList.map((msg) => ({
            id: String(msg.id),
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt.toISOString(),
        }));

        res.status(200).json({
            success: true,
            data: {
                chat: {
                    id: String(chat.id),
                    documentId: String(chat.documentId),
                    documentName: chat.documentName,
                    documentSize: chat.documentSize,
                    createdAt: chat.createdAt.toISOString(),
                    updatedAt: chat.updatedAt.toISOString(),
                    messages,
                },
            },
        });
    } catch (err) {
        console.error('[Chats] Get error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'failed to fetch chat session' },
        });
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

        if (isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'invalid chat ID' },
            });
        }

        await chatModel.delete(chatId, userId);

        res.status(200).json({
            success: true,
            data: { message: 'chat session deleted successfully' },
        });
    } catch (err) {
        console.error('[Chats] Delete error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'failed to delete chat session' },
        });
    }
};

/**
 * POST /v1/chats/:id/messages
 * Sends a user message, triggers RAG query, returns AI response.
 * This is the main RAG endpoint.
 */
const sendMessageHandler = async (req, res) => {
    try {
        const userId = req.userId;
        const chatId = parseInt(req.params.id, 10);
        const { message } = req.body;

        if (isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'invalid chat ID' },
            });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'BAD_REQUEST', message: 'message is required' },
            });
        }

        // 1. Verify chat exists and belongs to user
        const chat = await chatModel.getById(chatId, userId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'chat session not found' },
            });
        }

        // 2. Store the user's message
        await messageModel.insert(chatId, 'user', message.trim());

        // 3. Generate AI response using the RAG pipeline
        const aiResponse = await chatService.generateAnswer(
            message.trim(),
            chat.documentId
        );

        // 4. Store the AI response
        const aiMessage = await messageModel.insert(chatId, 'assistant', aiResponse);

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
        console.error('[Messages] Send error:', err);
        res.status(500).json({
            success: false,
            error: { code: 'SERVER_ERROR', message: 'failed to process message' },
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
