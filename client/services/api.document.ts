import { apiClient } from "./api.client";
import type { Document } from "@/lib/types";

export class DocumentService {
  static async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("document", file);

    const response = await apiClient.post("/v1/documents/upload", formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data.data?.document;
  }

  static async getDocuments(): Promise<Document[]> {
    const response = await apiClient.get("/v1/documents");
    return response.data.data?.documents || [];
  }

  static async getDocument(documentId: string): Promise<Document> {
    const response = await apiClient.get(`/v1/documents/${documentId}`);
    return response.data.data?.document;
  }

  static async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/v1/documents/${documentId}`);
  }
}
