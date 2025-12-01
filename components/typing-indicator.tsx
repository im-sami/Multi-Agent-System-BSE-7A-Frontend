"use client"

import { Bot } from "lucide-react"

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="inline-flex items-center gap-1 px-4 py-3 rounded-2xl bg-muted">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Agent is thinking...</span>
        </div>
      </div>
    </div>
  )
}
