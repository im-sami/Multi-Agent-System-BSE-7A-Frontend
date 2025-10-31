"use client"

interface ChatMessageProps {
  message: {
    type: "user" | "agent" | "error"
    content: any
    timestamp: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === "user"
  const isError = message.type === "error"

  const renderContent = () => {
    if (typeof message.content === "string") {
      return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    }
    // Fallback for any other content type
    return <p className="text-sm whitespace-pre-wrap">{JSON.stringify(message.content)}</p>
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
          isError
            ? "bg-destructive text-destructive-foreground"
            : isUser
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {renderContent()}
        <p className="text-xs opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
      </div>
    </div>
  )
}
