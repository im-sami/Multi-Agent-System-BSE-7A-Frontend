"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
    generateAIInsights,
    getPreviousInsights,
    getStudyRecommendations,
    type AIInsight,
    type StudyRecommendations
} from "@/lib/proctor-service"
import { AlertTriangle, Lightbulb, RefreshCw, TrendingUp, Trophy } from "lucide-react"
import { useEffect, useState } from "react"

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [recommendations, setRecommendations] = useState<StudyRecommendations | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()

  // Fetch insights from API
  const fetchInsights = async () => {
    try {
      setLoading(true)
      const [insightsData, recData] = await Promise.all([
        getPreviousInsights(20),
        getStudyRecommendations()
      ])
      setInsights(insightsData)
      setRecommendations(recData)
    } catch (error) {
      console.error("Failed to fetch insights:", error)
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate new insights
  const handleGenerateInsights = async () => {
    try {
      setGenerating(true)
      const newInsights = await generateAIInsights(true)
      setInsights(newInsights)
      toast({
        title: "Success",
        description: `Generated ${newInsights.length} new insights`
      })
    } catch (error) {
      console.error("Failed to generate insights:", error)
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  // Load insights on mount
  useEffect(() => {
    fetchInsights()
  }, [])

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "recommendation":
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
    switch (type.toLowerCase()) {
      case "warning":
        return "destructive"
      case "achievement":
        return "default"
      case "recommendation":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (score: number) => {
    if (score >= 80) return "border-l-4 border-red-500"
    if (score >= 50) return "border-l-4 border-yellow-500"
    return "border-l-4 border-blue-500"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground mt-1">AI-generated feedback and study habit analysis</p>
        </div>
        <Button onClick={handleGenerateInsights} disabled={generating || loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate New Insights'}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading insights...</p>
          </CardContent>
        </Card>
      )}

      {/* Study Recommendations */}
      {recommendations && recommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendations.map((rec, index) => {
                const Icon = getIcon(rec.type)
                const priorityColor = rec.priority === 'high' ? 'text-red-500' : 
                                     rec.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                return (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Icon className={`h-5 w-5 ${priorityColor} mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{rec.title}</p>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Insights ({insights.length})</h2>
        {insights.length === 0 && !loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No insights yet</p>
              <p className="text-sm text-muted-foreground mb-4">Generate insights to receive AI-powered feedback</p>
              <Button onClick={handleGenerateInsights}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
            </CardContent>
          </Card>
        ) : (
          insights
            .sort((a, b) => b.confidence_score - a.confidence_score)
            .map((insight) => {
              const Icon = getIcon(insight.insight_type)
              return (
                <Card key={insight.id} className={getPriorityColor(insight.confidence_score)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <Badge variant={getBadgeVariant(insight.insight_type)}>
                              {insight.insight_type}
                            </Badge>
                            <Badge variant="outline">
                              {insight.confidence_score.toFixed(0)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(insight.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
        )}
      </div>
      {/* About Insights */}
      <Card>
        <CardHeader>
          <CardTitle>About AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">General Insights</p>
              <p className="text-sm text-muted-foreground">AI-analyzed patterns and observations from your study data</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Recommendations</p>
              <p className="text-sm text-muted-foreground">Actionable suggestions to improve your study habits and performance</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Warnings</p>
              <p className="text-sm text-muted-foreground">Alerts about declining trends or areas needing attention</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Achievements</p>
              <p className="text-sm text-muted-foreground">Recognition of milestones and positive progress in your studies</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
