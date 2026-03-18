import { ApiResponse } from "@/lib/types";
import axios, { AxiosError } from "axios";

// TypeScript declaration for Clerk
declare global {
  interface Window {
    Clerk?: { session?: { getToken: () => Promise<string | null> } };
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
});

// Inject Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined" && window.Clerk?.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to fetch Clerk token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle Custom API Responses & Errors
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    // If the backend returns a 200 OK, but success is false, throw our ApiError
    if (data && data.success === false) {
      throw new ApiError(
        data.error?.code || "UNKNOWN_ERROR",
        data.error?.message || "An unknown error occurred",
        response.status
      );
    }
    return response;
  },
  (error: AxiosError<ApiResponse<null>>) => {
    const data = error.response?.data;
    throw new ApiError(
      data?.error?.code || "NETWORK_ERROR",
      data?.error?.message || error.message || "A network error occurred",
      error.response?.status
    );
  }
);