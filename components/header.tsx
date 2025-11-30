"use client"

import { Settings, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import SettingsDialog from "./settings-dialog"
import { useState } from "react"
import { useUser } from "@/context/user-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  onToggleSidebar?: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const { user, logout } = useUser()

  return (
    <>
      <div className="p-5 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-heading heading-gradient-soft">Education & Learning Agents</h1>
            <p className="text-sm text-muted-foreground mt-1">Multi-Agent System</p>
          </div>
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              title="Toggle sidebar"
              className="focus-ring"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-4 md:p-5 flex justify-end items-center gap-4 border-b border-border">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="focus-ring"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
