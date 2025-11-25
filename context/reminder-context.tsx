"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  dueTime?: string
  isActive: boolean
  courseId?: string
  recurring?: "daily" | "weekly" | "none"
  createdAt: string
}

interface ReminderContextType {
  reminders: Reminder[]
  addReminder: (reminder: Omit<Reminder, "id" | "createdAt">) => void
  updateReminder: (id: string, reminder: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  getActiveReminders: () => Reminder[]
  toggleReminder: (id: string) => void
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined)

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("reminders")
    if (stored) {
      try {
        setReminders(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse reminders", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders))
  }, [reminders])

  const addReminder = (reminder: Omit<Reminder, "id" | "createdAt">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setReminders((prev: Reminder[]) => [...prev, newReminder])
  }

  const updateReminder = (id: string, updatedFields: Partial<Reminder>) => {
    setReminders((prev: Reminder[]) =>
      prev.map((r: Reminder) => (r.id === id ? { ...r, ...updatedFields } : r))
    )
  }

  const deleteReminder = (id: string) => {
    setReminders((prev: Reminder[]) => prev.filter((r: Reminder) => r.id !== id))
  }

  const getActiveReminders = () => {
    return reminders.filter((r: Reminder) => r.isActive)
  }

  const toggleReminder = (id: string) => {
    setReminders((prev: Reminder[]) =>
      prev.map((r: Reminder) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    )
  }

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        getActiveReminders,
        toggleReminder,
      }}
    >
      {children}
    </ReminderContext.Provider>
  )
}

export function useReminders() {
  const context = useContext(ReminderContext)
  if (!context) {
    throw new Error("useReminders must be used within ReminderProvider")
  }
  return context
}
