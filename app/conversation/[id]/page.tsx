"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import { useAgents } from "@/context/agent-context";
import ChatWindow from "@/components/chat-window";
import { OfflineWarning } from "@/components/offline-warning";
import { Button } from "@/components/ui/button";
import AgentDetailPanel from "@/components/agent-detail-panel";
import HistoryPanel from "@/components/history-panel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { submitSupervisorRequest } from "@/lib/api-service";
import { useHistory } from "@/context/history-context";
import { type RequestPayload } from "@/types";
import { formatResponseToChat } from "@/lib/response-formatter";
import ClarificationModal from "@/components/clarification-modal";

export default function ConversationPage() {
  const params = useParams();
  const agentId = params.id as string;
  const { agents, agentHealth, refreshHealth } = useAgents();
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(
    null
  );
  const [showHistory, setShowHistory] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const isMobile = useIsMobile();
  const { addMessage, replaceLoadingMessage, removeMessage, getHistory, pendingClarification, setPendingClarification } = useHistory();
  const [loading, setLoading] = useState(false);
  const [healthChecked, setHealthChecked] = useState(false);
  const [showClarification, setShowClarification] = useState(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [pendingPayload, setPendingPayload] = useState<RequestPayload | null>(null);

  const agent = agents.find((a) => a.id === agentId);
  const health = agentHealth[agentId];
  const currentHistory = getHistory(agentId);
  const hasActiveConversation = currentHistory.length > 0;
  
  // Only consider offline if we've explicitly checked, it's confirmed offline,
  // AND there's no active conversation (don't interrupt an ongoing conversation)
  const isOffline = healthChecked && health === "offline" && !hasActiveConversation && !loading;
  
  // Refresh health when the page loads and when agentId changes
  useEffect(() => {
    const checkHealth = async () => {
      setHealthChecked(false);
      await refreshHealth(agentId);
      setHealthChecked(true);
    };
    
    if (agentId && agents.length > 0) {
      checkHealth();
    }
  }, [agentId, agents.length, refreshHealth]);

  // Watch for pending clarification from background processing
  useEffect(() => {
    if (pendingClarification && pendingClarification.agentId === agentId) {
      setClarifyingQuestions(pendingClarification.questions);
      setPendingPayload(pendingClarification.payload);
      setShowClarification(true);
      // Clear the pending clarification so it doesn't trigger again
      setPendingClarification(null);
    }
  }, [pendingClarification, agentId, setPendingClarification]);

  if (!agent) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOffline && !selectedAlternative) {
    const alternativeAgents = agents.filter(
      (a) => a.id !== agentId && agentHealth[a.id] !== "offline"
    );

    return (
      <div className="flex h-screen bg-background text-foreground">
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md space-y-4">
              <OfflineWarning
                agentName={agent.name}
                onSelectAlternative={() => {
                  if (alternativeAgents.length > 0) {
                    setSelectedAlternative(alternativeAgents[0].id);
                  }
                }}
              />
              {alternativeAgents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available alternatives:</p>
                  {alternativeAgents.map((alt) => (
                    <Button
                      key={alt.id}
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setSelectedAlternative(alt.id)}
                    >
                      {alt.name}
                    </Button>
                  ))}
                </div>
              )}
              <Link href="/agents" className="block">
                <Button variant="ghost" className="w-full">
                  Browse All Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayAgentId = selectedAlternative || agentId;
  const displayAgent = agents.find((a) => a.id === displayAgentId);

  const handleSendRequest = async (payload: RequestPayload) => {
    const userMessage = {
      type: "user" as const,
      content: payload.request,
      timestamp: new Date().toISOString(),
    };
    addMessage(displayAgentId, userMessage);

    // Add loading indicator immediately
    const loadingMessage = {
      type: "loading" as const,
      content: "",
      timestamp: new Date().toISOString(),
      id: "loading-" + Date.now(),
    };
    addMessage(displayAgentId, loadingMessage);

    setLoading(true);
    try {
      const response = await submitSupervisorRequest(payload);
      
      // Debug logging
      console.log("Supervisor response:", JSON.stringify(response, null, 2));

      // Check if clarification is needed - check multiple possible fields
      const needsClarification = 
        response.status === "clarification_needed" ||
        (response as any).needs_clarification === true ||
        (response as any).is_ambiguous === true;
      
      // Get clarifying questions from various possible locations
      const questions = 
        response.clarifying_questions || 
        (response as any).clarifying_questions ||
        (response.intent_info as any)?.clarifying_questions ||
        [];

      if (needsClarification && questions.length > 0) {
        console.log("Showing clarification modal with questions:", questions);
        // Remove the loading message and show clarification modal
        removeMessage(displayAgentId, loadingMessage.id!);
        setClarifyingQuestions(questions);
        setPendingPayload(payload);
        setShowClarification(true);
        setLoading(false);
        return;
      }

      // Detect context for better formatting
      let context = "general";
      const responseData = typeof response.response === "string" 
        ? (() => { try { return JSON.parse(response.response); } catch { return null; } })()
        : response.response;
      
      if (responseData?.quiz_content || responseData?.questions) {
        context = "quiz";
      }

      // Handle both string and object responses and convert to natural language
      let content: string;
      if (typeof response.response === "string") {
        // Try to format if it's JSON, otherwise use as-is
        content = await formatResponseToChat(response.response, context);
      } else if (response.response && typeof response.response === "object") {
        // Convert object responses to natural language using Gemini
        content = await formatResponseToChat(response.response, context);
      } else {
        content = "No response content.";
      }

      const agentResponse = {
        type: "agent" as const,
        content,
        timestamp: response.timestamp,
        metadata: response.metadata,
      };
      // Replace loading message with actual response
      replaceLoadingMessage(displayAgentId, agentResponse);
    } catch (error) {
      // Format error messages into natural language as well
      const errorContent = await formatResponseToChat(
        error instanceof Error ? { error: error.message } : { error: "An unknown error occurred." },
        "error"
      );
      
      const errorMessage = {
        type: "error" as const,
        content: errorContent,
        timestamp: new Date().toISOString(),
      };
      // Replace loading message with error
      replaceLoadingMessage(displayAgentId, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSubmit = async (answer: string) => {
    if (!pendingPayload) return;
    setShowClarification(false);
    setClarifyingQuestions([]);
    
    // Create a new payload with the clarification answer appended
    const clarifiedPayload = {
      ...pendingPayload,
      request: `${pendingPayload.request}\n\nAdditional info: ${answer}`,
    };
    
    // Send the clarified request
    await handleSendRequest(clarifiedPayload);
    setPendingPayload(null);
  };

  const handleClarificationCancel = () => {
    setShowClarification(false);
    setClarifyingQuestions([]);
    setPendingPayload(null);
  };

  const renderChatWindow = () => (
    <ChatWindow
      agentId={displayAgentId}
      onToggleHistory={() => setShowHistory(!showHistory)}
      onToggleDetailPanel={() => setShowDetailPanel(!showDetailPanel)}
      onSendRequest={handleSendRequest}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <div className="flex-1 flex flex-col">
          {renderChatWindow()}
          <Sheet open={showHistory} onOpenChange={setShowHistory}>
            <SheetContent side="right" className="w-full max-w-md p-0">
              <HistoryPanel
                agentId={displayAgentId}
                onClose={() => setShowHistory(false)}
              />
            </SheetContent>
          </Sheet>
          <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
            <SheetContent side="left" className="w-full max-w-md p-0">
              {displayAgent && (
                <AgentDetailPanel
                  agent={displayAgent}
                  onClose={() => setShowDetailPanel(false)}
                />
              )}
            </SheetContent>
          </Sheet>
        </div>
        <ClarificationModal
          open={showClarification}
          questions={clarifyingQuestions}
          onCancel={handleClarificationCancel}
          onSubmit={handleClarificationSubmit}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {showDetailPanel && displayAgent && (
        <div className="w-96 border-r border-border">
          <AgentDetailPanel agent={displayAgent} />
        </div>
      )}
      <div className="flex-1 flex flex-col">{renderChatWindow()}</div>
      {showHistory && (
        <div className="w-96 border-l border-border">
          <HistoryPanel agentId={displayAgentId} />
        </div>
      )}
      <ClarificationModal
        open={showClarification}
        questions={clarifyingQuestions}
        onCancel={handleClarificationCancel}
        onSubmit={handleClarificationSubmit}
      />
    </div>
  );
}
