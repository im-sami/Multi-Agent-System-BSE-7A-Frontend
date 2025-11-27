// Environment configuration
export const ENV = {
  // Backend API URL - GitHub Codespaces
  BACKEND_API_URL: "http://localhost:8080/api",
  
  // Default User ID (can be overridden)
  DEFAULT_USER_ID: "1",
} as const;

// Helper to get user ID from localStorage or use default
export function getUserId(): string {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("user_id");
    return userId || ENV.DEFAULT_USER_ID;
  }
  return ENV.DEFAULT_USER_ID;
}
