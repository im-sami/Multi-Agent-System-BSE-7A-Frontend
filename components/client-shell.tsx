"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { AppSidebar } from "./app-sidebar"

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""

  // Hide the sidebar for auth-related routes (login and any nested auth pages).
  const hideSidebar = pathname.startsWith("/login") || pathname.startsWith("/auth")
  
  // Show Study Tracker sidebar for daily_revision_proctor_agent and all related pages
  const studyTrackerRoutes = [
    "/agent/daily_revision_proctor_agent",
    "/progress",
    "/sessions",
    "/reminders",
    "/analytics",
    "/insights",
    "/settings"
  ]
  const showStudyTrackerSidebar = studyTrackerRoutes.some(route => pathname.startsWith(route))

  return (
    <div className="flex h-screen overflow-hidden">
      {!hideSidebar && showStudyTrackerSidebar && <AppSidebar />}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
