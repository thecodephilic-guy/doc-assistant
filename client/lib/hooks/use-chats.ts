"use client";

import { useState, useEffect } from "react";
import { useChatApi } from "../api/chat";
import type { ChatSession } from "../types";

export function useChats() {
  const api = useChatApi();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessions = await api.getChatSessions();
      setChats(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createChat = async (documentId: string): Promise<ChatSession> => {
    try {
      setError(null);
      const chat = await api.createChatSession(documentId);
      setChats((prev) => [chat, ...prev]);
      return chat;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create chat";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      setError(null);
      await api.deleteChatSession(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete chat";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    chats,
    loading,
    error,
    createChat,
    deleteChat,
    refresh: fetchChats,
  };
}

export function useChat(chatId: string | null) {
  const api = useChatApi();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      return;
    }

    const fetchChat = async () => {
      try {
        setLoading(true);
        setError(null);
        const session = await api.getChatSession(chatId);
        setChat(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  return {
    chat,
    loading,
    error,
  };
}
