"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { ChatSession } from "../lib/types";
import { ChatService } from "@/services/api.chat";
import { useSession } from "@clerk/nextjs";

interface ChatContextType {
  chats: ChatSession[];
  loading: boolean;
  error: string | null;
  createChat: (documentId: string) => Promise<ChatSession>;
  deleteChat: (chatId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, session } = useSession();

  const sessionId = session?.id;

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessions = await ChatService.getChatSessions();
      setChats(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  // Initial call to fetch all chats of a user
  useEffect(() => {
    if (isLoaded && sessionId) {
      fetchChats();
    }
  }, [isLoaded, sessionId]);

  const createChat = async (documentId: string): Promise<ChatSession> => {
    try {
      setError(null);
      const chat = await ChatService.createChatSession(documentId);
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
      await ChatService.deleteChatSession(chatId);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete chat";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        loading,
        error,
        createChat,
        deleteChat,
        refresh: fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// useChats Hook to consume the Context
export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatProvider");
  }
  return context;
}

// Second Hook - useChat() to hanlde states related to exactly one chat
export function useChat(chatId: string | null) {
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
        const session = await ChatService.getChatSession(chatId);
        setChat(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId]);

  return {
    chat,
    loading,
    error,
  };
}
