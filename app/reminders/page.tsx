"use client"

import { useReminders } from "@/context/reminder-context"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Bell, BellOff, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getReminderStatus, logReminder, type Reminder, type ReminderStatus } from "@/lib/proctor-service"
import { useToast } from "@/hooks/use-toast"

export default function RemindersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch reminder status and recent reminders from API
  const fetchReminders = async () => {
    try {
      setLoading(true)
      const status = await getReminderStatus()
      setReminderStatus(status)
      // Use recent reminders from API
      setReminders(status.recent_reminders || [])
    } catch (error) {
      console.error("Failed to fetch reminders:", error)
      toast({
        title: "Error",
        description: "Failed to load reminders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load reminders on mount
  useEffect(() => {
    fetchReminders()
  }, [])

  const [formData, setFormData] = useState({
    message: "",
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "09:00",
    status: "SENT" as "SENT" | "DELIVERED" | "CLICKED" | "DISMISSED" | "FAILED",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}:00Z`
      
      const reminderData: Reminder = {
        user_id: 1, // This should come from auth context
        scheduled_time: scheduledDateTime,
        message: formData.message,
        status: formData.status
      }

      // Log reminder to API
      await logReminder(reminderData)
      
      toast({
        title: "Success",
        description: "Reminder created successfully"
      })
      
      // Refresh reminders list
      await fetchReminders()
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Failed to save reminder:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save reminder",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      message: "",
      description: "",
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "09:00",
      status: "SENT",
    })
  }

  const handleToggleStatus = async (reminder: Reminder) => {
    try {
      // Toggle between SENT and DISMISSED
      const newStatus = reminder.status === "DISMISSED" ? "SENT" : "DISMISSED"
      
      const updatedReminder: Reminder = {
        ...reminder,
        status: newStatus
      }
      
      await logReminder(updatedReminder)
      
      // Update local state
      setReminders(reminders.map(r => 
        r.id === reminder.id ? { ...r, status: newStatus } : r
      ))
      
      toast({
        title: "Success",
        description: `Reminder ${newStatus === "DISMISSED" ? "dismissed" : "activated"}`
      })
    } catch (error) {
      console.error("Failed to toggle reminder:", error)
    }
  }

  const activeReminders = reminders.filter((r) => r.status !== "DISMISSED" && r.status !== "FAILED")
    .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
  const inactiveReminders = reminders.filter((r) => r.status === "DISMISSED" || r.status === "FAILED")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground mt-1">Manage your study reminders and notifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g., Time to study Mathematics!"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Scheduled Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "SENT" | "DELIVERED" | "CLICKED" | "DISMISSED" | "FAILED" })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="SENT">Sent</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CLICKED">Clicked</option>
                  <option value="DISMISSED">Dismissed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Create"} Reminder
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Reminders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Active Reminders ({activeReminders.length})
          {reminderStatus && (
            <span className="text-sm text-muted-foreground font-normal ml-2">
              ({reminderStatus.total_reminders_30d} total in last 30 days)
            </span>
          )}
        </h2>
        <div className="space-y-3">
          {activeReminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No active reminders</p>
                <p className="text-sm text-muted-foreground">Create a reminder to stay on track</p>
              </CardContent>
            </Card>
          ) : (
            activeReminders.map((reminder) => {
              const scheduledDate = new Date(reminder.scheduled_time)
              const statusColors: Record<string, string> = {
                SENT: "bg-blue-100 text-blue-800",
                DELIVERED: "bg-green-100 text-green-800",
                CLICKED: "bg-purple-100 text-purple-800",
                DISMISSED: "bg-gray-100 text-gray-800",
                FAILED: "bg-red-100 text-red-800"
              }
              
              return (
                <Card key={reminder.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{reminder.message}</h3>
                          <Badge className={statusColors[reminder.status]}>
                            {reminder.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStatus(reminder)}
                          disabled={loading}
                        >
                          <BellOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Inactive/Dismissed Reminders */}
      {inactiveReminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dismissed Reminders ({inactiveReminders.length})</h2>
          <div className="space-y-3">
            {inactiveReminders.map((reminder) => {
              const scheduledDate = new Date(reminder.scheduled_time)
              return (
                <Card key={reminder.id} className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{reminder.message}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStatus(reminder)}
                          disabled={loading}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Reminder Statistics */}
      {reminderStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Reminder Statistics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(reminderStatus.status_counts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
