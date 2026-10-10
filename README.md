# Doc-Assistant

> **Production-ready, multi-tenant Retrieval-Augmented Generation (RAG) platform for intelligent querying, semantic search, and contextual conversations over PDF documents.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2-lightgrey?logo=express&logoColor=black)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20(pgvector)-4169e1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.70-orange?logo=redis&logoColor=white)](https://docs.bullmq.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%203%20Flash-4285f4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [End-to-End System Workflows](#end-to-end-system-workflows)
  - [1. Document Ingestion \& Async Vectorization Pipeline](#1-document-ingestion--async-vectorization-pipeline)
  - [2. Conversational RAG Query Pipeline](#2-conversational-rag-query-pipeline)
  - [3. Chat Session Lifecycle \& Cascading Deletion](#3-chat-session-lifecycle--cascading-deletion)
- [Backend Architecture Deep-Dive](#backend-architecture-deep-dive)
  - [Application Bootstrap \& Lifecycle (`cmd/api/index.js`)](#application-bootstrap--lifecycle-cmdapiindexjs)
  - [Middlewares Architecture \& Execution Chain](#middlewares-architecture--execution-chain)
  - [Configuration Management (`cmd/api/config.js`)](#configuration-management-cmdapiconfigjs)
  - [Data Layer \& Database Schema (`internal/data/schema.js`)](#data-layer--database-schema-internaldataschemajs)
  - [Vector Search \& Embeddings (`internal/services/ragProcessor.js`)](#vector-search--embeddings-internalservicesragprocessorjs)
  - [Conversational Service (`internal/services/chatService.js`)](#conversational-service-internalserviceschatservicejs)
  - [Background Job Queue (`internal/jobs/`)](#background-job-queue-internaljobs)
  - [Validation, Pagination, \& Filtering (`internal/data/filters.js`)](#validation-pagination--filtering-internaldatafiltersjs)
  - [Standardized API Response \& Error Contract](#standardized-api-response--error-contract)
- [Frontend Architecture Overview](#frontend-architecture-overview)
- [Complete REST API Reference](#complete-rest-api-reference)
- [Environment Variables](#environment-variables)
- [Troubleshooting: Redis ENOTFOUND Error](#troubleshooting-redis-enotfound-error)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)

---

## Overview

**Doc-Assistant** enables users to upload PDF archives, automatically index their contents into a vector database using state-of-the-art embedding models, and interact with documents conversationally using large language models. The system guarantees high precision and zero hallucination by strictly grounding responses in retrieved document excerpts.

### Key Capabilities
- **Non-blocking Document Ingestion**: Uploads are accepted immediately (HTTP `202 Accepted`), written to disk, and dispatched to an asynchronous Redis-backed queue (`BullMQ`) for chunking, embedding generation, and vector indexing.
- **pgvector Cosine Similarity Search**: Text chunks and high-dimensional vectors are stored in PostgreSQL via Neon and indexed with Hierarchical Navigable Small World (`HNSW`) indexes for millisecond nearest-neighbor lookups.
- **Context-Grounded Answers**: Questions are vectorized on-the-fly, compared against document embeddings using cosine similarity, filtered by relevance threshold (`> 0.3`), and synthesized using Google Gemini (`gemini-3-flash-preview`).
- **Multi-Tenant Security**: Every document, chat session, message, and vector is strictly partitioned by Clerk User ID (`req.userId`) at the middleware, controller, and query levels.
- **Dual Rate Limiting**: Separate, configurable token bucket limiters protect general API routes and high-cost PDF upload routes.
- **Production Infrastructure**: Ready for deployment with Caddy reverse proxy (auto-HTTPS), systemd service supervisor, and automated rsync deployment scripts.

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client ["Client Layer (Next.js 16 + React 19)"]
        UI[User Interface / Radix UI]
        Dropzone[PDF Upload + pdf-lib Encryption Check]
        AxiosInterceptor[Axios Client + Clerk Token Injection]
    end

    subgraph Gateway ["Reverse Proxy & Web Server"]
        Caddy[Caddy Reverse Proxy :80/:443]
    end

    subgraph Backend ["Backend API Server (Express.js 5 - Port 4001)"]
        direction TB
        subgraph Middlewares ["Middleware Pipeline"]
            TrustProxy["app.set('trust proxy', 1)"]
            JSON["express.json()"]
            GlobalLimit["globalRateLimiter (50 req/min)"]
            CORS["cors()"]
            ClerkAuth["clerkMiddleware() + requireAuth()"]
            UploadLimit["uploadRateLimiter (5 req/min)"]
            Multer["Multer DiskStorage (10MB, UUID)"]
        end

        subgraph Controllers ["Controllers / Handlers"]
            DocController["documents.js (Upload, List, Get, Delete)"]
            ChatController["chats.js (Create, List, Message, Delete)"]
            HealthController["healthcheck.js"]
        end

        subgraph Services ["Core Services"]
            RagProc["RagProcessor (LangChain + Gemini)"]
            ChatServ["ChatService (Vector Retrieval + Gemini)"]
        end
    end

    subgraph AsyncQueue ["Async Worker Pipeline (BullMQ + Redis)"]
        QueueMgr["QueueManager ('document-processing')"]
        Redis[(Redis Queue / Upstash)]
        DocWorker["DocumentWorker (Concurrency: 3)"]
    end

    subgraph Database ["Persistence Layer (PostgreSQL Neon)"]
        DocTable[(documents Table)]
        EmbedTable[(embeddings Table + HNSW vector 768)]
        ChatTable[(chats Table)]
        MsgTable[(messages Table)]
    end

    subgraph External ["External Services"]
        ClerkSvc["Clerk Authentication"]
        GeminiEmbed["Google Gemini Embeddings (gemini-embedding-001)"]
        GeminiLLM["Google Gemini Model (gemini-3-flash-preview)"]
    end

    %% Connections
    UI --> Dropzone
    Dropzone --> AxiosInterceptor
    AxiosInterceptor --> Caddy
    Caddy --> TrustProxy
    TrustProxy --> JSON --> GlobalLimit --> CORS --> ClerkAuth
    ClerkAuth -.-> ClerkSvc
    ClerkAuth --> Controllers

    DocController --> Multer
    DocController --> DocTable
    DocController --> QueueMgr
    QueueMgr --> Redis
    Redis --> DocWorker
    DocWorker --> RagProc
    RagProc --> GeminiEmbed
    RagProc --> EmbedTable
    RagProc --> DocTable

    ChatController --> ChatServ
    ChatController --> ChatTable
    ChatController --> MsgTable
    ChatServ --> GeminiEmbed
    ChatServ --> EmbedTable
    ChatServ --> GeminiLLM
```

---

## End-to-End System Workflows

### 1. Document Ingestion & Async Vectorization Pipeline

When a user selects a PDF file to upload, the system processes it through a resilient, decoupled asynchronous pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Next.js Client
    participant API as Express API Server
    participant Multer as Multer Storage
    participant DB as Neon Database
    participant Queue as BullMQ / Redis
    participant Worker as DocumentWorker
    participant LangChain as LangChain & Gemini

    User->>Client: Drag & Drop PDF
    Client->>Client: Validate with pdf-lib (check password encryption)
    Client->>API: POST /v1/documents/upload (Bearer JWT, multipart/form-data)
    Note over API: Middlewares: RateLimit -> requireAuth -> Multer
    API->>Multer: Stream file to ./uploads (UUID prefix)
    API->>API: Validator check (PDF mimetype, size <= 10MB)
    API->>DB: INSERT INTO documents (userId, status='pending')
    DB-->>API: Returns document record (id: docId)
    API->>Queue: addDocumentJob({ filePath, docId, userId })
    API-->>Client: HTTP 202 Accepted (Document metadata, status='pending')

    Note over Worker,Queue: Async processing decoupled from HTTP request
    Queue->>Worker: Job picked up by DocumentWorker (concurrency: 3)
    Worker->>LangChain: PDFLoader(filePath).load()
    LangChain-->>Worker: Raw extracted page contents
    Worker->>LangChain: RecursiveCharacterTextSplitter (chunk: 1000, overlap: 200)
    LangChain-->>Worker: Text chunks array
    Worker->>LangChain: GoogleGenerativeAIEmbeddings.embedDocuments(chunks)
    LangChain-->>Worker: 3072-dim embeddings
    Worker->>Worker: Truncate vectors to 768 dimensions (matches DB schema)
    Worker->>DB: INSERT INTO embeddings (documentId, content, embedding)
    Worker->>DB: UPDATE documents SET status='indexed', version=version+1
    Worker->>Worker: fs.unlink(filePath) [Cleanup temporary upload]
    Worker-->>Queue: Job completed successfully
```

#### Detailed Ingestion Steps:
1. **Client-Side Pre-flight Inspection**: In `upload-modal.tsx`, before dispatching the HTTP request, the client reads the file using `pdf-lib`. If the PDF is password-encrypted, it halts immediately with a clear error prompt rather than sending unprocessable bytes to the server.
2. **HTTP Ingestion & Multer Handling**: The file hits `/v1/documents/upload`. `multer` assigns a UUID filename (`uuidv4() + "-" + file.originalname`) and streams it to `./uploads`.
3. **Validation & Atomic Cleanup**: `Validator` confirms the file exists, has MIME type `application/pdf`, and does not exceed 10 MB. If validation fails, `fs.unlink()` is immediately invoked on the uploaded file before returning HTTP `422 Unprocessable Entity`.
4. **Immediate Pending Response**: A row is inserted into the `documents` table with `status = 'pending'`. The job is pushed to the BullMQ queue `document-processing`. The API immediately returns HTTP `202 Accepted` to the client.
5. **Background Worker Execution**:
   - `DocumentWorker` picks up the job payload (`filePath`, `docId`, `userId`).
   - `PDFLoader` extracts text from each page.
   - `RecursiveCharacterTextSplitter` segments the text into chunks of 1,000 characters with a 200-character overlap to preserve semantic context across chunk boundaries.
   - `GoogleGenerativeAIEmbeddings` generates vectors. Gemini generates 3072-dimension vectors; `RagProcessor` slices them to 768 dimensions (`vector.slice(0, 768)`) to fit the pgvector column definition.
   - Embeddings and raw text chunks are bulk-inserted into the `embeddings` table.
   - The document status is updated to `indexed`.
   - The local PDF file in `./uploads` is safely deleted via `fs.promises.unlink()`. If processing fails at any stage, the status is updated to `failed`.

---

### 2. Conversational RAG Query Pipeline

When a user asks a question about an indexed document:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Next.js Client
    participant API as Express API Server
    participant DB as Neon Database (pgvector)
    participant Gemini as Google Gemini AI

    User->>Client: Types question & hits Enter
    Client->>Client: Optimistically renders user message
    Client->>API: POST /v1/chats/:id/messages { message: "..." }
    Note over API: Middlewares: globalRateLimiter -> requireAuth
    API->>API: Validator check (chatId, message <= 4000 chars)
    API->>DB: Query chat by (chatId, userId) [Ownership Check]
    DB-->>API: Chat session & documentId
    API->>DB: INSERT INTO messages (chatId, role='user', content)
    
    Note over API,Gemini: RAG Retrieval & Generation Phase
    API->>Gemini: Embed question via GoogleGenerativeAIEmbeddings
    Gemini-->>API: 768-dim query vector
    API->>DB: Cosine similarity query on embeddings table (docId, similarity > 0.3, LIMIT 5)
    DB-->>API: Top 5 relevant text chunks
    API->>Gemini: generateContent(model='gemini-3-flash-preview', systemInstruction, context, question)
    Gemini-->>API: Grounded contextual answer
    
    API->>DB: INSERT INTO messages (chatId, role='assistant', content)
    API->>DB: UPDATE chats SET updatedAt=NOW() [Touch session]
    API-->>Client: HTTP 201 Created { message: { role: 'assistant', content: '...' } }
    Client->>User: Renders assistant reply with Markdown formatting
```

#### Detailed Query Steps:
1. **Ownership & Session Validation**: `chats.js` verifies that the `chatId` exists and belongs to the authenticated `req.userId`.
2. **User Message Persistence**: The incoming message is written to the `messages` table with `role: "user"`.
3. **Query Vectorization**: In `ChatService.generateAnswer()`, the user's question is passed to `RagProcessor.embedQuery()`, producing a 768-dimensional vector.
4. **Vector Similarity Search (pgvector HNSW)**:
   The database executes a cosine distance calculation:
   ```sql
   SELECT id, content, (1 - (embedding <=> $queryEmbedding)) AS similarity
   FROM embeddings
   WHERE documentId = $documentId AND (1 - (embedding <=> $queryEmbedding)) > 0.3
   ORDER BY similarity DESC
   LIMIT 5;
   ```
   Only chunks above the `0.3` threshold are retrieved.
5. **Prompt Synthesis & LLM Grounding**: The retrieved chunks are assembled into a structured prompt:
   ```
   [Section 1]:
   ...chunk 1 content...

   [Section 2]:
   ...chunk 2 content...
   ```
   A system prompt strictly constrains Gemini:
   > *"Answer ONLY based on the provided context. If the context doesn't contain enough information to answer, say so clearly. Do not make up information that isn't in the context."*
6. **Persistence & Return**: The response from `gemini-3-flash-preview` is saved to `messages` with `role: "assistant"`, the chat's `updatedAt` timestamp is updated, and the response is returned to the client.

---

### 3. Chat Session Lifecycle & Cascading Deletion

- **Creating a Session (`POST /v1/chats`)**: Verifies that the requested `documentId` belongs to `req.userId`, then creates a new session in `chats`.
- **Listing Sessions (`GET /v1/chats`)**: Retrieves all user chats, Left-Joined with the `documents` table to include the document's original name and size.
- **Cascading Deletions**:
  - Deleting a document (`DELETE /v1/documents/:id`) cascades to its associated `embeddings` and all `chats` linked to that document.
  - Deleting a chat (`DELETE /v1/chats/:id`) cascades to all `messages` in that session.

---

## Backend Architecture Deep-Dive

The backend follows clean architecture principles, separating the HTTP transport layer, middleware validations, business domain services, and database persistence models.

```
server/
├── cmd/
│   └── api/
│       ├── index.js          # Server entrypoint, database probe, worker bootstrap, graceful shutdown
│       ├── config.js         # Immutable hierarchical configuration (CLI flags, env vars, defaults)
│       ├── routes.js         # Route declarations & middleware bindings
│       ├── middleware.js     # Auth & Rate Limiting middlewares
│       ├── documents.js      # Document handlers (upload, list, get, status, delete)
│       ├── chats.js          # Chat & Message handlers
│       ├── healthcheck.js    # System healthcheck endpoint
│       ├── helpers.js        # Standardized JSON response envelopes
│       └── errors.js         # HTTP error response builders
├── internal/
│   ├── data/
│   │   ├── schema.js         # Drizzle PostgreSQL schema definitions (pgvector, tables, indexes)
│   │   ├── db.js             # Neon serverless database connection & Drizzle client
│   │   ├── documents.js      # Document data access model & pgvector search query
│   │   ├── chats.js          # Chat data access model
│   │   ├── messages.js       # Message data access model
│   │   └── filters.js        # Pagination, sort safelisting, & metadata calculator
│   ├── jobs/
│   │   ├── QueueManager.js   # BullMQ Queue singleton with exponential backoff configuration
│   │   └── DocumentWorker.js # BullMQ Worker singleton for async PDF processing
│   ├── multer/
│   │   └── pdfUpload.js      # Multer disk storage, UUID naming, & PDF mimetype filter
│   ├── services/
│   │   ├── ragProcessor.js   # LangChain PDF parsing, chunking, and embedding generation
│   │   └── chatService.js    # Vector retrieval & Gemini LLM completion service
│   └── validators/
│       └── validator.js      # Validation utility class for request sanitization
├── migrations/               # Drizzle database migration files
├── remote/                   # Deployment assets (Caddyfile, systemd service, setup scripts)
└── uploads/                  # Temporary staging directory for uploaded PDFs
```

---

### Application Bootstrap & Lifecycle (`cmd/api/index.js`)

When the server starts:
1. **Proxy Trust**: `app.set("trust proxy", 1)` configures Express to trust the reverse proxy (Caddy). This ensures `req.ip` reflects the actual client's IP rather than `127.0.0.1`, which is vital for IP-based rate limiting.
2. **Database Probe**: Before binding to the network port, `db.execute(sql\`SELECT 1\`)` executes. If the database connection fails, the process exits with status code `1` immediately rather than starting in an unstable state.
3. **Worker Startup**: `documentWorker.start()` initializes the BullMQ worker instance to listen for document processing jobs.
4. **Graceful Shutdown**: Handlers for `SIGINT` and `SIGTERM` stop accepting new HTTP connections, close the BullMQ `Queue` and `Worker` connections cleanly, and exit gracefully.

---

### Middlewares Architecture & Execution Chain

Every incoming request passes through an orderly chain of middlewares:

```mermaid
graph TD
    Req[Incoming HTTP Request] --> TrustProxy["app.set('trust proxy', 1)"]
    TrustProxy --> JSON["express.json()"]
    JSON --> GlobalRate["globalRateLimiter<br/><i>50 req/min window per IP</i>"]
    GlobalRate --> CORS["cors()<br/><i>Cross-Origin Resource Sharing</i>"]
    CORS --> Clerk["clerkMiddleware()<br/><i>Extracts Clerk Session / JWT</i>"]
    Clerk --> StaticRoute{"Path: /uploads/* ?"}
    StaticRoute -- Yes --> StaticServe["express.static(config.uploadDir)"]
    StaticRoute -- No --> V1Routes["/v1 Router"]

    subgraph "Protected Endpoint (e.g. /v1/documents/upload)"
        V1Routes --> ReqAuth["requireAuth<br/><i>Validates getAuth(req).userId</i>"]
        ReqAuth --> UploadRate["uploadRateLimiter<br/><i>5 req/min window per IP</i>"]
        UploadRate --> Multer["Multer pdfUpload<br/><i>Validates PDF MIME & <= 10MB</i>"]
        Multer --> Handler["uploadDocumentHandler"]
    end
```

#### Middleware Specifications

| Middleware | File | Purpose | Configuration / Details |
| :--- | :--- | :--- | :--- |
| `trust proxy` | `index.js:14` | Client IP Resolution | Sets proxy hop depth to `1` so rate limiters see actual client IP behind Caddy. |
| `express.json()` | `index.js:17` | Body Parsing | Parses JSON request bodies into `req.body`. |
| `globalRateLimiter` | `middleware.js:45` | Denial-of-Service Protection | 50 requests per 1-minute window per IP. Uses IPv6 `/56` subnetting. Exceeding returns `429 Too Many Requests`. |
| `cors()` | `index.js:19` | Cross-Origin Access | Enables cross-origin requests from the Next.js frontend. |
| `clerkMiddleware()` | `index.js:20` | Auth Context Resolution | Extracts Bearer tokens / session cookies and binds auth context to the request. |
| `express.static` | `index.js:23` | Static File Access | Exposes `/uploads` directory using an absolute path computed in `config.js`. |
| `requireAuth` | `middleware.js:27` | Route Authorization Guard | Verifies `isAuthenticated` and `userId` via `@clerk/express`. Injects `req.userId`. Returns `401 Unauthorized` if invalid. |
| `uploadRateLimiter` | `middleware.js:54` | Expensive Resource Guard | Restricts file uploads to 5 requests per 1-minute window per IP to prevent storage/compute exhaustion. |
| `upload.single('document')` | `internal/multer/pdfUpload.js` | File Upload Handling | Enforces 10MB max size, checks `application/pdf` MIME type, stores files on disk with a UUID prefix (`uuidv4()`). |
| Custom 404 Handler | `routes.js:45` | Catch-All Route | Intercepts undefined routes under `/v1/*` and returns a standardized `{ success: false, error: ... }` response. |

---

### Configuration Management (`cmd/api/config.js`)

Configurations follow a deterministic precedence hierarchy:
$$\text{CLI Flags} \longrightarrow \text{Environment Variables (.env)} \longrightarrow \text{Sensible Defaults}$$

```javascript
// Example hierarchy resolution helper:
const getEnvVar = (flag, envName, defaultVal) => {
  if (flag) return flag;
  if (process.env[envName]) return process.env[envName];
  if (defaultVal !== undefined) return defaultVal;
  throw new Error(`${envName} is missing in .env or flags`);
};
```
The entire configuration object is frozen using `Object.freeze()` before export, preventing accidental runtime mutations.

---

### Data Layer & Database Schema (`internal/data/schema.js`)

The database uses PostgreSQL on Neon, leveraging the **`pgvector`** extension for vector similarity search.

```mermaid
erDiagram
    documents ||--o{ embeddings : "has cascade"
    documents ||--o{ chats : "has cascade"
    chats ||--o{ messages : "has cascade"

    documents {
        serial id PK
        text userId "Indexed"
        text filename
        text originalName
        integer size
        text status "pending | indexed | failed"
        integer version
        timestamp createdAt
    }

    embeddings {
        serial id PK
        integer documentId FK
        text content
        vector embedding "768 dimensions (HNSW index)"
        timestamp created_at
    }

    chats {
        serial id PK
        text userId "Indexed"
        integer documentId FK
        text title
        timestamp createdAt
        timestamp updatedAt
    }

    messages {
        serial id PK
        integer chatId FK "Indexed"
        text role "user | assistant"
        text content
        timestamp createdAt
    }
```

#### Key Schema Highlights:
- **Multi-Tenant Indexing**: `documents` and `chats` contain indexes on `userId` (`user_id_idx`, `chat_user_id_idx`) to ensure instant multi-tenant filtering.
- **HNSW Vector Indexing**: `embeddings.embedding` uses an HNSW index using cosine distance:
  ```javascript
  index("embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops"))
  ```
  HNSW (Hierarchical Navigable Small World) provides sub-linear nearest neighbor retrieval, significantly outperforming flat vector scans.
- **Foreign Key Cascades**: When a `document` is deleted, its `embeddings` and associated `chats` are deleted automatically by PostgreSQL engine triggers.

---

### Vector Search & Embeddings (`internal/services/ragProcessor.js`)

1. **Chunking Strategy**: Uses LangChain's `RecursiveCharacterTextSplitter` with `chunkSize: 1000` and `chunkOverlap: 200`. This ensures paragraphs and sentences remain intact while overlapping boundaries prevent context loss between chunks.
2. **Dimension Matching Fix**: Google's `gemini-embedding-001` generates 3072-dimensional vectors. The database column is defined with 768 dimensions. `RagProcessor` slices all embeddings (both for documents and for search queries) to 768 elements:
   ```javascript
   vectors.map((vector) => vector.slice(0, config.ai.vectorDim));
   ```
   This maintains dimensional consistency and prevents pgvector mismatch crashes.

---

### Conversational Service (`internal/services/chatService.js`)

`ChatService` orchestrates the Retrieval-Augmented Generation query cycle:
1. Embeds the user question via `embedQuery`.
2. Searches for similar content using Drizzle's `cosineDistance`:
   ```javascript
   const similarity = sql`1 - (${cosineDistance(embeddings.embedding, queryEmbedding)})`;
   ```
3. Constructs a structured prompt incorporating sections with a minimum similarity threshold of `0.3`.
4. Dispatches the prompt to Google Gemini (`gemini-3-flash-preview`) with strict system constraints (`temperature: 0.3`, `maxOutputTokens: 1024`).

---

### Background Job Queue (`internal/jobs/`)

- **`QueueManager.js`**: Instantiates a BullMQ `Queue` instance (`document-processing`) configured with exponential retry backoff:
  ```javascript
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
  ```
- **`DocumentWorker.js`**: Initializes a BullMQ `Worker` running with `concurrency: 3`. It listens on the queue, processes jobs asynchronously, and manages event listeners for `failed` and `error` events.

---

### Validation, Pagination, & Filtering (`internal/data/filters.js`)

All list endpoints (`/v1/documents`, `/v1/chats`) support standardized pagination and sorting via the `Filters` utility:
- **Pagination**: Supports `page` (default 1) and `pageSize` (default 20, max 100).
- **Sort Direction**: Prefixing a sort column with `-` (e.g. `-createdAt`) indicates descending order (`DESC`).
- **Safelist Protection**: Only explicitly safelisted columns are accepted, mitigating SQL injection risks in ordering clauses.
- **Metadata**: Returns a `metadata` envelope containing `currentPage`, `pageSize`, `firstPage`, `lastPage`, and `totalRecords`.

---

### Standardized API Response & Error Contract

All server endpoints return responses conforming to a strict JSON envelope structure:

#### Success Response Envelope (`HTTP 200 / 201 / 202`)
```json
{
  "success": true,
  "data": {
    "document": { ... }
  }
}
```

#### Error Response Envelope (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": {
      "file": "must be a valid PDF document"
    }
  }
}
```

---

## Frontend Architecture Overview

The frontend is a modern web application built using **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**.

```
client/
├── app/
│   ├── (root)/
│   │   ├── layout.tsx         # Root layout with ThemeProvider and ClerkProvider
│   │   ├── page.tsx           # Marketing / Landing page
│   │   └── dashboard/
│   │       └── page.tsx       # Main authenticated document chat workspace
│   └── globals.css            # Tailwind CSS styling and theme variables
├── components/
│   ├── dashboard/
│   │   ├── dashboard.tsx      # Main layout coordinator (Sidebar + Chat Area)
│   │   ├── upload-modal.tsx   # Dropzone, client encryption check, & upload progress
│   │   └── chat/
│   │       ├── chat-area.tsx       # Message thread, auto-scrolling, & input box
│   │       ├── chat-sidebar.tsx    # Session history & document selector
│   │       └── chat-placeholder.tsx# Empty state with Quick-Start document prompt
│   ├── home/                  # Landing page hero, features, & call-to-actions
│   └── ui/                    # Radix UI primitives (Dialog, Sheet, Progress, Button)
├── hooks/
│   ├── use-documents.ts       # State hook for fetching, uploading, and deleting documents
│   ├── use-chats.tsx          # Context provider & hooks for managing chat sessions
│   └── use-messages.ts        # Message state, optimistic updates, and sending queries
└── services/
    ├── api.client.ts          # Axios client with Clerk JWT token injection interceptor
    ├── api.document.ts        # Document API service calls
    └── api.chat.ts            # Chat & Message API service calls
```

### Key Frontend Implementations:
- **Token Injection Interceptor**: In `api.client.ts`, an Axios request interceptor automatically obtains the user's active session token via `window.Clerk.session.getToken()` and attaches it as `Authorization: Bearer <token>`.
- **Pre-upload Encryption Check**: In `upload-modal.tsx`, `pdf-lib` inspects the PDF locally before uploading:
  ```typescript
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  if (pdfDoc.isEncrypted) throw new Error("This document is password protected.");
  ```
- **Optimistic Message Updates**: In `use-messages.ts`, user queries appear in the chat view instantly while the async RAG request is inflight, providing a snappy experience.

---

## Complete REST API Reference

All protected endpoints require an `Authorization: Bearer <Clerk_JWT>` header.

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/v1/healthcheck` | Public | Global (50/min) | Returns service health and version information |
| `POST` | `/v1/documents/upload` | Required | Upload (5/min) | Uploads PDF, creates pending record, queues ingestion |
| `GET` | `/v1/documents` | Required | Global (50/min) | Lists documents with pagination (`page`, `pageSize`, `sort`) |
| `GET` | `/v1/documents/:id` | Required | Global (50/min) | Retrieves single document details |
| `GET` | `/v1/documents/:id/status`| Required | Global (50/min) | Returns processing status (`pending`, `ready`, `failed`) |
| `DELETE`| `/v1/documents/:id` | Required | Global (50/min) | Deletes document and cascades to embeddings/chats |
| `POST` | `/v1/chats` | Required | Global (50/min) | Creates a new chat session linked to a document |
| `GET` | `/v1/chats` | Required | Global (50/min) | Lists all chat sessions for the authenticated user |
| `GET` | `/v1/chats/:id` | Required | Global (50/min) | Gets chat session details with message history |
| `DELETE`| `/v1/chats/:id` | Required | Global (50/min) | Deletes a chat session and all its messages |
| `POST` | `/v1/chats/:id/messages` | Required | Global (50/min) | Sends user message, executes RAG, returns AI reply |

---

## Environment Variables

### Backend Configuration (`server/.env`)

```env
# Application Port and Environment
PORT=4001
NODE_ENV=development

# Database (Neon Serverless PostgreSQL connection string with pgvector)
DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require

# Redis Queue Connection (BullMQ) - Local Redis or Upstash
REDIS_URL=redis://127.0.0.1:6379

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...

# Clerk Authentication Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional Rate Limiter Tuning
LIMITER_WINDOW_MS=60000
LIMITER_MAX_REQUESTS=50
LIMITER_MAX_UPLOAD_REQUESTS=5
LIMITER_ENABLED=true
```

### Frontend Configuration (`client/.env`)

```env
# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:4001
```

---

## Troubleshooting: Redis ENOTFOUND Error

### Why this error occurs:
```text
[Worker] Internal BullMQ error: getaddrinfo ENOTFOUND redis-13503.c301.ap-south-1-1.ec2.cloud.redislabs.com
Error: getaddrinfo ENOTFOUND redis-13503.c301.ap-south-1-1.ec2.cloud.redislabs.com
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26) {
  errno: -3008,
  code: 'ENOTFOUND',
  syscall: 'getaddrinfo',
  hostname: 'redis-13503.c301.ap-south-1-1.ec2.cloud.redislabs.com'
}
```

1. **Root Cause**: The error `getaddrinfo ENOTFOUND` is a Node.js DNS lookup failure.
2. In `server/cmd/api/index.js`, the server instantiates `documentQueue` (`QueueManager.js`) and invokes `documentWorker.start()` (`DocumentWorker.js`).
3. Both of these components initialize `ioredis` client connections pointing to `config.redis.url` (which reads `REDIS_URL` in `server/.env`).
4. In `server/.env`, `REDIS_URL` was configured with an old or expired Redis Cloud instance URL (`redis-13503.c301.ap-south-1-1.ec2.cloud.redislabs.com`). That cloud hostname is no longer resolvable via DNS.
5. In `DocumentWorker.js`, the worker's error listener catches the error and logs:
   ```javascript
   this.worker.on("error", (err) => {
     console.error(`[Worker] Internal BullMQ error:`, err.message);
   });
   ```
   Meanwhile, `QueueManager`'s Redis client emits an unhandled error event that prints the stack trace.

---

### How to Resolve the Error:

Choose one of the following two options:

#### Option A: Use a Local Redis Instance (Recommended for Local Development)

1. **Install and run Redis locally**:
   - On macOS (via Homebrew):
     ```bash
     brew install redis
     brew services start redis
     # Verify it is responding:
     redis-cli ping
     # Output: PONG
     ```
   - Alternatively, via Docker:
     ```bash
     docker run -d --name doc-redis -p 6379:6379 redis:alpine
     ```
2. **Update `server/.env`**:
   ```env
   REDIS_URL='redis://127.0.0.1:6379'
   ```
3. Restart the server:
   ```bash
   cd server && npm run dev
   ```

#### Option B: Use Upstash Redis (Recommended for Production & Cloud Dev)

1. Sign up for a free account at [Upstash Redis](https://upstash.com/).
2. Create a new Redis database and copy the **Node.js ioredis connection string** (e.g. `rediss://default:xxxx@xxxx.upstash.io:6379`).
3. Update `server/.env`:
   ```env
   REDIS_URL='rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379'
   ```
4. If using Upstash TLS (`rediss://`), ensure TLS verification in `server/cmd/api/config.js` is set to:
   ```javascript
   redis: {
     url: getEnvVar(null, "REDIS_URL"),
     options: {
       maxRetriesPerRequest: null,
       tls: { rejectUnauthorized: false },
     },
   }
   ```
5. Restart the server.

---

## Local Development Setup

### Prerequisites
- Node.js 20 LTS or higher
- Redis (running locally or via Upstash)
- PostgreSQL database with `pgvector` extension enabled (e.g. Neon)
- Google Gemini API key
- Clerk account with publishable & secret keys

### 1. Clone the repository
```bash
git clone https://github.com/thecodephilic-guy/doc-assistant.git
cd doc-assistant
```

### 2. Configure and run the Backend
```bash
cd server
npm install

# Create and populate .env (see Backend Configuration above)
# Run database schema migrations
npm run db:push

# Start backend server
npm run dev
```
The server will boot on `http://localhost:4001`.

### 3. Configure and run the Frontend
```bash
cd ../client
npm install

# Create and populate .env (see Frontend Configuration above)
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment

The project includes pre-configured automation for Ubuntu-based VPS servers running Caddy and systemd:

```bash
# Connect to production server via SSH
npm run production:connect

# Synchronize code, install production dependencies, and restart systemd service
npm run deploy:api

# Configure systemd service unit (/etc/systemd/system/doc-assistant.service)
npm run configure:service

# Configure and reload Caddy reverse proxy (/etc/caddy/Caddyfile)
npm run configure:caddy
```

---

## License

This project is licensed under the ISC License.
