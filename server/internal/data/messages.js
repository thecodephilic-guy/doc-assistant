const { eq, asc } = require('drizzle-orm');
const db = require('./db');
const { messages } = require('./schema');

class MessageModel {

    /**
     * Insert a single message into a chat.
     */
    async insert(chatId, role, content) {
        const result = await db.insert(messages)
            .values({
                chatId: chatId,
                role: role,
                content: content,
            })
            .returning();

        return result[0];
    }

    /**
     * Get all messages for a chat, ordered chronologically.
     */
    async getAllForChat(chatId) {
        return db.select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(asc(messages.createdAt));
    }
}

const messageModel = new MessageModel();

module.exports = messageModel;
