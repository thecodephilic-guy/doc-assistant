"use client";

import { useClerk } from "../hooks/useClerk";
import type {
  ApiResponse,
  ChatSession,
  ChatsResponse,
  ChatResponse,
  MessageResponse,
  Message,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useChatApi() {

  const { getAuthHeader } = useClerk();

  const createChatSession = async (documentId: string): Promise<ChatSession> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/chats`, {
      method: "POST",
      headers,
      body: JSON.stringify({ documentId }),
    });

    const data: ApiResponse<ChatResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Failed to create chat session");
    }

    return data.data.chat;
  };

  const getChatSessions = async (): Promise<ChatSession[]> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/chats`, { headers });
    const data: ApiResponse<ChatsResponse> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Failed to fetch chat sessions");
    }

    return data.data?.chats || [];
  };

  const getChatSession = async (chatId: string): Promise<ChatSession> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/chats/${chatId}`, { headers });
    const data: ApiResponse<ChatResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Chat session not found");
    }

    return data.data.chat;
  };

  const deleteChatSession = async (chatId: string): Promise<void> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/chats/${chatId}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || "Failed to delete chat session");
    }
  };

  const sendMessage = async (
    chatId: string,
    message: string
  ): Promise<Message> => {
    const headers = await getAuthHeader();

    const response = await fetch(`${API_BASE_URL}/v1/chats/${chatId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    const data: ApiResponse<MessageResponse> = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error?.message || "Failed to send message");
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
