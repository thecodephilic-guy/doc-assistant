"use client";

import { useClerk } from "../hooks/useClerk";
import type {
  ApiResponse,
  Document,
  DocumentsResponse,
  UploadResponse,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useDocumentsApi() {
  const { getAuthHeader } = useClerk();

  const uploadDocument = async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append("document", file);
    const includeContentType = false;
    
    const headers = await getAuthHeader(includeContentType)

    const response = await fetch(
      `${API_BASE_URL}/v1/documents/upload`,
      {
        method: "POST",
        body: formData,
        headers,
      }
    );

    const data: ApiResponse<UploadResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data.data.document;
  };

  const getDocuments = async (): Promise<Document[]> => {
    const headers = await getAuthHeader();
    
    const response = await fetch(`${API_BASE_URL}/v1/documents`, { headers });
    const data: ApiResponse<DocumentsResponse> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Failed to fetch documents");
    }

    return data.data?.documents || [];
  };

  const getDocument = async (documentId: string): Promise<Document> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/documents/${documentId}`, { headers });
    const data: ApiResponse<{ document: Document }> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Document not found");
    }

    return data.data.document;
  };

  const deleteDocument = async (documentId: string): Promise<void> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/documents/${documentId}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || "Failed to delete document");
    }
  };

  return {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
  };
}
