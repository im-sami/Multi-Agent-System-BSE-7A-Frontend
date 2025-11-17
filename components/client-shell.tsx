"use client"

import { usePathname } from "next/navigation"
import React from "react"
import { AppSidebar } from "./app-sidebar"

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""

  // Hide the sidebar for auth-related routes (login and any nested auth pages).
  const hideSidebar = pathname.startsWith("/login") || pathname.startsWith("/auth")

  return (
    <div className="flex h-screen overflow-hidden">
      {!hideSidebar && <AppSidebar />}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}
