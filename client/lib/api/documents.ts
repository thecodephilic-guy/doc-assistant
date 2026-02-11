"use client";

import { useAuth } from "@clerk/nextjs";
import { apiClient } from "./client";
import type {
  ApiResponse,
  Document,
  DocumentsResponse,
  UploadResponse,
} from "../types";

export function useDocumentsApi() {
  const { getToken } = useAuth();

  const uploadDocument = async (file: File): Promise<Document> => {
    const token = await getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/documents/upload`,
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
    const token = await getToken();
    const data = await apiClient<ApiResponse<DocumentsResponse>>("/documents", {}, token);
    return data.data?.documents || [];
  };

  const getDocument = async (documentId: string): Promise<Document> => {
    const token = await getToken();
    const data = await apiClient<ApiResponse<{ document: Document }>>(
      `/documents/${documentId}`,
      {},
      token
    );
    if (!data.data) {
      throw new Error("Document not found");
    }
    return data.data.document;
  };

  const deleteDocument = async (documentId: string): Promise<void> => {
    const token = await getToken();
    await apiClient(`/documents/${documentId}`, {
      method: "DELETE",
    }, token);
  };

  return {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
  };
}
