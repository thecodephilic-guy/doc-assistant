// TypeScript types for the Doc Assistant application

export interface Document {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  pageCount: number;
  status: "processing" | "ready" | "failed";
  url?: string;
}

export interface ChatSession {
  id: string;
  documentId: string;
  documentName: string;
  documentPageCount?: number;
  documentSize?: number;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadResponse {
  document: Document;
}

export interface DocumentsResponse {
  documents: Document[];
}

export interface ChatsResponse {
  chats: ChatSession[];
}

export interface ChatResponse {
  chat: ChatSession;
}

export interface MessageResponse {
  message: Message;
}
