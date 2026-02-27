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
    originalName: text("originalName").notNull(),
    size: integer("size").default(0).notNull(),
    status: text("status").default("pending").notNull(),
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

// 3. Chats Table
// Stores chat sessions linked to documents
const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    userId: text("userId").notNull(),
    documentId: integer("documentId")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").default("New Chat").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("chat_user_id_idx").on(table.userId)
  ],
);

// 4. Messages Table
// Stores individual messages within a chat
const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    chatId: integer("chatId")
      .references(() => chats.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("msg_chat_id_idx").on(table.chatId)
  ],
);

module.exports = { documents, embeddings, chats, messages };
