import {
  Agent,
  RequestPayload,
  RequestResponse,
  User,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

// Retry helper for API calls
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 3, 
  delay = 500
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch(url, { 
        ...options, 
        signal: controller.signal 
      })
      clearTimeout(timeoutId)
      
      if (response.ok || response.status < 500) {
        return response
      }
      // Retry on 5xx errors
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, delay * (i + 1)))
    }
  }
  throw new Error(`Failed after ${retries} retries`)
}

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
  const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
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
  const response = await fetchWithRetry(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch current user")
  }

  return response.json()
}

export async function fetchAgentRegistry(): Promise<Agent[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/api/supervisor/registry`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.statusText}`)
  }

  const data: { agents: Agent[] } = await response.json()
  return data.agents
}

// Fast intent identification - just identifies the agent, doesn't process
export interface IntentResult {
  status?: string;
  agent_id?: string;
  identified_agent?: string;
  clarifying_questions?: string[];
  confidence?: number;
  is_ambiguous?: boolean;
  reasoning?: string;
}

export async function identifyIntent(query: string): Promise<IntentResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/identify-intent`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || "Failed to identify intent")
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Intent identification timed out')
    }
    throw error
  }
}

export async function submitSupervisorRequest(
  payload: RequestPayload,
): Promise<RequestResponse> {
  // Use AbortController with a longer timeout for LLM-based requests
  // which can take 60-120 seconds for complex tasks like plagiarism checking
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 180000) // 180s timeout for ML/LLM tasks

  try {
    const response = await fetch(`${API_BASE_URL}/api/supervisor/request`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error?.message ||
          errorData.detail ||
          `Failed to submit request: ${response.statusText}`,
      )
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The agent may still be processing - please wait a moment and check again.')
    }
    throw error
  }
}

export async function checkAgentHealth(
  agent: Agent,
): Promise<"healthy" | "degraded" | "offline"> {
  // Construct health check URL from agent's base URL
  const healthUrl = `${API_BASE_URL}/api/agent/${agent.id}/health`

  // Use AbortController with a short timeout for health checks
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout for health checks

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      return "offline"
    }

    const data = await response.json()
    return data.status || "offline"
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`Health check failed for agent ${agent.id}:`, error)
    return "offline"
  }
}

export const fetchAgents = fetchAgentRegistry
export const checkHealth = checkAgentHealth
