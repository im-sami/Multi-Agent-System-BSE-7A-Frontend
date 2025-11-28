"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ClarificationModalProps {
  open: boolean
  questions: (string | { field?: string; question?: string; text?: string; message?: string })[]
  onCancel: () => void
  onSubmit: (answer: string) => void
}

// Helper to normalize question format - handles both string and object formats
function getQuestionText(q: string | { field?: string; question?: string; text?: string; message?: string }): string {
  if (typeof q === 'string') return q
  if (typeof q === 'object' && q !== null) {
    return q.question || q.text || q.message || JSON.stringify(q)
  }
  return String(q)
}

export default function ClarificationModal({ open, questions, onCancel, onSubmit }: ClarificationModalProps) {
  const [answer, setAnswer] = useState("")

  if (!open) return null

  // Normalize questions to strings
  const normalizedQuestions = questions.map(getQuestionText)

  const handleSubmit = () => {
    const trimmedAnswer = answer.trim()
    if (trimmedAnswer) {
      onSubmit(trimmedAnswer)
      setAnswer("") // Clear the input after submit
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-lg font-semibold mb-3">I need a little more information</h2>
        <p className="text-sm text-muted-foreground mb-4">Please provide more details to help me assist you better:</p>

        <div className="space-y-2 mb-4">
          {normalizedQuestions.map((q, i) => (
            <div
              key={i}
              className="w-full text-left p-3 rounded-md border border-border bg-muted/50 text-muted-foreground"
            >
              • {q}
            </div>
          ))}
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full min-h-[88px] p-2 border border-border rounded-md bg-background text-foreground mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && answer.trim()) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!answer.trim()}>Send</Button>
        </div>
      </div>
    </div>
  )
}
