"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Insight {
  id: string
  type: "feedback" | "suggestion" | "warning" | "achievement"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  createdAt: string
  dismissed: boolean
}

interface InsightsContextType {
  insights: Insight[]
  addInsight: (insight: Omit<Insight, "id" | "createdAt" | "dismissed">) => void
  dismissInsight: (id: string) => void
  getActiveInsights: () => Insight[]
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined)

export function InsightsProvider({ children }: { children: ReactNode }) {
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("insights")
    if (stored) {
      try {
        setInsights(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse insights", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("insights", JSON.stringify(insights))
  }, [insights])

  const addInsight = (insight: Omit<Insight, "id" | "createdAt" | "dismissed">) => {
    const newInsight: Insight = {
      ...insight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      dismissed: false,
    }
    setInsights((prev: Insight[]) => [...prev, newInsight])
  }

  const dismissInsight = (id: string) => {
    setInsights((prev: Insight[]) =>
      prev.map((i: Insight) => (i.id === id ? { ...i, dismissed: true } : i))
    )
  }

  const getActiveInsights = () => {
    return insights.filter((i: Insight) => !i.dismissed)
  }

  return (
    <InsightsContext.Provider
      value={{
        insights,
        addInsight,
        dismissInsight,
        getActiveInsights,
      }}
    >
      {children}
    </InsightsContext.Provider>
  )
}

export function useInsights() {
  const context = useContext(InsightsContext)
  if (!context) {
    throw new Error("useInsights must be used within InsightsProvider")
  }
  return context
}
