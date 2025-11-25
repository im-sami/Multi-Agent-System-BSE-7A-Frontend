"use client"

import { useInsights } from "@/context/insights-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertTriangle, Trophy, X } from "lucide-react"

export default function InsightsPage() {
  const { insights, dismissInsight, getActiveInsights } = useInsights()

  const activeInsights = getActiveInsights()

  const getIcon = (type: string) => {
    switch (type) {
      case "feedback":
        return Lightbulb
      case "suggestion":
        return TrendingUp
      case "warning":
        return AlertTriangle
      case "achievement":
        return Trophy
      default:
        return Lightbulb
    }
  }

  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "warning":
        return "destructive"
      case "achievement":
        return "default"
      case "suggestion":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500"
      case "medium":
        return "border-l-4 border-yellow-500"
      case "low":
        return "border-l-4 border-blue-500"
      default:
        return ""
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Personalized Insights</h1>
        <p className="text-muted-foreground mt-1">AI-generated feedback and study habit analysis</p>
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        {activeInsights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No active insights</p>
              <p className="text-sm text-muted-foreground">Keep logging sessions to receive personalized feedback</p>
            </CardContent>
          </Card>
        ) : (
          activeInsights
            .sort((a, b) => {
              const priorityOrder = { high: 0, medium: 1, low: 2 }
              return priorityOrder[a.priority] - priorityOrder[b.priority]
            })
            .map((insight) => {
              const Icon = getIcon(insight.type)
              return (
                <Card key={insight.id} className={getPriorityColor(insight.priority)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <Badge variant={getBadgeVariant(insight.type)}>{insight.type}</Badge>
                            {insight.priority === "high" && <Badge variant="destructive">High Priority</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(insight.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => dismissInsight(insight.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
        )}
      </div>

      {/* Sample Insights Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>About Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Feedback</p>
              <p className="text-sm text-muted-foreground">General feedback on your study patterns and progress</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Suggestions</p>
              <p className="text-sm text-muted-foreground">Actionable recommendations to improve your study habits</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Warnings</p>
              <p className="text-sm text-muted-foreground">Alerts about potential issues or declining trends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Achievements</p>
              <p className="text-sm text-muted-foreground">Milestones and accomplishments in your study journey</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
