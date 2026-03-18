import { apiClient } from "./api.client";
import type { ChatSession, Message } from "@/lib/types";

export class ChatService {
  static async createChatSession(documentId: string): Promise<ChatSession> {
    const response = await apiClient.post("/v1/chats", { documentId });
    // response.data contains your ApiResponse wrapper, so we extract the nested data
    return response.data.data.chat;
  }

  static async getChatSessions(): Promise<ChatSession[]> {
    const response = await apiClient.get("/v1/chats");
    return response.data.data?.chats || [];
  }

  static async getChatSession(chatId: string): Promise<ChatSession> {
    const response = await apiClient.get(`/v1/chats/${chatId}`);
    return response.data.data.chat;
  }

  static async deleteChatSession(chatId: string): Promise<void> {
    await apiClient.delete(`/v1/chats/${chatId}`);
  }

  static async sendMessage(chatId: string, message: string): Promise<Message> {
    const response = await apiClient.post(`/v1/chats/${chatId}/messages`, {
      message,
    });
    return response.data.data.message;
  }
}