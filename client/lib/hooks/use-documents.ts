"use client";

import { useState, useEffect } from "react";
import { useDocumentsApi } from "../api/documents";
import type { Document } from "../types";

export function useDocuments() {
  const api = useDocumentsApi();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upload = async (file: File): Promise<Document> => {
    try {
      setError(null);
      const document = await api.uploadDocument(file);
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
      await api.deleteDocument(documentId);
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
