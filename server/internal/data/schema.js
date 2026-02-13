const {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  vector,
  index,
} = require("drizzle-orm/pg-core");

// 1. Documents Table
// Stores metadata and file status
const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    filename: text("filename").notNull(),
    url: text("url"),
    // Status Enum: pending -> uploaded -> indexed (or failed)
    status: text("status").default("pending").notNull(),
    // For Optimistic Locking
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    // CRITICAL: Index for multi-tenant queries
    index("user_id_idx").on(table.userId)
  ],
);

// 2. Embeddings Table
// Stores the vectors and text chunks
const embeddings = pgTable(
  "embeddings",
  {
    id: serial("id").primaryKey(),
    // Foreign Key to Documents
    documentId: integer("documentId")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    // The raw text chunk (for context retrieval)
    content: text("content").notNull(),

    // The Vector (768 dimensions for Gemini)
    // We use the HNSW index for fast similarity search
    embedding: vector("embedding", { dimensions: 768 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Create an HNSW index for fast cosine similarity search
    index("embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    )
  ],
);

module.exports = { documents, embeddings };
