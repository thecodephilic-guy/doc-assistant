import { apiClient } from "./api.client";
import type { Document } from "@/lib/types";

export class DocumentService {
  static async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    // Appending using the "document" key as defined in your original code
    formData.append("document", file); 

    const response = await apiClient.post("/v1/documents/upload", formData);
    return response.data.data;
  }

  static async getDocuments(): Promise<Document[]> {
    const response = await apiClient.get("/v1/documents");
    return response.data.data || [];
  }

  static async getDocument(documentId: string): Promise<Document> {
    const response = await apiClient.get(`/v1/documents/${documentId}`);
    return response.data.data;
  }

  static async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/v1/documents/${documentId}`);
  }
}