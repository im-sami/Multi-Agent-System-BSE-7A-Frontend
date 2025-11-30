"use client"

import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const { user, logout } = useUser()

  return (
    <div className="p-5 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-heading heading-gradient-soft">Education & Learning Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-Agent System</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
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
    </div>
  )
}
