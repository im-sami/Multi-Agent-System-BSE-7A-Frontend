"use client"

import { useReminders } from "@/context/reminder-context"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Bell, BellOff, Edit, Trash2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export default function RemindersPage() {
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useReminders()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "09:00",
    isActive: true,
    courseId: "",
    recurring: "none" as "daily" | "weekly" | "none",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingReminder) {
      updateReminder(editingReminder, formData)
      setEditingReminder(null)
    } else {
      addReminder(formData)
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "09:00",
      isActive: true,
      courseId: "",
      recurring: "none",
    })
  }

  const handleEdit = (reminderId: string) => {
    const reminder = reminders.find((r) => r.id === reminderId)
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description || "",
        dueDate: reminder.dueDate,
        dueTime: reminder.dueTime || "09:00",
        isActive: reminder.isActive,
        courseId: reminder.courseId || "",
        recurring: reminder.recurring || "none",
      })
      setEditingReminder(reminderId)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (reminderId: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      deleteReminder(reminderId)
    }
  }

  const activeReminders = reminders.filter((r) => r.isActive).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const inactiveReminders = reminders.filter((r) => !r.isActive)

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
                setEditingReminder(null)
                resetForm()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingReminder ? "Edit Reminder" : "New Reminder"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Review Chapter 5"
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurring">Recurring</Label>
                <select
                  id="recurring"
                  value={formData.recurring}
                  onChange={(e) =>
                    setFormData({ ...formData, recurring: e.target.value as "daily" | "weekly" | "none" })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="none">No recurrence</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingReminder ? "Update" : "Create"} Reminder</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Reminders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Reminders ({activeReminders.length})</h2>
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
            activeReminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{reminder.title}</h3>
                        {reminder.recurring && reminder.recurring !== "none" && (
                          <Badge variant="outline">{reminder.recurring}</Badge>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(reminder.dueDate).toLocaleDateString()} {reminder.dueTime && `at ${reminder.dueTime}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleReminder(reminder.id)}>
                        <BellOff className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(reminder.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(reminder.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Inactive Reminders */}
      {inactiveReminders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Inactive Reminders ({inactiveReminders.length})</h2>
          <div className="space-y-3">
            {inactiveReminders.map((reminder) => (
              <Card key={reminder.id} className="opacity-60">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{reminder.title}</h3>
                      {reminder.description && <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleReminder(reminder.id)}>
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(reminder.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
