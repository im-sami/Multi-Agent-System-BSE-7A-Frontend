"use client"

import { useStudySessions } from "@/context/study-session-context"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, Clock, Search, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function SessionsPage() {
  const { sessions, addSession, updateSession, deleteSession } = useStudySessions()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCourse, setFilterCourse] = useState<string>("all")

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    duration: 60,
    courseId: "",
    courseName: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSession) {
      updateSession(editingSession, formData)
      setEditingSession(null)
    } else {
      addSession(formData)
    }
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      duration: 60,
      courseId: "",
      courseName: "",
      notes: "",
    })
  }

  const handleEdit = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      setFormData({
        date: session.date,
        startTime: session.startTime,
        duration: session.duration,
        courseId: session.courseId,
        courseName: session.courseName,
        notes: session.notes || "",
      })
      setEditingSession(sessionId)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      deleteSession(sessionId)
    }
  }

  // Filter sessions
  const filteredSessions = sessions
    .filter((s) => {
      if (searchQuery && !s.courseName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterCourse !== "all" && s.courseId !== filterCourse) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get unique courses
  const courses = Array.from(new Set(sessions.map((s) => s.courseName)))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Session Logging</h1>
          <p className="text-muted-foreground mt-1">Track and manage your study sessions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSession(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingSession ? "Edit Session" : "New Study Session"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={formData.courseName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      courseName: e.target.value,
                      courseId: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  placeholder="e.g., Software Engineering"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What did you study?"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSession ? "Update" : "Create"} Session</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by course name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course.toLowerCase().replace(/\s+/g, "-")}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No sessions found</p>
              <p className="text-sm text-muted-foreground">Create your first study session to get started</p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{session.courseName}</h3>
                      <Badge variant="secondary">{Math.round(session.duration / 60)}h {session.duration % 60}m</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.startTime}
                      </span>
                    </div>
                    {session.notes && <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(session.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(session.id)}>
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
  )
}
