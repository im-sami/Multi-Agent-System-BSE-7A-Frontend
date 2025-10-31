export interface Agent {
  id: string
  name: string
  description: string
  capabilities?: string[]
}

export interface Message {
  type: "user" | "agent" | "error"
  content: string
  timestamp: string
}
