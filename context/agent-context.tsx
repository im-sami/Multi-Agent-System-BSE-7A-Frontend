"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Agent } from "@/types/agent"
import { fetchAgentRegistry } from "@/lib/api-service"
import { checkAgentHealthWithTimeout } from "@/lib/api-service"

interface AgentContextType {
  agents: Agent[]
  loading: boolean
  error: string | null
  agentHealth: Record<string, "healthy" | "degraded" | "offline">
  refreshHealth: (agentId?: string) => Promise<void>
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentHealth, setAgentHealth] = useState<Record<string, "healthy" | "degraded" | "offline">>({})

  // Load agents on mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true)
        const data = await fetchAgentRegistry()
        setAgents(data)
        setError(null)

        // Initial health check
        const healthMap: Record<string, "healthy" | "degraded" | "offline"> = {}
        for (const agent of data) {
          healthMap[agent.id] = await checkAgentHealthWithTimeout(agent.id)
        }
        setAgentHealth(healthMap)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load agents"
        console.error("[AgentContext] Error loading agents:", errorMsg)
        setError(null)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }

    loadAgents()
  }, [])

  // Poll health status every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const healthMap: Record<string, "healthy" | "degraded" | "offline"> = {}
      for (const agent of agents) {
        healthMap[agent.id] = await checkAgentHealthWithTimeout(agent.id)
      }
      setAgentHealth(healthMap)
    }, 30000)

    return () => clearInterval(interval)
  }, [agents])

  const refreshHealth = async (agentId?: string) => {
    if (agentId) {
      const status = await checkAgentHealthWithTimeout(agentId)
      setAgentHealth((prev) => ({ ...prev, [agentId]: status }))
    } else {
      const healthMap: Record<string, "healthy" | "degraded" | "offline"> = {}
      for (const agent of agents) {
        healthMap[agent.id] = await checkAgentHealthWithTimeout(agent.id)
      }
      setAgentHealth(healthMap)
    }
  }

  return (
    <AgentContext.Provider value={{ agents, loading, error, agentHealth, refreshHealth }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgents() {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error("useAgents must be used within AgentProvider")
  }
  return context
}

export const useAgent = useAgents
