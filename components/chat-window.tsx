"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useHistory } from "@/context/history-context"
import { useAgents } from "@/context/agent-context"
import RequestComposer from "./request-composer"
import ChatMessage from "./chat-message"
import { History, ChevronLeft, Menu, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

interface ChatWindowProps {
  agentId: string
  onToggleHistory: () => void
  onToggleSidebar?: () => void
  onToggleDetailPanel?: () => void
}

export default function ChatWindow({
  agentId,
  onToggleHistory,
  onToggleSidebar,
  onToggleDetailPanel,
}: ChatWindowProps) {
  const { addMessage, getHistory } = useHistory()
  const { agents } = useAgents()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const agent = agents.find((a) => a.id === agentId)
  const history = getHistory(agentId)

  useEffect(() => {
    setMessages(history)
  }, [agentId, history])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendRequest = async (request: string) => {
    const userMessage = {
      type: "user" as const,
      content: request,
      timestamp: new Date().toISOString(),
    }
    addMessage(agentId, userMessage)

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const agentResponse = {
        type: "agent" as const,
        content: `This is a summary of the response to: "${request}"`,
        timestamp: new Date().toISOString(),
      }
      addMessage(agentId, agentResponse)
    } catch (error) {
      const errorMessage = {
        type: "error" as const,
        content: "An error occurred while processing your request.",
        timestamp: new Date().toISOString(),
      }
      addMessage(agentId, errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Chat Header */}
      <div className="border-b border-border p-2 sm:p-4 flex items-center justify-between gap-2 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="focus-ring">
            <Link href="/dashboard" aria-label="Back to dashboard">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
          </Button>
          {onToggleSidebar ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="focus-ring lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" asChild className="focus-ring lg:hidden">
              <Link href="/agents" aria-label="Back to agents">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
          )}
          <div className="flex items-center gap-3">
            {agent && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {agent.name.charAt(0)}
                </div>
                <h2 className="font-semibold text-base sm:text-lg">{agent.name}</h2>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && onToggleDetailPanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDetailPanel}
              className="focus-ring"
              aria-label="Toggle detail panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleHistory}
            title="Toggle history"
            className="focus-ring"
            aria-label="Toggle history panel"
          >
            <History className="w-5 h-5" />
          </Button>
          {isMobile && onToggleDetailPanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDetailPanel}
              className="focus-ring"
              aria-label="Toggle detail panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-muted/30">
        <RequestComposer agentId={agentId} onSend={handleSendRequest} disabled={loading} />
      </div>
    </div>
  )
}
