"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MetricCard } from "@/components/metric-card"
import { LineChartComponent } from "@/components/charts/line-chart"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { Users, TrendingDown, Award, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import {
  getUserProgress,
  getConsistencyTrends,
  getUserProfile,
  getOptimalStudyTimes,
  getUserReminderData,
  listStudySessions,
  type UserProgress,
  type ConsistencyTrends,
  type UserProfile,
  type OptimalStudyTimes,
  type UserReminderData,
  type StudySession
} from "@/lib/proctor-service"

export default function AnalyticsPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [consistencyData, setConsistencyData] = useState<ConsistencyTrends | null>(null)
  const [loading, setLoading] = useState(false)

  // Proctor AI JSON state
  const [proctorJson, setProctorJson] = useState<any | null>(null)
  const [feedback, setFeedback] = useState({ reminder_effectiveness: '', motivation_level: '' })
  const [showFeedback, setShowFeedback] = useState(false)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [progress, consistency] = await Promise.all([
          getUserProgress(30),
          getConsistencyTrends(30)
        ])
        setUserProgress(progress)
        setConsistencyData(consistency)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  // Build Proctor AI JSON
  const handleBuildProctorJson = async () => {
    setError(null)
    setBuilding(true)
    setShowFeedback(false)
    setProctorJson(null)
    try {
      // 1. Get user profile
      const user: UserProfile = await getUserProfile()
      // 2. Get optimal study times
      const optimal: OptimalStudyTimes = await getOptimalStudyTimes()
      // 3. Get reminder data
      const reminderData: UserReminderData = await getUserReminderData(user.id)
      // 4. Get sessions (first 100 for demo)
      const sessionsResp = await listStudySessions({ page: 1, page_size: 100 })
      const sessions: StudySession[] = sessionsResp.items || []

      // Show feedback form before building JSON
      setShowFeedback(true)
      setBuilding(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to build Proctor AI JSON')
      setBuilding(false)
    }
  }

  // Actually build JSON after feedback
  const handleSubmitFeedback = async () => {
    setError(null)
    setBuilding(true)
    try {
      // 1. Get user profile
      const user: UserProfile = await getUserProfile()
      // 2. Get optimal study times
      const optimal: OptimalStudyTimes = await getOptimalStudyTimes()
      // 3. Get reminder data
      const reminderData: UserReminderData = await getUserReminderData(user.id)
      // 4. Get sessions (first 100 for demo)
      const sessionsResp = await listStudySessions({ page: 1, page_size: 100 })
      const sessions: StudySession[] = sessionsResp.items || []

      // Build activity_log
      const activity_log = sessions.map((s) => ({
        date: s.session_date ? s.session_date.split('T')[0] : '',
        subject: s.course_name,
        hours: s.duration_minutes ? +(s.duration_minutes / 60).toFixed(2) : 0,
        status: 'completed' // Could be improved if status exists
      }))

      // Build JSON
      const json = {
        student_id: String(user.id),
        profile: {
          full_name: user.full_name,
          email: user.email
        },
        study_schedule: {
          preferred_times: optimal.preferred_hours?.map(h => `${h.toString().padStart(2, '0')}:00`) || [],
          daily_goal_hours: reminderData.total_minutes_30d ? +(reminderData.total_minutes_30d / 30 / 60).toFixed(2) : 2.0
        },
        activity_log,
        user_feedback: {
          reminder_effectiveness: Number(feedback.reminder_effectiveness),
          motivation_level: feedback.motivation_level
        },
        context: {
          request_type: 'weekly_analysis',
          supervisor_id: 'supervisor_001',
          priority: 'normal'
        }
      }
      setProctorJson(json)
      setShowFeedback(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to build Proctor AI JSON')
    } finally {
      setBuilding(false)
    }
  }

  // Calculate class stats from API data
  const classStats = {
    totalStudents: 45, // This would come from a class endpoint
    averageStudyTime: userProgress?.total_hours || 12.5,
    topPerformer: 8,
    atRiskStudents: 5,
  }

  // Transform consistency data for charts
  const classConsistencyData = consistencyData?.weekly_trends.map((week, index) => ({
    week: `Week ${index + 1}`,
    avgHours: Math.round(week.total_minutes / 60),
    participation: Math.round((week.days_active / 7) * 100)
  })) || [
    { week: "Week 1", avgHours: 8, participation: 85 },
    { week: "Week 2", avgHours: 10, participation: 90 },
    { week: "Week 3", avgHours: 12, participation: 88 },
    { week: "Week 4", avgHours: 11, participation: 92 },
    { week: "Week 5", avgHours: 13, participation: 95 },
    { week: "Week 6", avgHours: 12.5, participation: 93 },
  ]

  // Calculate performance distribution from user progress
  const performanceDistribution = userProgress?.courses.reduce((acc, course) => {
    const hours = course.total_minutes / 60
    let range = "20+h"
    if (hours < 5) range = "0-5h"
    else if (hours < 10) range = "5-10h"
    else if (hours < 15) range = "10-15h"
    else if (hours < 20) range = "15-20h"
    
    const existing = acc.find(item => item.range === range)
    if (existing) existing.count++
    else acc.push({ range, count: 1 })
    return acc
  }, [] as Array<{ range: string; count: number }>) || [
    { range: "0-5h", count: 5 },
    { range: "5-10h", count: 12 },
    { range: "10-15h", count: 18 },
    { range: "15-20h", count: 8 },
    { range: "20+h", count: 2 },
  ]

  const atRiskStudents = [
    { id: "1", identifier: "Student A", hours: 2.5, lastSession: "3 days ago", trend: "down" },
    { id: "2", identifier: "Student B", hours: 3.0, lastSession: "5 days ago", trend: "down" },
    { id: "3", identifier: "Student C", hours: 4.2, lastSession: "2 days ago", trend: "down" },
    { id: "4", identifier: "Student D", hours: 1.8, lastSession: "7 days ago", trend: "down" },
    { id: "5", identifier: "Student E", hours: 3.5, lastSession: "4 days ago", trend: "down" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Proctor AI JSON Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Proctor AI Data Builder</CardTitle>
          <CardDescription>Build and review the JSON payload for Proctor AI</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleBuildProctorJson}
            disabled={building}
          >
            {building ? 'Building...' : 'Build Proctor AI JSON'}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {showFeedback && (
            <form
              className="mt-4 space-y-4 p-4 border rounded bg-gray-50"
              onSubmit={e => { e.preventDefault(); handleSubmitFeedback(); }}
            >
              <div>
                <label className="block font-medium mb-1">Reminder Effectiveness (1-5):</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  className="border px-2 py-1 rounded w-24"
                  value={feedback.reminder_effectiveness}
                  onChange={e => setFeedback(f => ({ ...f, reminder_effectiveness: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Motivation Level:</label>
                <select
                  required
                  className="border px-2 py-1 rounded"
                  value={feedback.motivation_level}
                  onChange={e => setFeedback(f => ({ ...f, motivation_level: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={building}
              >
                {building ? 'Building...' : 'Submit Feedback & Build JSON'}
              </button>
            </form>
          )}
          {proctorJson && (
            <div className="mt-6">
              <div className="font-semibold mb-2">Generated JSON:</div>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
                {JSON.stringify(proctorJson, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your study statistics and performance trends</p>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading analytics data...</p>
          </CardContent>
        </Card>
      )}

      {/* User Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Sessions" 
          value={userProgress?.total_sessions || 0} 
          icon={Users} 
          description="Last 30 days" 
        />
        <MetricCard
          title="Study Hours"
          value={`${userProgress?.total_hours.toFixed(1) || 0}h`}
          icon={TrendingDown}
          description="Total study time"
          trend={userProgress && { value: 5, isPositive: true }}
        />
        <MetricCard
          title="Sessions/Week"
          value={userProgress?.sessions_per_week.toFixed(1) || 0}
          icon={Award}
          description="Weekly average"
        />
        <MetricCard
          title="Consistency"
          value={`${consistencyData?.consistency_percentage.toFixed(0) || 0}%`}
          icon={AlertTriangle}
          description="Study days ratio"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          title="Weekly Consistency Trends"
          description="Your study hours and consistency over time"
          data={classConsistencyData}
          xKey="week"
          lines={[
            { dataKey: "avgHours", stroke: "#3b82f6", name: "Study Hours" },
            { dataKey: "participation", stroke: "#10b981", name: "Consistency %" },
          ]}
        />
        <BarChartComponent
          title="Course Distribution"
          description="Study time across different courses"
          data={userProgress?.courses.slice(0, 5).map(course => ({
            name: course.course_name,
            hours: Math.round(course.total_minutes / 60)
          })) || []}
          xKey="name"
          bars={[{ dataKey: "hours", fill: "#8b5cf6", name: "Hours" }]}
        />
      </div>

      {/* Daily Activity */}
      {consistencyData && consistencyData.daily_data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Study Activity</CardTitle>
            <CardDescription>Your study sessions over the last {consistencyData.period_days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consistencyData.daily_data.slice(-7).reverse().map((day) => (
                <div key={day.date} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      {day.sessions > 0 && (
                        <Badge variant="default">{day.sessions} session{day.sessions > 1 ? 's' : ''}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{Math.round(day.total_minutes / 60)}h {day.total_minutes % 60}m total</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.sessions > 0 ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>AI-generated observations about your study patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userProgress && userProgress.total_sessions > 0 ? (
            <>
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ You've completed {userProgress.total_sessions} study sessions in the last 30 days
                </p>
              </div>
              {consistencyData && consistencyData.consistency_percentage < 50 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    ⚠ Your consistency is {consistencyData.consistency_percentage.toFixed(0)}% - try to study more regularly
                  </p>
                </div>
              )}
              {userProgress.avg_session_duration_minutes > 90 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    ℹ Your average session is {Math.round(userProgress.avg_session_duration_minutes)} minutes - great focus!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ℹ Start logging study sessions to receive personalized insights
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
