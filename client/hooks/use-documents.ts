"use client";

import { useState, useEffect } from "react";
import type { Document } from "../lib/types";
import { DocumentService } from "@/services/api.document";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await DocumentService.getDocuments();
      
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const upload = async (file: File): Promise<Document> => {
    try {
      setError(null);
      const document = await DocumentService.uploadDocument(file);  
      setDocuments((prev) => [document, ...prev]);
      return document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const remove = async (documentId: string): Promise<void> => {
    try {
      setError(null);
      await DocumentService.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Delete failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    documents,
    loading,
    error,
    upload,
    remove,
    refresh: fetchDocuments,
  };
}
