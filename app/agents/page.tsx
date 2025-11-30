"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/header"
import { useAgents } from "@/context/agent-context"
import AgentCard from "@/components/agent-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function AgentDirectoryPage() {
  const { agents, loading, agentHealth } = useAgents()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAgents = agents.filter((agent) => {
    return agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Sort agents: online first, then offline
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const aHealth = agentHealth[a.id] || "offline"
    const bHealth = agentHealth[b.id] || "offline"
    if (aHealth === "healthy" && bHealth !== "healthy") return -1
    if (aHealth !== "healthy" && bHealth === "healthy") return 1
    return 0
  })

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Agent Directory</h1>
                <p className="text-muted-foreground">Browse and select agents</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>

            {/* Search */}
            <Card className="p-6">
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </Card>

            {/* Agent Grid */}
            {loading ? (
              <p className="text-muted-foreground">Loading agents...</p>
            ) : sortedAgents.length === 0 ? (
              <p className="text-muted-foreground">No agents found matching your criteria.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAgents.map((agent) => (
                  <Link key={agent.id} href={`/agent/${agent.id}`}>
                    <AgentCard
                      agent={agent}
                      health={agentHealth[agent.id] || "offline"}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
