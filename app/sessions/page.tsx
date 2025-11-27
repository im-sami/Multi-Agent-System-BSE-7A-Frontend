"use client"

import { useStudySessions } from "@/context/study-session-context"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, Clock, Search, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  listStudySessions, 
  createStudySession, 
  updateStudySession as updateSessionAPI, 
  deleteStudySession,
  getStudySession,
  type StudySession,
  type PaginatedSessions 
} from "@/lib/proctor-service"
import { useToast } from "@/hooks/use-toast"

export default function SessionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch sessions from API
  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await listStudySessions({ page: 1, page_size: 100 })
      setSessions(response.items)
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load study sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Load sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    duration: 60,
    courseId: "",
    courseName: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const sessionData: StudySession = {
        course_name: formData.courseName,
        duration_minutes: formData.duration,
        session_date: `${formData.date}T${formData.startTime}:00Z`,
        notes: formData.notes
      }

      if (editingSession) {
        // Update existing session
        await updateSessionAPI(editingSession, sessionData)
        toast({
          title: "Success",
          description: "Study session updated successfully"
        })
      } else {
        // Create new session
        await createStudySession(sessionData)
        toast({
          title: "Success",
          description: "Study session created successfully"
        })
      }
      
      // Refresh sessions list
      await fetchSessions()
      
      setIsDialogOpen(false)
      setEditingSession(null)
      resetForm()
    } catch (error) {
      console.error("Failed to save session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save study session",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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

  const handleEdit = async (sessionId: number) => {
    try {
      // Fetch session details from API
      const session = await getStudySession(sessionId)
      
      // Parse session date to extract date and time
      const sessionDate = new Date(session.session_date || "")
      const date = sessionDate.toISOString().split("T")[0]
      const startTime = sessionDate.toTimeString().slice(0, 5)
      
      setFormData({
        date: date,
        startTime: startTime,
        duration: session.duration_minutes,
        courseId: session.course_name.toLowerCase().replace(/\s+/g, "-"),
        courseName: session.course_name,
        notes: session.notes || "",
      })
      setEditingSession(sessionId)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Failed to load session:", error)
      toast({
        title: "Error",
        description: "Failed to load session details",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return
    }
    
    try {
      setLoading(true)
      await deleteStudySession(sessionId)
      toast({
        title: "Success",
        description: "Study session deleted successfully"
      })
      // Refresh sessions list
      await fetchSessions()
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast({
        title: "Error",
        description: "Failed to delete study session",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter sessions
  const filteredSessions = sessions
    .filter((s) => {
      if (searchQuery && !s.course_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterCourse !== "all" && s.course_name.toLowerCase().replace(/\s+/g, "-") !== filterCourse) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.session_date || "").getTime()
      const dateB = new Date(b.session_date || "").getTime()
      return dateB - dateA
    })

  // Get unique courses
  const courses = Array.from(new Set(sessions.map((s) => s.course_name)))

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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingSession ? "Update" : "Create"} Session
                </Button>
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
          filteredSessions.map((session) => {
            const sessionDate = new Date(session.session_date || "")
            const hours = Math.floor(session.duration_minutes / 60)
            const minutes = session.duration_minutes % 60
            const timeStr = sessionDate.toTimeString().slice(0, 5)
            
            return (
              <Card key={session.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{session.course_name}</h3>
                        <Badge variant="secondary">
                          {hours > 0 && `${hours}h `}{minutes}m
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {sessionDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {timeStr}
                        </span>
                      </div>
                      {session.notes && <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(session.id!)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(session.id!)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
  )
}
