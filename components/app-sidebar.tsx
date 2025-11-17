"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  BookOpen,
  TrendingUp,
} from "lucide-react"

const navigation = [
  {
    name: "Main Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Progress Dashboard",
    href: "/progress",
    icon: TrendingUp,
  },
  {
    name: "Session Logging",
    href: "/sessions",
    icon: Calendar,
  },
  {
    name: "Reminders",
    href: "/reminders",
    icon: Bell,
  },
  {
    name: "Instructor Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Insights",
    href: "/insights",
    icon: BookOpen,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-semibold">StudyTracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info / footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium">Student User</p>
            <p className="text-xs text-muted-foreground">student@edu.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
