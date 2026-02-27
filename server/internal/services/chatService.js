const { GoogleGenAI } = require('@google/genai');
const config = require('../../cmd/api/config');
const DocumentModel = require('../data/documents');
const RagProcessor = require('./ragProcessor');

class ChatService {
    constructor() {
        this.genAI = new GoogleGenAI({ apiKey: config.ai.apiKey });
        this.documentModel = new DocumentModel();
        this.ragProcessor = new RagProcessor();
    }

    /**
     * Core RAG method: Takes a user question, retrieves relevant context 
     * from the document, and generates an AI answer.
     * 
     * @param {string} question - The user's question
     * @param {number} documentId - The ID of the document to search
     * @returns {Promise<string>} - The AI-generated answer
     */
    async generateAnswer(question, documentId) {
        // 1. Embed the user's question
        const queryEmbedding = await this.ragProcessor.embedQuery(question);

        // 2. Search for relevant chunks via cosine similarity
        const relevantChunks = await this.documentModel.searchSimilar(
            queryEmbedding,
            documentId,
            5 // Top 5 most relevant chunks
        );

        // 3. Build context from retrieved chunks
        let context = '';
        if (relevantChunks.length > 0) {
            context = relevantChunks
                .map((chunk, i) => `[Section ${i + 1}]:\n${chunk.content}`)
                .join('\n\n');
        }

        // 4. Generate answer using Gemini with the retrieved context
        const answer = await this.callGemini(question, context);

        return answer;
    }

    /**
     * Calls Gemini to generate a contextual answer.
     * @param {string} question - The user's question
     * @param {string} context - Retrieved document context
     * @returns {Promise<string>} - The generated answer
     */
    async callGemini(question, context) {
        const systemPrompt = `You are a helpful document assistant. Your job is to answer questions based on the provided document context. 

Rules:
- Answer ONLY based on the provided context. If the context doesn't contain enough information to answer, say so clearly.
- Be concise but thorough in your answers.
- Use proper formatting with markdown when helpful (bullet points, bold text, etc).
- If you quote from the document, make it clear.
- Do not make up information that isn't in the context.`;

        const userPrompt = context
            ? `Context from the document:\n${context}\n\nQuestion: ${question}`
            : `No relevant context was found in the document for this question.\n\nQuestion: ${question}`;

        const response = await this.genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.3,
                maxOutputTokens: 1024,
            },
        });

        return response.text;
    }
}

module.exports = ChatService;
