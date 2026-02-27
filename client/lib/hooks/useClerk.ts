import { useAuth } from "@clerk/nextjs";

export function useClerk() {
const { getToken } = useAuth();

  const getAuthHeader = async (includeContentType = true): Promise<Record<string, string>> => {
    const token = await getToken();
    console.log(token);
    
    const headers: Record<string, string> = {};
    if(includeContentType){
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  return {
    getAuthHeader
  }
}