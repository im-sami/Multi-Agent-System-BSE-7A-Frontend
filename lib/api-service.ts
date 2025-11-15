import {
  Agent,
  RequestPayload,
  RequestResponse,
  User,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

export async function login(
  credentials: Record<"email" | "password", string>,
): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to login")
  }

  return response.json()
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch current user")
  }

  return response.json()
}

export async function fetchAgentRegistry(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE_URL}/api/supervisor/registry`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.statusText}`)
  }

  const data: { agents: Agent[] } = await response.json()
  return data.agents
}

export async function submitSupervisorRequest(
  payload: RequestPayload,
): Promise<RequestResponse> {
  const response = await fetch(`${API_BASE_URL}/api/supervisor/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error?.message ||
        errorData.detail ||
        `Failed to submit request: ${response.statusText}`,
    )
  }

  return response.json()
}

export async function checkAgentHealth(
  agent: Agent,
): Promise<"healthy" | "degraded" | "offline"> {
  // Construct health check URL from agent's base URL
  const healthUrl = `${API_BASE_URL}/api/agent/${agent.id}/health`

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      return "offline"
    }

    const data = await response.json()
    return data.status || "offline"
  } catch (error) {
    console.error(`Health check failed for agent ${agent.id}:`, error)
    return "offline"
  }
}

export const fetchAgents = fetchAgentRegistry
export const checkHealth = checkAgentHealth
