"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import { useAgents } from "@/context/agent-context"
import { useHistory } from "@/context/history-context"
import RequestComposer from "@/components/request-composer"
import ClarificationModal from "@/components/clarification-modal"
import { submitSupervisorRequest } from "@/lib/api-service"
import HealthStatus from "@/components/health-status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatResponseToChat } from "@/lib/response-formatter"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function DashboardPage() {
  const { agents, loading, agentHealth } = useAgents()
  const { getHistory } = useHistory()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [loadingQuick, setLoadingQuick] = useState(false)
  const [showClarification, setShowClarification] = useState(false)
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([])
  const [pendingPayload, setPendingPayload] = useState<any>(null)
  const { addMessage } = useHistory()
  const router = useRouter()

  const handleClarificationSubmit = async (answer: string) => {
    if (!pendingPayload) return
    setShowClarification(false)
    setClarifyingQuestions([]) // Clear old questions immediately
    setLoadingQuick(true)
    try {
      // send the clarified answer as a follow-up request; backend will use conversation history
      const followUpPayload = { ...pendingPayload, request: answer, autoRoute: true }
      const response = await submitSupervisorRequest(followUpPayload)

      // If still needs clarification, reopen modal with NEW questions only
      if (response && response.status === "clarification_needed" && 
          response.clarifying_questions && response.clarifying_questions.length > 0) {
        setClarifyingQuestions(response.clarifying_questions)
        setPendingPayload(followUpPayload)
        setShowClarification(true)
        setLoadingQuick(false)
        return // Don't clear pendingPayload, keep clarification loop going
      }

      const chosenAgent = response?.metadata?.identified_agent || response?.agentId || selectedAgentId || agents[0]?.id
      if (!chosenAgent) {
        addMessage("system", { type: "error", content: "No agent chosen by supervisor.", timestamp: new Date().toISOString() })
        setLoadingQuick(false)
        setPendingPayload(null)
        return
      }

      // Store user answer and agent response to conversation
      addMessage(chosenAgent, { type: "user", content: answer, timestamp: new Date().toISOString() })
      
      // Detect context for better formatting
      let context = "general";
      const responseData = typeof response.response === "string" 
        ? (() => { try { return JSON.parse(response.response); } catch { return null; } })()
        : response.response;
      if (responseData?.quiz_content || responseData?.questions) {
        context = "quiz";
      }
      
      // Format response to natural language
      const formattedContent = await formatResponseToChat(response.response || "No response content.", context)
      
      addMessage(chosenAgent, { type: "agent", content: formattedContent, timestamp: response.timestamp || new Date().toISOString(), metadata: response.metadata })

      setLoadingQuick(false)
      setPendingPayload(null)
      try { router.push(`/conversation/${chosenAgent}`) } catch (e) { /* noop */ }
    } catch (err) {
      const errorContent = await formatResponseToChat(
        err instanceof Error ? { error: err.message } : { error: "Unknown error" },
        "error"
      )
      addMessage("system", { type: "error", content: errorContent, timestamp: new Date().toISOString() })
      setLoadingQuick(false)
      setPendingPayload(null)
      setClarifyingQuestions([]) // Clear questions on error
    }
  }

  const handleQuickSend = async (payload: any) => {
    // If autoRoute is enabled, let the supervisor decide the agent.
    if (payload?.autoRoute) {
      setLoadingQuick(true)
      setClarifyingQuestions([]) // Clear any stale questions
      setShowClarification(false) // Close modal if open
      try {
        // Send payload as-is (RequestComposer will set agentId to empty string when autoRoute)
        const response = await submitSupervisorRequest(payload)

        // If supervisor requests clarification, open clarification modal only with valid questions
        if (response && response.status === "clarification_needed" &&
            response.clarifying_questions && response.clarifying_questions.length > 0) {
          setClarifyingQuestions(response.clarifying_questions)
          setPendingPayload(payload)
          setShowClarification(true)
          setLoadingQuick(false)
          return
        }

        // Otherwise, use identified agent (from metadata) or fallback to response.agentId
        const chosenAgent = response?.metadata?.identified_agent || response?.agentId || selectedAgentId || agents[0]?.id
        if (!chosenAgent) {
          const errorMessage = {
            type: "error" as const,
            content: "No agent chosen by supervisor.",
            timestamp: new Date().toISOString(),
          }
          addMessage("system", errorMessage)
          return
        }

        const userMessage = {
          type: "user" as const,
          content: payload.request,
          timestamp: new Date().toISOString(),
        }

        // Add the user message and assistant response to the chosen agent conversation
        addMessage(chosenAgent, userMessage)
        
        // Detect context for better formatting
        let context = "general";
        const responseData = typeof response.response === "string" 
          ? (() => { try { return JSON.parse(response.response); } catch { return null; } })()
          : response.response;
        if (responseData?.quiz_content || responseData?.questions) {
          context = "quiz";
        }
        
        // Format response to natural language
        const formattedContent = await formatResponseToChat(response.response || "No response content.", context)
        
        const agentResponse = {
          type: "agent" as const,
          content: formattedContent,
          timestamp: response.timestamp || new Date().toISOString(),
          metadata: response.metadata,
        }
        addMessage(chosenAgent, agentResponse)

        try {
          router.push(`/conversation/${chosenAgent}`)
        } catch (navErr) {
          console.error("Failed to navigate to conversation:", navErr)
        }
      } catch (err) {
        const errorContent = await formatResponseToChat(
          err instanceof Error ? { error: err.message } : { error: "An unknown error occurred." },
          "error"
        )
        const errorMessage = {
          type: "error" as const,
          content: errorContent,
          timestamp: new Date().toISOString(),
        }
        addMessage("system", errorMessage)
        // Clear clarification state on error
        setShowClarification(false)
        setClarifyingQuestions([])
        setPendingPayload(null)
      } finally {
        setLoadingQuick(false)
      }

      return
    }

    // Non-autoRoute behavior: use explicit agent selection (legacy behavior)
    const targetAgentId = payload.agentId || selectedAgentId || agents[0]?.id
    if (!targetAgentId) return

    const userMessage = {
      type: "user" as const,
      content: payload.request,
      timestamp: new Date().toISOString(),
    }
    // Add the user message to history and navigate to the conversation view
    addMessage(targetAgentId, userMessage)
    try {
      // Navigate early so user sees the chat immediately
      router.push(`/conversation/${targetAgentId}`)
    } catch (navErr) {
      console.error("Failed to navigate to conversation:", navErr)
    }

    setLoadingQuick(true)
    try {
      const response = await submitSupervisorRequest({ ...payload, agentId: targetAgentId })
      const agentResponse = {
        type: "agent" as const,
        content: response.response || "No response content.",
        timestamp: response.timestamp,
        metadata: response.metadata,
      }
      addMessage(targetAgentId, agentResponse)
    } catch (err) {
      const errorMessage = {
        type: "error" as const,
        content: err instanceof Error ? err.message : "An unknown error occurred.",
        timestamp: new Date().toISOString(),
      }
      addMessage(targetAgentId, errorMessage)
    } finally {
      setLoadingQuick(false)
    }
  }

  // Get recent history across all agents
  const recentHistory = agents
    .flatMap((agent) => {
      const history = getHistory(agent.id)
      return history.slice(-3).map((msg) => ({
        ...msg,
        agentId: agent.id,
        agentName: agent.name,
      }))
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  // Get counts for health status
  const healthCounts = {
    healthy: Object.values(agentHealth).filter((s) => s === "healthy").length,
    degraded: Object.values(agentHealth).filter((s) => s === "degraded").length,
    offline: Object.values(agentHealth).filter((s) => s === "offline").length,
  }

  const [showRecentActivity, setShowRecentActivity] = useState(false)

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto">
          <ClarificationModal
            open={showClarification}
            questions={clarifyingQuestions}
            onCancel={() => { setShowClarification(false); setPendingPayload(null) }}
            onSubmit={handleClarificationSubmit}
          />

          {/* Main Content */}
          <div className="p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Header with inline stats */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage your AI learning agents</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {healthCounts.healthy} online
                  </div>
                  {healthCounts.degraded > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-600 text-sm">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      {healthCounts.degraded} degraded
                    </div>
                  )}
                  {healthCounts.offline > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      {healthCounts.offline} offline
                    </div>
                  )}
                </div>
              </div>

              {/* Request Composer - Above agents */}
              <Card className="p-4">
                <RequestComposer
                  agentId={selectedAgentId || agents[0]?.id}
                  onAgentChange={setSelectedAgentId}
                  onSend={handleQuickSend}
                  disabled={loadingQuick}
                />
              </Card>

              {/* Agents Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Available Agents</h2>
                  <Link href="/agents">
                    <Button variant="ghost" size="sm">
                      View All →
                    </Button>
                  </Link>
                </div>
                {loading ? (
                  <p className="text-muted-foreground">Loading agents...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.slice(0, 9).map((agent) => (
                      <Link key={agent.id} href={`/conversation/${agent.id}`}>
                        <Card className="p-4 h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {agent.name}
                            </h3>
                            <HealthStatus status={agentHealth[agent.id] || "offline"} />
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {agent.description}
                          </p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Collapsible Recent Activity at Bottom */}
              {recentHistory.length > 0 && (
                <div className="border rounded-lg overflow-hidden bg-card">
                  <button
                    onClick={() => setShowRecentActivity(!showRecentActivity)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors border-b border-transparent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Recent Activity</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{recentHistory.length}</span>
                    </div>
                    {showRecentActivity ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {showRecentActivity && (
                    <div className="border-t">
                      {recentHistory.map((item, idx) => (
                        <Link 
                          key={idx} 
                          href={`/conversation/${item.agentId}`}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                            {item.agentName?.[0] || "A"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.agentName}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                {item.type === "user" ? "You" : "Response"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
