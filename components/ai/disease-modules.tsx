"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Heart,
  Droplet,
  Scale,
  Brain,
  Activity,
  AlertTriangle,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
} from "lucide-react"

interface PatientData {
  name: string
  age: number
  vitals: Array<{
    type: string
    value: number
    unit: string
    date: string
  }>
  conditions: string[]
  medications: string[]
  lifestyle?: {
    sleep: number
    activity: number
    diet: string
    smoking: boolean
    alcohol: string
  }
}

interface DiseaseModule {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  riskLevel: "low" | "moderate" | "high"
  recommendations: string[]
  metrics: Array<{
    name: string
    value: number
    target: number
    unit: string
    status: "good" | "warning" | "danger"
  }>
  insights: string[]
  nextActions: string[]
}

interface DiseaseModulesProps {
  patientData: PatientData
}

export function DiseaseModules({ patientData }: DiseaseModulesProps) {
  const [activeModule, setActiveModule] = useState<string>("diabetes")
  const [modules, setModules] = useState<DiseaseModule[]>([])

  useEffect(() => {
    generateDiseaseModules()
  }, [patientData])

  const generateDiseaseModules = () => {
    const generatedModules: DiseaseModule[] = []

    if (patientData.conditions.some((c) => c.toLowerCase().includes("diabetes"))) {
      const hba1c = patientData.vitals.find((v) => v.type.toLowerCase().includes("hba1c"))?.value || 7.2
      const glucose = patientData.vitals.find((v) => v.type.toLowerCase().includes("glucose"))?.value || 140

      generatedModules.push({
        id: "diabetes",
        name: "Diabetes Management",
        icon: Droplet,
        color: "text-blue-600",
        riskLevel: hba1c > 8 ? "high" : hba1c > 7 ? "moderate" : "low",
        recommendations: [
          "Monitor blood glucose 2-3 times daily",
          "Follow carbohydrate counting guidelines",
          "Maintain regular exercise routine (150 min/week)",
          "Take medications as prescribed",
          "Schedule quarterly HbA1c tests",
        ],
        metrics: [
          {
            name: "HbA1c",
            value: hba1c,
            target: 7.0,
            unit: "%",
            status: hba1c > 8 ? "danger" : hba1c > 7 ? "warning" : "good",
          },
          {
            name: "Fasting Glucose",
            value: glucose,
            target: 100,
            unit: "mg/dL",
            status: glucose > 140 ? "danger" : glucose > 110 ? "warning" : "good",
          },
        ],
        insights: [
          `Your HbA1c of ${hba1c}% indicates ${hba1c > 7 ? "suboptimal" : "good"} glucose control`,
          "Regular monitoring helps prevent complications",
          "Diet and exercise are key to management",
        ],
        nextActions: [
          "Schedule endocrinologist appointment",
          "Review medication timing",
          "Consider continuous glucose monitoring",
        ],
      })
    }

    if (
      patientData.conditions.some(
        (c) => c.toLowerCase().includes("hypertension") || c.toLowerCase().includes("blood pressure"),
      )
    ) {
      const systolic = patientData.vitals.find((v) => v.type.toLowerCase().includes("systolic"))?.value || 140
      const diastolic = patientData.vitals.find((v) => v.type.toLowerCase().includes("diastolic"))?.value || 90

      generatedModules.push({
        id: "hypertension",
        name: "Blood Pressure Control",
        icon: Heart,
        color: "text-red-600",
        riskLevel: systolic > 160 || diastolic > 100 ? "high" : systolic > 140 || diastolic > 90 ? "moderate" : "low",
        recommendations: [
          "Monitor blood pressure daily",
          "Reduce sodium intake (<2300mg/day)",
          "Maintain healthy weight",
          "Exercise regularly (30 min/day)",
          "Limit alcohol consumption",
        ],
        metrics: [
          {
            name: "Systolic BP",
            value: systolic,
            target: 120,
            unit: "mmHg",
            status: systolic > 160 ? "danger" : systolic > 140 ? "warning" : "good",
          },
          {
            name: "Diastolic BP",
            value: diastolic,
            target: 80,
            unit: "mmHg",
            status: diastolic > 100 ? "danger" : diastolic > 90 ? "warning" : "good",
          },
        ],
        insights: [
          `Blood pressure ${systolic}/${diastolic} is ${systolic > 140 ? "elevated" : "within target"}`,
          "Lifestyle modifications can reduce BP by 10-20 mmHg",
          "Medication adherence is crucial for control",
        ],
        nextActions: ["Check BP medication timing", "Review dietary sodium intake", "Consider home BP monitoring"],
      })
    }

    const weight = patientData.vitals.find((v) => v.type.toLowerCase().includes("weight"))?.value || 80
    const height = 170 // Assume height in cm
    const bmi = weight / (height / 100) ** 2

    if (bmi > 25) {
      generatedModules.push({
        id: "weight",
        name: "Weight Management",
        icon: Scale,
        color: "text-green-600",
        riskLevel: bmi > 35 ? "high" : bmi > 30 ? "moderate" : "low",
        recommendations: [
          "Create caloric deficit of 500-750 calories/day",
          "Focus on whole foods and portion control",
          "Increase physical activity gradually",
          "Track food intake and weight weekly",
          "Consider nutritionist consultation",
        ],
        metrics: [
          {
            name: "BMI",
            value: Number.parseFloat(bmi.toFixed(1)),
            target: 24.9,
            unit: "kg/m²",
            status: bmi > 35 ? "danger" : bmi > 30 ? "warning" : "good",
          },
          {
            name: "Weight",
            value: weight,
            target: weight * 0.9, // 10% weight loss target
            unit: "kg",
            status: bmi > 30 ? "warning" : "good",
          },
        ],
        insights: [
          `BMI of ${bmi.toFixed(1)} indicates ${bmi > 30 ? "obesity" : "overweight"}`,
          "Even 5-10% weight loss improves health outcomes",
          "Sustainable lifestyle changes are key",
        ],
        nextActions: [
          "Set realistic weight loss goals",
          "Plan balanced meal schedule",
          "Start with 150 minutes exercise/week",
        ],
      })
    }

    if (patientData.conditions.some((c) => c.toLowerCase().includes("cardiac") || c.toLowerCase().includes("heart"))) {
      const heartRate = patientData.vitals.find((v) => v.type.toLowerCase().includes("heart rate"))?.value || 75

      generatedModules.push({
        id: "cardiac",
        name: "Cardiac Health",
        icon: Activity,
        color: "text-purple-600",
        riskLevel: heartRate > 100 || heartRate < 50 ? "moderate" : "low",
        recommendations: [
          "Follow heart-healthy diet (Mediterranean style)",
          "Take prescribed cardiac medications",
          "Monitor symptoms (chest pain, shortness of breath)",
          "Regular cardiology follow-ups",
          "Manage stress and get adequate sleep",
        ],
        metrics: [
          {
            name: "Resting HR",
            value: heartRate,
            target: 70,
            unit: "bpm",
            status: heartRate > 100 || heartRate < 50 ? "warning" : "good",
          },
        ],
        insights: [
          `Resting heart rate of ${heartRate} bpm is ${heartRate > 100 ? "elevated" : heartRate < 50 ? "low" : "normal"}`,
          "Regular exercise strengthens heart muscle",
          "Stress management reduces cardiac risk",
        ],
        nextActions: ["Schedule echocardiogram if due", "Review cardiac medications", "Monitor daily symptoms"],
      })
    }

    setModules(generatedModules)
    if (generatedModules.length > 0 && !activeModule) {
      setActiveModule(generatedModules[0].id)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "moderate":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case "danger":
        return "text-red-600"
      case "warning":
        return "text-orange-600"
      case "good":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Disease Modules Available</h3>
          <p className="text-gray-600">Disease-specific AI modules will appear based on patient conditions and data.</p>
        </CardContent>
      </Card>
    )
  }

  const currentModule = modules.find((m) => m.id === activeModule) || modules[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Disease-Specific AI Modules</h2>
          <p className="text-gray-600">Personalized insights and recommendations for your conditions</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                activeModule === module.id
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {module.name}
              <Badge variant="outline" className={getRiskColor(module.riskLevel)}>
                {module.riskLevel}
              </Badge>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <currentModule.icon className={`h-5 w-5 ${currentModule.color}`} />
                {currentModule.name} - Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border ${getRiskColor(currentModule.riskLevel)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Risk Level: {currentModule.riskLevel.toUpperCase()}</span>
                </div>
                <p className="text-sm">
                  {currentModule.riskLevel === "high" &&
                    "Immediate attention required. Follow up with healthcare provider."}
                  {currentModule.riskLevel === "moderate" && "Monitor closely and follow recommendations."}
                  {currentModule.riskLevel === "low" && "Continue current management plan."}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {currentModule.metrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.name}</h4>
                      <Badge variant="outline" className={getMetricColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          Current: {metric.value} {metric.unit}
                        </span>
                        <span>
                          Target: {metric.target} {metric.unit}
                        </span>
                      </div>
                      <Progress value={Math.min((metric.value / metric.target) * 100, 100)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentModule.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-indigo-800 text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentModule.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentModule.nextActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm text-gray-700">{action}</span>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <Activity className="h-4 w-4" />
                Log Symptoms
              </Button>
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <TrendingUp className="h-4 w-4" />
                View Trends
              </Button>
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <Target className="h-4 w-4" />
                Set Goals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
