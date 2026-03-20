const fs = require("fs");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const config = require("../../cmd/api/config");
const DocumentModel = require("../data/documents");

class RagProcessor {
  constructor() {
    // Initialize LangChain embeddings instance
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.ai.apiKey,
      model: config.ai.embeddingModel,
    });
    this.documentModel = DocumentModel
  }

  /**
   * Main entry point: Parses PDF, chunks text, generates embeddings, and saves to DB.
   * Called asynchronously after the upload response is sent.
   * @param {string} filePath - Path to the uploaded PDF file
   * @param {number} docId - The database ID of the document
   * @param {string} userId - The Clerk user ID (for ownership check on status update)
   */
  async process(filePath, docId, userId) {
    try {
      console.log(`[RAG] Starting processing for document ${docId}...`);

      // 1. Load and parse the PDF using LangChain
      const loader = new PDFLoader(filePath);
      const rawDocs = await loader.load(); // Returns an array of LangChain Document objects

      if (!rawDocs || rawDocs.length === 0) {
        throw new Error("PDF contains no extractable text");
      }

      console.log(`[RAG] Extracted ${rawDocs.length} pages from PDF`);

      // 2. Split text into manageable chunks using LangChain splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const chunkedDocs = await splitter.splitDocuments(rawDocs);
      console.log(`[RAG] Split into ${chunkedDocs.length} chunks`);

      // Map the LangChain document objects back to raw strings for embedding function
      const chunks = chunkedDocs.map((doc) => doc.pageContent);

      // 3. Generate embeddings for all chunks via LangChain
      const vectors = await this.generateEmbeddings(chunks);
      console.log(`[RAG] Generated ${vectors.length} embeddings`);

      if (!vectors || vectors.length === 0 || vectors[0].length === 0) {
        throw new Error(
          "Gemini API returned empty embeddings. Check your API key, model name, and quotas.",
        );
      }

      // 4. Bulk insert embeddings into database
      await this.documentModel.insertEmbeddings(docId, chunks, vectors);
      console.log(`[RAG] Stored embeddings in database`);

      // 5. Update document status to 'indexed'
      await this.documentModel.updateStatus(
        docId,
        userId,
        DocumentModel.STATUS.INDEXED,
      );
      console.log(`[RAG] Document ${docId} indexed successfully ✅`);

      // 6. Cleanup - delete the file iff indexed:
      try {
        // Check if the file actually exists before trying to delete it
        await fs.promises.access(filePath);
        await fs.promises.unlink(filePath);
        console.log(
          `[RAG] Successfully cleaned up temporary file: ${filePath}`,
        );
      } catch (cleanupErr) {
        // If the file was already gone or couldn't be deleted, just log it so it doesn't crash the worker
        console.error(
          `[RAG] Warning: Could not delete temporary file ${filePath}:`,
          cleanupErr.message,
        );
      }
    } catch (err) {
      console.error(`[RAG] Processing failed for document ${docId}:`, err);
      // Mark document as failed
      await this.documentModel.updateStatus(
        docId,
        userId,
        DocumentModel.STATUS.FAILED,
      );
    }
  }

  async generateEmbeddings(chunks) {
    const vectors = await this.embeddings.embedDocuments(chunks);
    //gemini-embedding-001 genereates vectors with dim -  3072 but db holds 768 so let's slice them

    return vectors.map((vector) => vector.slice(0, config.ai.vectorDim));
  }

  /**
   * Generates an embedding for a single query string.
   * Used for the retrieval step of RAG.
   * @param {string} query - The user's question
   * @returns {Promise<number[]>} - The embedding vector
   */
  async embedQuery(query) {
    const vector = await this.embeddings.embedQuery(query);

    // 🚨 FIX: We must also truncate the user's search query,
    // otherwise pgvector will crash trying to compare a 3072 query to a 768 database!

    return vector.slice(0, config.ai.vectorDim);
  }
}

module.exports = RagProcessor;
