"use client";

import { useCallback, useState } from "react";
import type { Message } from "../lib/types";
import { ChatService } from "@/services/api.chat";

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (content: string): Promise<void> => {
    if (!chatId) {
      throw new Error("No active chat session");
    }

    try {
      setSending(true);
      setError(null);

      // Add user message immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to API and get response
      const aiMessage = await ChatService.sendMessage(chatId, content);
      
      // Add AI response
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const setInitialMessages = useCallback((initialMessages: Message[]) => {
    setMessages(initialMessages);
  },[]);

  return {
    messages,
    sending,
    error,
    send,
    setInitialMessages,
  };
}
