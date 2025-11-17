"use client"

import { useStudySessions } from "@/context/study-session-context"
import { useReminders } from "@/context/reminder-context"
import { MetricCard } from "@/components/metric-card"
import { LineChartComponent } from "@/components/charts/line-chart"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { PieChartComponent } from "@/components/charts/pie-chart"
import { HeatmapComponent } from "@/components/charts/heatmap"
import { Clock, BookOpen, TrendingUp, Calendar } from "lucide-react"
import { useMemo } from "react"

export default function ProgressPage() {
  const { sessions } = useStudySessions()
  const { getActiveReminders } = useReminders()

  const activeReminders = getActiveReminders()

  // Calculate metrics
  const totalStudyHours = useMemo(() => {
    return Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)
  }, [sessions])

  const sessionsThisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return sessions.filter((s) => new Date(s.date) >= weekAgo).length
  }, [sessions])

  const avgSessionDuration = useMemo(() => {
    if (sessions.length === 0) return 0
    return Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length)
  }, [sessions])

  // Prepare chart data
  const weeklyProgressData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day, index) => {
      const count = sessions.filter((s) => {
        const date = new Date(s.date)
        return date.getDay() === (index + 1) % 7
      }).length
      return { day, sessions: count, hours: count * 1.5 }
    })
  }, [sessions])

  const courseDistributionData = useMemo(() => {
    const courseMap = new Map<string, number>()
    sessions.forEach((s) => {
      courseMap.set(s.courseName, (courseMap.get(s.courseName) || 0) + 1)
    })
    return Array.from(courseMap.entries()).map(([name, value]) => ({ name, value }))
  }, [sessions])

  const consistencyHeatmapData = useMemo(() => {
    const last28Days = Array.from({ length: 28 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (27 - i))
      const dateStr = date.toISOString().split("T")[0]
      const count = sessions.filter((s) => s.date === dateStr).length
      return { date: dateStr, value: count }
    })
    return last28Days
  }, [sessions])

  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month) => ({
      month,
      sessions: Math.floor(Math.random() * 20) + 10,
      performance: Math.floor(Math.random() * 30) + 70,
    }))
  }, [])

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
          value={totalStudyHours}
          icon={Clock}
          description="All time"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Sessions This Week"
          value={sessionsThisWeek}
          icon={Calendar}
          description="Last 7 days"
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Avg Session Duration"
          value={`${avgSessionDuration}m`}
          icon={TrendingUp}
          description="Minutes per session"
        />
        <MetricCard
          title="Active Reminders"
          value={activeReminders.length}
          icon={BookOpen}
          description="Upcoming tasks"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          title="Study Consistency"
          description="Your study hours over the last 6 months"
          data={monthlyTrendData}
          xKey="month"
          lines={[
            { dataKey: "sessions", stroke: "#3b82f6", name: "Sessions" },
            { dataKey: "performance", stroke: "#10b981", name: "Performance %" },
          ]}
        />
        <BarChartComponent
          title="Weekly Session Frequency"
          description="Number of sessions per day this week"
          data={weeklyProgressData}
          xKey="day"
          bars={[{ dataKey: "sessions", fill: "#3b82f6", name: "Sessions" }]}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <PieChartComponent
          title="Course Distribution"
          description="Time spent across different courses"
          data={courseDistributionData}
          colors={colors}
        />
        <HeatmapComponent
          title="Consistency Pattern (Last 28 Days)"
          description="Your study activity heatmap"
          data={consistencyHeatmapData}
          maxValue={5}
        />
      </div>
    </div>
  )
}
