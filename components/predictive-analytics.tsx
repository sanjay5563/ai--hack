"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, AlertTriangle, Target, Calendar } from "lucide-react"
import type { PatientData } from "@/lib/medical-kb"

interface PredictiveAnalyticsProps {
  patientData: PatientData
}

interface Prediction {
  metric: string
  currentValue: number
  predictedValue: number
  timeframe: string
  confidence: number
  riskLevel: "low" | "medium" | "high"
  recommendation: string
}

export function PredictiveAnalytics({ patientData }: PredictiveAnalyticsProps) {
  const generatePredictions = (): Prediction[] => {
    const predictions: Prediction[] = []

    // HbA1c prediction
    const hba1cValues = patientData.vitals
      .filter((v) => v.type === "hbA1c")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (hba1cValues.length >= 2) {
      const trend = (hba1cValues[hba1cValues.length - 1].value - hba1cValues[0].value) / hba1cValues.length
      const predicted = hba1cValues[hba1cValues.length - 1].value + trend * 2 // 6 months ahead

      predictions.push({
        metric: "HbA1c",
        currentValue: hba1cValues[hba1cValues.length - 1].value,
        predictedValue: Math.max(5.0, predicted),
        timeframe: "6 months",
        confidence: 75,
        riskLevel: predicted > 9 ? "high" : predicted > 7.5 ? "medium" : "low",
        recommendation:
          predicted > 8
            ? "Consider insulin therapy or medication adjustment"
            : "Continue current management with close monitoring",
      })
    }

    // Blood pressure prediction
    const bpValues = patientData.vitals
      .filter((v) => v.type === "blood_pressure_systolic")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (bpValues.length >= 2) {
      const trend = (bpValues[bpValues.length - 1].value - bpValues[0].value) / bpValues.length
      const predicted = bpValues[bpValues.length - 1].value + trend * 2

      predictions.push({
        metric: "Systolic BP",
        currentValue: bpValues[bpValues.length - 1].value,
        predictedValue: Math.max(90, predicted),
        timeframe: "6 months",
        confidence: 68,
        riskLevel: predicted > 160 ? "high" : predicted > 140 ? "medium" : "low",
        recommendation:
          predicted > 150 ? "Consider antihypertensive therapy optimization" : "Monitor blood pressure regularly",
      })
    }

    // Weight prediction
    const weightValues = patientData.vitals
      .filter((v) => v.type === "weight_kg")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (weightValues.length >= 2) {
      const trend = (weightValues[weightValues.length - 1].value - weightValues[0].value) / weightValues.length
      const predicted = weightValues[weightValues.length - 1].value + trend * 3

      predictions.push({
        metric: "Weight",
        currentValue: weightValues[weightValues.length - 1].value,
        predictedValue: Math.max(40, predicted),
        timeframe: "6 months",
        confidence: 60,
        riskLevel: Math.abs(predicted - weightValues[weightValues.length - 1].value) > 10 ? "high" : "medium",
        recommendation:
          trend > 2
            ? "Lifestyle counseling and dietary intervention recommended"
            : "Continue current lifestyle management",
      })
    }

    return predictions
  }

  const predictions = generatePredictions()

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <TrendingUp className="h-4 w-4" />
      case "low":
        return <Target className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Predictive Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {predictions.length === 0 ? (
          <p className="text-muted-foreground">
            Insufficient data for predictive analysis. Need at least 2 data points per metric.
          </p>
        ) : (
          predictions.map((prediction, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{prediction.metric}</h4>
                  <Badge variant={getRiskColor(prediction.riskLevel)} className="gap-1">
                    {getRiskIcon(prediction.riskLevel)}
                    {prediction.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{prediction.timeframe} forecast</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current</div>
                  <div className="text-lg font-semibold">{prediction.currentValue}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Predicted</div>
                  <div className="text-lg font-semibold text-orange-600">{prediction.predictedValue.toFixed(1)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{prediction.confidence}%</span>
                </div>
                <Progress value={prediction.confidence} className="h-2" />
              </div>

              <div className="bg-muted p-3 rounded text-sm">
                <strong>Recommendation:</strong> {prediction.recommendation}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
