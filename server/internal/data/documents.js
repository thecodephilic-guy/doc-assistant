const { eq, sql, and, desc, cosineDistance, gt } = require('drizzle-orm');
const db = require('./db');
const { documents, embeddings } = require('./schema');

class DocumentModel {
    
    static STATUS = {
        PENDING: 'pending',
        INDEXED: 'indexed',
        FAILED: 'failed',
    };

    /**
     * Creates a PENDING record for a specific user.
     */
    async insert(userId, docData) {
        const result = await db.insert(documents)
            .values({
                userId: userId,
                filename: docData.filename,
                originalName: docData.originalName,
                size: docData.size,
                status: DocumentModel.STATUS.PENDING
            })
            .returning();
            
        return result[0];
    }

    /**
     * Get a single document by ID (must belong to the user).
     */
    async getById(docId, userId) {
        const result = await db.select()
            .from(documents)
            .where(
                and(
                    eq(documents.id, docId),
                    eq(documents.userId, userId)
                )
            );

        return result[0] || null;
    }

    /**
     * Updates status/url.
     * We strictly check userId here too for extra security (ownership check).
     */
    async updateStatus(id, userId, status, url = null) {
        return db.update(documents)
            .set({ 
                status: status, 
                url: url,
                version: sql`${documents.version} + 1`
            })
            .where(
                and(
                    eq(documents.id, id),
                    eq(documents.userId, userId)
                )
            );
    }

    /**
     * Bulk insert vectors.
     */
    async insertEmbeddings(docId, chunks, vectors) {
        const rows = chunks.map((chunk, i) => ({
            documentId: docId,
            content: chunk,
            embedding: vectors[i]
        }));
        
        // Drizzle handles bulk insert efficiently
        return db.insert(embeddings).values(rows);
    }

    /**
     * Get all documents for a specific user (for Dashboard).
     */
    async getAllForUser(userId) {
        return db.select()
            .from(documents)
            .where(eq(documents.userId, userId))
            .orderBy(desc(documents.createdAt));
    }

    /**
     * Delete a document (cascades to embeddings).
     */
    async delete(docId, userId) {
        return db.delete(documents)
            .where(
                and(
                    eq(documents.id, docId),
                    eq(documents.userId, userId)
                )
            );
    }

    /**
     * Search for similar content using cosine similarity.
     * Returns the top-K most relevant text chunks for a given document.
     */
    async searchSimilar(queryEmbedding, documentId, limit = 5) {
        const similarity = sql`1 - (${cosineDistance(embeddings.embedding, queryEmbedding)})`;

        const results = await db
            .select({
                id: embeddings.id,
                content: embeddings.content,
                similarity: similarity,
            })
            .from(embeddings)
            .where(
                and(
                    eq(embeddings.documentId, documentId),
                    gt(similarity, 0.3) // Minimum similarity threshold
                )
            )
            .orderBy(sql`${similarity} DESC`)
            .limit(limit);

        return results;
    }
}

// Export a singleton object
const documentModel = new DocumentModel();
documentModel.STATUS = DocumentModel.STATUS;

module.exports = documentModel;