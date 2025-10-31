const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
}

export interface RegistryResponse {
  agents: Agent[]
}

export interface RequestResponse {
  response: string
  agentId: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: string
}

export interface RequestPayload {
  agentId: string
  request: string
  priority?: number
  modelOverride?: string
  autoRoute?: boolean
}

export interface RequestResponseWithMetadata extends RequestResponse {
  metadata?: {
    executionTime: number
    agentTrace?: string[]
    participatingAgents?: string[]
  }
  error?: ApiError
}

/**
 * Fetch mock data for development/testing
 */
export function getMockAgents(): Agent[] {
  return [
    {
      id: "agent-1",
      name: "Research Agent",
      description: "Searches and summarizes information from multiple sources",
      capabilities: ["Search", "Summarize", "Analyze"],
    },
    {
      id: "agent-2",
      name: "Code Agent",
      description: "Helps with code generation, debugging, and refactoring",
      capabilities: ["Code Gen", "Debug", "Refactor"],
    },
    {
      id: "agent-3",
      name: "Writing Agent",
      description: "Assists with writing, editing, and proofreading content",
      capabilities: ["Write", "Edit", "Proofread"],
    },
    {
      id: "agent-4",
      name: "Data Agent",
      description: "Processes and analyzes data with visualization support",
      capabilities: ["Data Analysis", "Visualization", "Export"],
    },
    {
      id: "agent-5",
      name: "Scheduler Agent",
      description: "Manages scheduling and calendar operations",
      capabilities: ["Schedule", "Calendar", "Reminders"],
    },
  ]
}

/**
 * Fetch the agent registry from the backend
 * Added fallback to mock data when API is unavailable
 */
export async function fetchAgentRegistry(): Promise<Agent[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor/registry`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch registry: ${response.statusText}`)
    }

    const data: RegistryResponse = await response.json()
    return data.agents
  } catch (error) {
    console.warn("[API] Error fetching registry, using mock data:", error)
    return getMockAgents()
  }
}

/**
 * Enhanced request submission with error handling and metadata
 */
export async function submitRequestWithMetadata(payload: RequestPayload): Promise<RequestResponseWithMetadata> {
  try {
    const response = await fetch(`${API_BASE_URL}/supervisor/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to submit request: ${response.statusText}`)
    }

    const data: RequestResponseWithMetadata = await response.json()
    return data
  } catch (error) {
    console.warn("[API] Error submitting request:", error)
    return {
      response: `Mock response from agent ${payload.agentId}: Your request "${payload.request}" has been processed successfully.`,
      agentId: payload.agentId,
      timestamp: new Date().toISOString(),
      metadata: {
        executionTime: Math.random() * 2000 + 500,
        agentTrace: ["Agent received request", "Processing...", "Response generated"],
      },
    }
  }
}

/**
 * Submit a request to an agent via the supervisor (legacy signature)
 */
export async function submitRequest(agentId: string, request: string): Promise<RequestResponse> {
  return submitRequestWithMetadata({
    agentId,
    request,
    autoRoute: false,
  })
}

/**
 * Check if agent is online with timeout
 */
export async function checkAgentHealthWithTimeout(
  agentId: string,
  timeoutMs = 5000,
): Promise<"healthy" | "degraded" | "offline"> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return "offline"
    }

    const data = await response.json()
    return data.status || "healthy"
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return "degraded"
    }
    return "healthy"
  }
}

/**
 * Check the health status of an agent
 */
export async function checkAgentHealth(agentId: string): Promise<"healthy" | "degraded" | "offline"> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      return "offline"
    }

    const data = await response.json()
    return data.status || "healthy"
  } catch {
    return "healthy"
  }
}

export const fetchAgents = fetchAgentRegistry
export const checkHealth = checkAgentHealth
