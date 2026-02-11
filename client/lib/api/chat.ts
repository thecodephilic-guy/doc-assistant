"use client";

import { useAuth } from "@clerk/nextjs";
import { apiClient } from "./client";
import type {
  ApiResponse,
  ChatSession,
  ChatsResponse,
  ChatResponse,
  MessageResponse,
  Message,
} from "../types";

export function useChatApi() {
  const { getToken } = useAuth();

  const createChatSession = async (documentId: string): Promise<ChatSession> => {
    const token = await getToken();
    const data = await apiClient<ApiResponse<ChatResponse>>("/chats", {
      method: "POST",
      body: JSON.stringify({ documentId }),
    }, token);

    if (!data.data) {
      throw new Error("Failed to create chat session");
    }

    return data.data.chat;
  };

  const getChatSessions = async (): Promise<ChatSession[]> => {
    const token = await getToken();
    const data = await apiClient<ApiResponse<ChatsResponse>>("/chats", {}, token);
    return data.data?.chats || [];
  };

  const getChatSession = async (chatId: string): Promise<ChatSession> => {
    const token = await getToken();
    const data = await apiClient<ApiResponse<ChatResponse>>(`/chats/${chatId}`, {}, token);
    if (!data.data) {
      throw new Error("Chat session not found");
    }
    return data.data.chat;
  };

  const deleteChatSession = async (chatId: string): Promise<void> => {
    const token = await getToken();
    await apiClient(`/chats/${chatId}`, {
      method: "DELETE",
    }, token);
  };

  const sendMessage = async (
    chatId: string,
    message: string
  ): Promise<Message> => {
    const token = await getToken();
    const data = await apiClient<ApiResponse<MessageResponse>>(
      `/chats/${chatId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
      token
    );

    if (!data.data) {
      throw new Error("Failed to send message");
    }

    return data.data.message;
  };

  return {
    createChatSession,
    getChatSessions,
    getChatSession,
    deleteChatSession,
    sendMessage,
  };
}
