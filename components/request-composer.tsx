"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { useHistory } from "@/context/history-context"
import { submitRequest } from "@/lib/api-service"

interface RequestComposerProps {
  agentId: string
  onSend: (request: string) => Promise<void>
  disabled?: boolean
}

export default function RequestComposer({ agentId, onSend, disabled }: RequestComposerProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [priority, setPriority] = useState(5)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addMessage } = useHistory()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && inputRef.current === document.activeElement) {
        handleSubmit(e as any)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [input, loading, disabled])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || disabled) return

    const request = input.trim()
    setInput("")
    setLoading(true)

    try {
      await onSend(request)
    } catch (error) {
      addMessage(agentId, {
        type: "error",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Priority Slider */}
      <div className="flex items-center gap-3">
        <label htmlFor="priority" className="text-xs font-medium text-muted-foreground min-w-fit">
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
        <span className="text-xs font-semibold text-primary min-w-fit">{priority}</span>
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
      <p className="text-xs text-muted-foreground">Tip: Use Ctrl+Enter to quickly send your request</p>
    </form>
  )
}
