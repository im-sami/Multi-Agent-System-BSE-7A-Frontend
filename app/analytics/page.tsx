"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MetricCard } from "@/components/metric-card"
import { LineChartComponent } from "@/components/charts/line-chart"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { Users, TrendingDown, Award, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AnalyticsPage() {
  // Mock data for instructor analytics
  const classStats = {
    totalStudents: 45,
    averageStudyTime: 12.5,
    topPerformer: 8,
    atRiskStudents: 5,
  }

  const classConsistencyData = [
    { week: "Week 1", avgHours: 8, participation: 85 },
    { week: "Week 2", avgHours: 10, participation: 90 },
    { week: "Week 3", avgHours: 12, participation: 88 },
    { week: "Week 4", avgHours: 11, participation: 92 },
    { week: "Week 5", avgHours: 13, participation: 95 },
    { week: "Week 6", avgHours: 12.5, participation: 93 },
  ]

  const performanceDistribution = [
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Instructor Analytics</h1>
        <p className="text-muted-foreground mt-1">Class-wide statistics and at-risk student identification</p>
      </div>

      {/* Class Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Students" value={classStats.totalStudents} icon={Users} description="Enrolled in class" />
        <MetricCard
          title="Avg Study Time (Week)"
          value={`${classStats.averageStudyTime}h`}
          icon={TrendingDown}
          description="Class average"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Top Performers"
          value={classStats.topPerformer}
          icon={Award}
          description="20+ hours/week"
        />
        <MetricCard
          title="At-Risk Students"
          value={classStats.atRiskStudents}
          icon={AlertTriangle}
          description="<5 hours/week"
        />
      </div>

      {/* Class Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartComponent
          title="Class Consistency Trends"
          description="Average study hours and participation over time"
          data={classConsistencyData}
          xKey="week"
          lines={[
            { dataKey: "avgHours", stroke: "#3b82f6", name: "Avg Hours" },
            { dataKey: "participation", stroke: "#10b981", name: "Participation %" },
          ]}
        />
        <BarChartComponent
          title="Performance Distribution"
          description="Number of students by weekly study hours"
          data={performanceDistribution}
          xKey="range"
          bars={[{ dataKey: "count", fill: "#8b5cf6", name: "Students" }]}
        />
      </div>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Students (Anonymized)</CardTitle>
          <CardDescription>Students with low study activity requiring intervention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {atRiskStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{student.identifier}</span>
                    <Badge variant="destructive">At Risk</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{student.hours}h this week</span>
                    <span>•</span>
                    <span>Last session: {student.lastSession}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-destructive font-medium">Declining</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Class Insights</CardTitle>
          <CardDescription>Key observations and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              ✓ Overall class participation is trending upward (+5% this week)
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              ⚠ 5 students showing declining study patterns - consider outreach
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ℹ Peak study hours: 9 AM - 12 PM and 7 PM - 10 PM
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
