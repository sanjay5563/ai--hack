"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import type { PatientVital } from "@/lib/medical-kb"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface VitalsChartProps {
  vitals: PatientVital[]
}

export function VitalsChart({ vitals }: VitalsChartProps) {
  // Group vitals by type and sort by date
  const vitalsByType = vitals.reduce(
    (acc, vital) => {
      if (!acc[vital.type]) {
        acc[vital.type] = []
      }
      acc[vital.type].push(vital)
      return acc
    },
    {} as Record<string, PatientVital[]>,
  )

  // Sort each type by date
  Object.keys(vitalsByType).forEach((type) => {
    vitalsByType[type].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // Create chart data
  const chartData = vitals
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, vital) => {
      const existingEntry = acc.find((entry) => entry.date === vital.date)
      if (existingEntry) {
        existingEntry[vital.type] = vital.value
      } else {
        acc.push({
          date: vital.date,
          [vital.type]: vital.value,
        })
      }
      return acc
    }, [] as any[])

  const getTrendIcon = (values: number[]) => {
    if (values.length < 2) return <Minus className="h-4 w-4 text-gray-500" />
    const trend = values[values.length - 1] - values[0]
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vitals Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(vitalsByType).map((type, index) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(vitalsByType).map(([type, values]) => {
          const latestValue = values[values.length - 1]
          const trend = getTrendIcon(values.map((v) => v.value))

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {type.replace(/_/g, " ").toUpperCase()}
                  {trend}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestValue.value} {latestValue.unit}
                </div>
                <p className="text-xs text-muted-foreground">Last recorded: {latestValue.date}</p>
                <div className="mt-2">
                  <div style={{ width: "100%", height: 60 }}>
                    <ResponsiveContainer>
                      <BarChart data={values}>
                        <Bar dataKey="value" fill={colors[Object.keys(vitalsByType).indexOf(type) % colors.length]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
