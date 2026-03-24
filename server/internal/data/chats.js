const { eq, and, desc, asc, count } = require('drizzle-orm');
const db = require('./db');
const { chats, documents } = require('./schema');

class ChatModel {

    /**
     * Creates a new chat session for a user and document.
     */
    async insert(userId, documentId) {
        const result = await db.insert(chats)
            .values({
                userId: userId,
                documentId: documentId,
            })
            .returning();

        return result[0];
    }

    /**
     * Get all chat sessions for a specific user, with document info.
     */
    async getAllForUser(userId, filters) {        
        //Determine sort direction:
        const direction = filters.sortDirection() === 'DESC' ? desc : asc;
        const sortCol = chats[filters.sortColumn()];

        const result = await db
            .select({
                id: chats.id,
                userId: chats.userId,
                documentId: chats.documentId,
                title: chats.title,
                createdAt: chats.createdAt,
                updatedAt: chats.updatedAt,
                documentName: documents.originalName,
                documentSize: documents.size,
            })
            .from(chats)
            .leftJoin(documents, eq(chats.documentId, documents.id))
            .where(eq(chats.userId, userId))
            .orderBy(direction(sortCol))
            .limit(filters.limit())
            .offset(filters.offset());

        const countResult = await db.select({value: count()}).from(chats).where(eq(chats.userId, userId));
        const totalRecords = countResult[0].value;

        const responseData = {
            chatList: result,
            totalRecords
        }

        return responseData;
    }

    /**
     * Get a single chat by ID (must belong to the user).
     */
    async getById(chatId, userId) {
        const result = await db
            .select({
                id: chats.id,
                userId: chats.userId,
                documentId: chats.documentId,
                title: chats.title,
                createdAt: chats.createdAt,
                updatedAt: chats.updatedAt,
                documentName: documents.originalName,
                documentSize: documents.size,
            })
            .from(chats)
            .leftJoin(documents, eq(chats.documentId, documents.id))
            .where(
                and(
                    eq(chats.id, chatId),
                    eq(chats.userId, userId)
                )
            );

        return result[0] || null;
    }

    /**
     * Update the updatedAt timestamp (called when new messages arrive).
     */
    async touch(chatId) {
        return db.update(chats)
            .set({ updatedAt: new Date() })
            .where(eq(chats.id, chatId));
    }

    /**
     * Delete a chat session (cascades to messages).
     */
    async delete(chatId, userId) {
        return db.delete(chats)
            .where(
                and(
                    eq(chats.id, chatId),
                    eq(chats.userId, userId)
                )
            );
    }
}

module.exports = ChatModel;
