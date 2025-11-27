"use client"

import { BarChartComponent } from "@/components/charts/bar-chart"
import { HeatmapComponent } from "@/components/charts/heatmap"
import { LineChartComponent } from "@/components/charts/line-chart"
import { PieChartComponent } from "@/components/charts/pie-chart"
import { MetricCard } from "@/components/metric-card"
import {
    getChatbotStatus,
    getConsistencyTrends,
    getReminderStatus,
    getUserProgress,
    type ChatbotStatus,
    type ConsistencyTrends,
    type ReminderStatus,
    type UserProgress
} from "@/lib/proctor-service"
import { BookOpen, Calendar, Clock, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export default function ProgressPage() {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [consistencyData, setConsistencyData] = useState<ConsistencyTrends | null>(null)
  const [chatbotStatus, setChatbotStatus] = useState<ChatbotStatus | null>(null)
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch progress data from API
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true)
        const [progress, consistency, status, reminders] = await Promise.all([
          getUserProgress(30),
          getConsistencyTrends(30),
          getChatbotStatus(),
          getReminderStatus()
        ])
        setUserProgress(progress)
        setConsistencyData(consistency)
        setChatbotStatus(status)
        setReminderStatus(reminders)
      } catch (error) {
        console.error("Failed to fetch progress data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProgressData()
  }, [])

  // Calculate metrics from API data
  const totalStudyHours = userProgress?.total_hours ?? 0
  const sessionsThisWeek = chatbotStatus?.total_sessions ?? 0
  const avgSessionDuration = userProgress?.avg_session_duration_minutes ?? 0
  const activeRemindersCount = reminderStatus?.total_reminders_30d ?? 0

  // Prepare weekly progress data from consistency trends
  const weeklyProgressData = useMemo(() => {
    if (!consistencyData?.weekly_trends?.length) return []
    
    return consistencyData.weekly_trends.map((week) => ({
      week: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: week.sessions,
      hours: Math.round(week.total_minutes / 60 * 10) / 10
    }))
  }, [consistencyData])

  // Prepare course distribution data from user progress
  const courseDistributionData = useMemo(() => {
    if (!userProgress?.courses?.length) return []
    
    return userProgress.courses.map((course) => ({
      name: course.course_name,
      value: course.session_count
    }))
  }, [userProgress])

  // Prepare consistency heatmap from daily data
  const consistencyHeatmapData = useMemo(() => {
    if (!consistencyData?.daily_data?.length) return []
    
    return consistencyData.daily_data.map((day) => ({
      date: day.date,
      value: day.sessions
    }))
  }, [consistencyData])

  // Prepare monthly trend data from weekly trends
  const monthlyTrendData = useMemo(() => {
    if (!consistencyData?.weekly_trends?.length) return []
    
    return consistencyData.weekly_trends.map((week) => ({
      month: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short' }),
      sessions: week.sessions,
      performance: Math.round((week.days_active / 7) * 100)
    }))
  }, [consistencyData])

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Progress Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your study progress and performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Study Hours"
          value={Math.round(totalStudyHours)}
          icon={Clock}
          description="Last 30 days"
        />
        <MetricCard
          title="Total Sessions"
          value={sessionsThisWeek}
          icon={Calendar}
          description="All time"
        />
        <MetricCard
          title="Avg Session Duration"
          value={`${Math.round(avgSessionDuration)}m`}
          icon={TrendingUp}
          description="Minutes per session"
        />
        <MetricCard
          title="Reminders Sent"
          value={activeRemindersCount}
          icon={BookOpen}
          description="Last 30 days"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          title="Study Consistency Trends"
          description="Your study sessions over recent weeks"
          data={monthlyTrendData}
          xKey="month"
          lines={[
            { dataKey: "sessions", stroke: "#3b82f6", name: "Sessions" },
            { dataKey: "performance", stroke: "#10b981", name: "Active Days %" },
          ]}
        />
        <BarChartComponent
          title="Weekly Progress"
          description="Sessions and hours per week"
          data={weeklyProgressData}
          xKey="week"
          bars={[
            { dataKey: "sessions", fill: "#3b82f6", name: "Sessions" },
            { dataKey: "hours", fill: "#10b981", name: "Hours" }
          ]}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <PieChartComponent
          title="Course Distribution"
          description="Sessions across different courses"
          data={courseDistributionData}
          colors={colors}
        />
        <HeatmapComponent
          title="Study Activity Heatmap"
          description="Daily study consistency pattern"
          data={consistencyHeatmapData}
          maxValue={Math.max(...(consistencyHeatmapData.map(d => d.value) || [5]))}
        />
      </div>
    </div>
  )
}
