"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface StudySession {
  id: string
  date: string
  startTime: string
  duration: number // in minutes
  courseId: string
  courseName: string
  notes?: string
  createdAt: string
}

interface StudySessionContextType {
  sessions: StudySession[]
  addSession: (session: Omit<StudySession, "id" | "createdAt">) => void
  updateSession: (id: string, session: Partial<StudySession>) => void
  deleteSession: (id: string) => void
  getSessionsByCourse: (courseId: string) => StudySession[]
  getSessionsByDateRange: (startDate: string, endDate: string) => StudySession[]
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined)

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("study-sessions")
    if (stored) {
      try {
        setSessions(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse stored sessions", e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("study-sessions", JSON.stringify(sessions))
  }, [sessions])

  const addSession = (session: Omit<StudySession, "id" | "createdAt">) => {
    const newSession: StudySession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setSessions((prev: StudySession[]) => [...prev, newSession])
  }

  const updateSession = (id: string, updatedFields: Partial<StudySession>) => {
    setSessions((prev: StudySession[]) =>
      prev.map((s: StudySession) => (s.id === id ? { ...s, ...updatedFields } : s))
    )
  }

  const deleteSession = (id: string) => {
    setSessions((prev: StudySession[]) => prev.filter((s: StudySession) => s.id !== id))
  }

  const getSessionsByCourse = (courseId: string) => {
    return sessions.filter((s: StudySession) => s.courseId === courseId)
  }

  const getSessionsByDateRange = (startDate: string, endDate: string) => {
    return sessions.filter((s: StudySession) => s.date >= startDate && s.date <= endDate)
  }

  return (
    <StudySessionContext.Provider
      value={{
        sessions,
        addSession,
        updateSession,
        deleteSession,
        getSessionsByCourse,
        getSessionsByDateRange,
      }}
    >
      {children}
    </StudySessionContext.Provider>
  )
}

export function useStudySessions() {
  const context = useContext(StudySessionContext)
  if (!context) {
    throw new Error("useStudySessions must be used within StudySessionProvider")
  }
  return context
}
