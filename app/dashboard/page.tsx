"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import { useAgents } from "@/context/agent-context"
import { useHistory } from "@/context/history-context"
import RequestComposer from "@/components/request-composer"
import ClarificationModal from "@/components/clarification-modal"
import { submitSupervisorRequest, identifyIntent } from "@/lib/api-service"
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
  const { addMessage, replaceLoadingMessage, removeLoadingMessage, setPendingClarification } = useHistory()
  const router = useRouter()

  const handleClarificationSubmit = async (answer: string) => {
    if (!pendingPayload) return
    setShowClarification(false)
    setClarifyingQuestions([])
    setLoadingQuick(true)
    
    try {
      // Quick intent identification with clarified answer
      const intentResult = await identifyIntent(answer)

      // If still needs more clarification - check both is_ambiguous and status
      const needsClarification = 
        intentResult.is_ambiguous === true || 
        intentResult.status === "clarification_needed"
      
      if (needsClarification && 
          intentResult.clarifying_questions && intentResult.clarifying_questions.length > 0) {
        setClarifyingQuestions(intentResult.clarifying_questions)
        setPendingPayload({ ...pendingPayload, request: answer })
        setShowClarification(true)
        setLoadingQuick(false)
        return
      }

      const chosenAgent = intentResult.agent_id || intentResult.identified_agent || selectedAgentId || agents[0]?.id
      if (!chosenAgent) {
        addMessage("system", { type: "error", content: "No agent identified.", timestamp: new Date().toISOString() })
        setLoadingQuick(false)
        setPendingPayload(null)
        return
      }

      // Add messages and navigate immediately
      addMessage(chosenAgent, { type: "user", content: answer, timestamp: new Date().toISOString() })
      addMessage(chosenAgent, { type: "loading", content: "", timestamp: new Date().toISOString(), id: "loading-" + Date.now() })
      
      setLoadingQuick(false)
      setPendingPayload(null)
      router.push(`/conversation/${chosenAgent}`)
      
      // Process in background
      submitSupervisorRequest({ ...pendingPayload, request: answer, agentId: chosenAgent })
        .then(async (response) => {
          // Check if clarification is needed
          const needsClarification = 
            response.status === "clarification_needed" ||
            (response as any).needs_clarification === true ||
            (response as any).is_ambiguous === true;
          
          const questions = 
            response.clarifying_questions || 
            (response as any).clarifying_questions ||
            (response.intent_info as any)?.clarifying_questions ||
            [];

          if (needsClarification && questions.length > 0) {
            // Remove loading message and set pending clarification for conversation page
            removeLoadingMessage(chosenAgent);
            setPendingClarification({
              agentId: chosenAgent,
              questions: questions,
              payload: { ...pendingPayload, request: answer, agentId: chosenAgent },
            });
            return;
          }

          let context = "general";
          const responseData = typeof response.response === "string" 
            ? (() => { try { return JSON.parse(response.response); } catch { return null; } })()
            : response.response;
          if (responseData?.quiz_content || responseData?.questions) context = "quiz";
          
          const formattedContent = await formatResponseToChat(response.response || "No response.", context)
          replaceLoadingMessage(chosenAgent, { type: "agent", content: formattedContent, timestamp: response.timestamp || new Date().toISOString(), metadata: response.metadata })
        })
        .catch(async (err) => {
          const errorContent = await formatResponseToChat({ error: err instanceof Error ? err.message : "Error" }, "error")
          replaceLoadingMessage(chosenAgent, { type: "error", content: errorContent, timestamp: new Date().toISOString() })
        })
        
    } catch (err) {
      const errorContent = err instanceof Error ? err.message : "Unknown error"
      addMessage("system", { type: "error", content: errorContent, timestamp: new Date().toISOString() })
      setLoadingQuick(false)
      setPendingPayload(null)
      setClarifyingQuestions([])
    }
  }

  const handleQuickSend = async (payload: any) => {
    // If autoRoute is enabled, use two-phase approach: identify then process
    if (payload?.autoRoute) {
      setLoadingQuick(true)
      setClarifyingQuestions([])
      setShowClarification(false)
      
      try {
        // Phase 1: Quick intent identification (fast - just identifies agent)
        const intentResult = await identifyIntent(payload.request)
        
        // If needs clarification, show modal - check both is_ambiguous and status
        const needsClarification = 
          intentResult.is_ambiguous === true || 
          intentResult.status === "clarification_needed"
        
        if (needsClarification && 
            intentResult.clarifying_questions && intentResult.clarifying_questions.length > 0) {
          setClarifyingQuestions(intentResult.clarifying_questions)
          setPendingPayload(payload)
          setShowClarification(true)
          setLoadingQuick(false)
          return
        }

        // Get the identified agent
        const chosenAgent = intentResult.agent_id || intentResult.identified_agent || selectedAgentId || agents[0]?.id
        if (!chosenAgent) {
          addMessage("system", { 
            type: "error", 
            content: "Could not identify an appropriate agent for your request.", 
            timestamp: new Date().toISOString() 
          })
          setLoadingQuick(false)
          return
        }

        // Add user message
        addMessage(chosenAgent, {
          type: "user",
          content: payload.request,
          timestamp: new Date().toISOString(),
        })
        
        // Add loading indicator
        addMessage(chosenAgent, {
          type: "loading",
          content: "",
          timestamp: new Date().toISOString(),
          id: "loading-" + Date.now(),
        })
        
        // Navigate immediately - user sees their message + typing indicator
        setLoadingQuick(false)
        router.push(`/conversation/${chosenAgent}`)
        
        // Phase 2: Full request processing (happens in background after navigation)
        submitSupervisorRequest({ ...payload, agentId: chosenAgent })
          .then(async (response) => {
            // Check if clarification is needed
            const needsClarification = 
              response.status === "clarification_needed" ||
              (response as any).needs_clarification === true ||
              (response as any).is_ambiguous === true;
            
            const questions = 
              response.clarifying_questions || 
              (response as any).clarifying_questions ||
              (response.intent_info as any)?.clarifying_questions ||
              [];

            if (needsClarification && questions.length > 0) {
              // Remove loading message and set pending clarification for conversation page
              removeLoadingMessage(chosenAgent);
              // Set pending clarification so conversation page shows modal
              setPendingClarification({
                agentId: chosenAgent,
                questions: questions,
                payload: { ...payload, agentId: chosenAgent },
              });
              return;
            }

            let context = "general";
            const responseData = typeof response.response === "string" 
              ? (() => { try { return JSON.parse(response.response); } catch { return null; } })()
              : response.response;
            if (responseData?.quiz_content || responseData?.questions) {
              context = "quiz";
            }
            
            const formattedContent = await formatResponseToChat(response.response || "No response content.", context)
            
            replaceLoadingMessage(chosenAgent, {
              type: "agent",
              content: formattedContent,
              timestamp: response.timestamp || new Date().toISOString(),
              metadata: response.metadata,
            })
          })
          .catch(async (err) => {
            const errorContent = await formatResponseToChat(
              { error: err instanceof Error ? err.message : "Request failed" },
              "error"
            )
            replaceLoadingMessage(chosenAgent, {
              type: "error",
              content: errorContent,
              timestamp: new Date().toISOString(),
            })
          })

      } catch (err) {
        // Intent identification failed
        const errorContent = err instanceof Error ? err.message : "Failed to process request"
        addMessage("system", { 
          type: "error", 
          content: errorContent, 
          timestamp: new Date().toISOString() 
        })
        setShowClarification(false)
        setClarifyingQuestions([])
        setPendingPayload(null)
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
