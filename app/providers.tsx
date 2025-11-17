"use client"

import { AgentProvider } from "@/context/agent-context"
import { HistoryProvider } from "@/context/history-context"
import { InsightsProvider } from "@/context/insights-context"
import { ReminderProvider } from "@/context/reminder-context"
import { SettingsProvider } from "@/context/settings-context"
import { StudySessionProvider } from "@/context/study-session-context"
import { UserProvider } from "@/context/user-context"
import type React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AgentProvider>
        <HistoryProvider>
          <SettingsProvider>
            <StudySessionProvider>
              <ReminderProvider>
                <InsightsProvider>{children}</InsightsProvider>
              </ReminderProvider>
            </StudySessionProvider>
          </SettingsProvider>
        </HistoryProvider>
      </AgentProvider>
    </UserProvider>
  )
}
