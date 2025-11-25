"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HeatmapProps {
  title: string
  description?: string
  data: Array<{ date: string; value: number }>
  maxValue: number
}

export function HeatmapComponent({ title, description, data, maxValue }: HeatmapProps) {
  const getColorIntensity = (value: number) => {
    const intensity = Math.min(value / maxValue, 1)
    if (intensity === 0) return "bg-muted"
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900"
    if (intensity < 0.5) return "bg-green-300 dark:bg-green-700"
    if (intensity < 0.75) return "bg-green-400 dark:bg-green-600"
    return "bg-green-500 dark:bg-green-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {data.map((item, index) => (
            <div
              key={index}
              className={cn(
                "h-10 rounded flex items-center justify-center text-xs font-medium",
                getColorIntensity(item.value)
              )}
              title={`${item.date}: ${item.value} sessions`}
            >
              {item.value > 0 && item.value}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 bg-muted rounded" />
            <div className="h-3 w-3 bg-green-200 dark:bg-green-900 rounded" />
            <div className="h-3 w-3 bg-green-300 dark:bg-green-700 rounded" />
            <div className="h-3 w-3 bg-green-400 dark:bg-green-600 rounded" />
            <div className="h-3 w-3 bg-green-500 dark:bg-green-500 rounded" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
