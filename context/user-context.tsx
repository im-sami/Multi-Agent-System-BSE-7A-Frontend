"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface UserContextType {
  user: User | null
  login: (email: string) => void
  logout: () => void
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Mock users for simulation
const MOCK_USERS: User[] = [
  { id: "user1", name: "Alice", email: "alice@example.com", avatar: "/avatars/01.png" },
  { id: "user2", name: "Bob", email: "bob@example.com", avatar: "/avatars/02.png" },
  { id: "user3", name: "Charlie", email: "charlie@example.com", avatar: "/avatars/03.png" },
]

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate checking for a logged-in user in localStorage
    const storedUser = localStorage.getItem("current-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        console.error("Failed to load user from localStorage")
      }
    }
    setLoading(false)
  }, [])

  const login = (email: string) => {
    const foundUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("current-user", JSON.stringify(foundUser))
    } else {
      // For simplicity, create a new user if not found
      const newUser: User = {
        id: `user${MOCK_USERS.length + 1}`,
        name: email.split("@")[0],
        email: email,
        avatar: `/avatars/04.png`, // Default avatar for new users
      }
      MOCK_USERS.push(newUser)
      setUser(newUser)
      localStorage.setItem("current-user", JSON.stringify(newUser))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("current-user")
    // Also clear other user-specific data
    // Note: This is a simple approach. A more robust solution would iterate
    // through all keys and remove the ones associated with the user.
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("agent-history-") || key.startsWith("agent-settings-")) {
        localStorage.removeItem(key)
      }
    })
  }

  return <UserContext.Provider value={{ user, login, logout, loading }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
