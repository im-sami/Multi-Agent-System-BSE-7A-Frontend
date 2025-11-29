"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useHistory } from "@/context/history-context";
import { submitSupervisorRequest } from "@/lib/api-service";
import { type RequestPayload } from "@/types";
import ExamReadinessForm from "@/components/agents/exam-readiness-form";

interface RequestComposerProps {
  agentId: string;
  onSend: (payload: RequestPayload) => Promise<void>;
  disabled?: boolean;
}

export default function RequestComposer({ agentId, onSend, disabled }: RequestComposerProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [priority, setPriority] = useState(5)
  const [autoRoute, setAutoRoute] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addMessage } = useHistory()

  // Check if this is the exam readiness agent - show specialized form
  const isExamReadinessAgent = agentId === "exam_readiness_agent" || agentId === "exam-readiness-agent"
  
  // For exam readiness agent, show the specialized form
  if (isExamReadinessAgent) {
    return <ExamReadinessForm agentId={agentId} onSend={onSend} disabled={disabled} />
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading || disabled) return;

      const request = input.trim();
      setInput("");
      setLoading(true);

    const payload: RequestPayload = {
      // When autoRoute is true we avoid providing an explicit agentId by
      // using an empty string. The backend treats a falsy/empty agentId
      // as 'no explicit agent' and will perform intent identification.
      agentId: autoRoute ? "" : agentId,
      request,
      priority,
      autoRoute,
      modelOverride: null,
    }

    try {
      if (typeof onSend !== "function") {
        console.error("RequestComposer: onSend is not a function", onSend, { payload, agentId })
        addMessage(agentId, {
          type: "error",
          content: `Internal error: send handler is not callable`,
          timestamp: new Date().toISOString(),
        })
        return
      }
      await onSend(payload)
    } catch (error) {
      addMessage(agentId, {
        type: "error",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, disabled, priority, autoRoute, agentId, onSend, addMessage])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        inputRef.current === document.activeElement
      ) {
        handleSubmit(e as any);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label
            htmlFor="priority"
            className="text-xs font-medium text-muted-foreground min-w-fit"
          >
            Priority:
          </label>
          <input
            id="priority"
            type="range"
            min="1"
            max="10"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            disabled={loading || disabled}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer focus-ring"
            aria-label="Request priority"
          />
          <span className="text-xs font-semibold text-primary min-w-fit">
            {priority}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-route"
            checked={autoRoute}
            onChange={(e) => setAutoRoute(e.target.checked)}
            disabled={loading || disabled}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="auto-route"
            className="text-xs font-medium text-muted-foreground"
          >
            Auto-Route
          </label>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your request... (Ctrl+Enter to send)"
          disabled={loading || disabled}
          rows={3}
          className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 resize-none"
          aria-label="Request input"
        />
        <Button
          type="submit"
          disabled={loading || disabled || !input.trim()}
          size="icon"
          className="focus-ring"
          aria-label="Send request"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Tip: Use Ctrl+Enter to quickly send your request
      </p>
    </form>
  );
}
