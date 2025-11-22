"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ClarificationModalProps {
  open: boolean
  questions: string[]
  onCancel: () => void
  onSubmit: (answer: string) => void
}

export default function ClarificationModal({ open, questions, onCancel, onSubmit }: ClarificationModalProps) {
  const [answer, setAnswer] = useState("")

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-lg font-semibold mb-3">I need a little more information</h2>
        <p className="text-sm text-muted-foreground mb-4">Please answer one of the questions below or type your details.</p>

        <div className="space-y-2 mb-4">
          {questions.map((q, i) => (
            <button
              key={i}
              className="w-full text-left p-3 rounded-md border border-border hover:bg-muted"
              onClick={() => onSubmit(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Or type your clarification here..."
          className="w-full min-h-[88px] p-2 border border-border rounded-md bg-background text-foreground mb-4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSubmit(answer)} disabled={!answer.trim()}>Send</Button>
        </div>
      </div>
    </div>
  )
}
