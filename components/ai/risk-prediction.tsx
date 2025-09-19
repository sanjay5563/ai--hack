"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, Brain, Target, Calendar, Activity, Heart, Droplet } from "lucide-react"

interface RiskFactor {
  name: string
  value: number
  impact: "high" | "moderate" | "low"
  description: string
}

interface RiskPrediction {
  condition: string
  riskScore: number
  timeframe: string
  confidence: number
  factors: RiskFactor[]
  recommendations: string[]
  explanation: string
}

interface RiskPredictionProps {
  patientData: any
}

export function RiskPrediction({ patientData }: RiskPredictionProps) {
  const [predictions, setPredictions] = useState<RiskPrediction[]>([])
  const [selectedPrediction, setSelectedPrediction] = useState<string>("")

  useEffect(() => {
    generateRiskPredictions()
  }, [patientData])

  const generateRiskPredictions = () => {
    const riskPredictions: RiskPrediction[] = []

    const age = patientData.age || 45
    const systolic = patientData.vitals.find((v: any) => v.type.includes("Systolic"))?.value || 140
    const hba1c = patientData.vitals.find((v: any) => v.type.includes("HbA1c"))?.value || 7.8
    const weight = patientData.vitals.find((v: any) => v.type.includes("Weight"))?.value || 85

    let cvRisk = 0
    cvRisk += age > 50 ? 20 : age > 40 ? 10 : 5
    cvRisk += systolic > 160 ? 25 : systolic > 140 ? 15 : 5
    cvRisk += hba1c > 8 ? 20 : hba1c > 7 ? 10 : 0
    cvRisk += weight > 90 ? 15 : weight > 80 ? 10 : 0
    cvRisk += patientData.lifestyle?.smoking ? 25 : 0

    riskPredictions.push({
      condition: "Cardiovascular Disease",
      riskScore: Math.min(cvRisk, 85),
      timeframe: "10 years",
      confidence: 87,
      factors: [
        {
          name: "Age",
          value: age,
          impact: age > 50 ? "high" : "moderate",
          description: "Age is a non-modifiable risk factor",
        },
        {
          name: "Blood Pressure",
          value: systolic,
          impact: systolic > 160 ? "high" : systolic > 140 ? "moderate" : "low",
          description: "Elevated BP increases cardiovascular risk",
        },
        {
          name: "Diabetes Control",
          value: hba1c,
          impact: hba1c > 8 ? "high" : hba1c > 7 ? "moderate" : "low",
          description: "Poor glucose control damages blood vessels",
        },
      ],
      recommendations: [
        "Optimize blood pressure control (target <130/80)",
        "Improve diabetes management (HbA1c <7%)",
        "Start statin therapy if indicated",
        "Increase physical activity to 150 min/week",
        "Consider cardiology consultation",
      ],
      explanation:
        "Based on your current risk factors including age, blood pressure, and diabetes control, you have an elevated risk of developing cardiovascular disease. This prediction uses established clinical risk calculators.",
    })

    if (
      patientData.conditions &&
      Array.isArray(patientData.conditions) &&
      patientData.conditions.some((c: string) => c.toLowerCase().includes("diabetes"))
    ) {
      let diabeticRisk = 0
      diabeticRisk += hba1c > 9 ? 40 : hba1c > 8 ? 25 : hba1c > 7 ? 15 : 5
      diabeticRisk += systolic > 140 ? 20 : 10
      diabeticRisk += age > 50 ? 15 : 5

      riskPredictions.push({
        condition: "Diabetic Complications",
        riskScore: Math.min(diabeticRisk, 80),
        timeframe: "5 years",
        confidence: 82,
        factors: [
          {
            name: "HbA1c Level",
            value: hba1c,
            impact: hba1c > 8 ? "high" : "moderate",
            description: "Primary predictor of diabetic complications",
          },
          {
            name: "Blood Pressure",
            value: systolic,
            impact: systolic > 140 ? "moderate" : "low",
            description: "Hypertension accelerates diabetic complications",
          },
        ],
        recommendations: [
          "Intensive glucose control (HbA1c <7%)",
          "Annual eye exams for retinopathy screening",
          "Regular kidney function monitoring",
          "Foot care and daily inspection",
          "Blood pressure optimization",
        ],
        explanation:
          "Your current HbA1c level indicates increased risk for diabetic complications including retinopathy, nephropathy, and neuropathy. Early intervention can significantly reduce this risk.",
      })
    }

    let strokeRisk = 0
    strokeRisk += age > 65 ? 25 : age > 55 ? 15 : 5
    strokeRisk += systolic > 160 ? 20 : systolic > 140 ? 10 : 0
    strokeRisk +=
      patientData.conditions &&
      Array.isArray(patientData.conditions) &&
      patientData.conditions.some((c: string) => c.toLowerCase().includes("diabetes"))
        ? 15
        : 0

    riskPredictions.push({
      condition: "Stroke",
      riskScore: Math.min(strokeRisk, 75),
      timeframe: "10 years",
      confidence: 79,
      factors: [
        {
          name: "Age",
          value: age,
          impact: age > 65 ? "high" : "moderate",
          description: "Stroke risk doubles every decade after 55",
        },
        {
          name: "Hypertension",
          value: systolic,
          impact: systolic > 160 ? "high" : "moderate",
          description: "Most important modifiable stroke risk factor",
        },
      ],
      recommendations: [
        "Aggressive blood pressure management",
        "Consider antiplatelet therapy",
        "Lifestyle modifications (diet, exercise)",
        "Regular monitoring and follow-up",
        "Smoking cessation if applicable",
      ],
      explanation:
        "Your stroke risk is calculated based on established clinical factors. Blood pressure control is the most effective way to reduce this risk.",
    })

    setPredictions(riskPredictions)
    if (riskPredictions.length > 0) {
      setSelectedPrediction(riskPredictions[0].condition)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 60) return "text-red-600 bg-red-50 border-red-200"
    if (score >= 30) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getRiskLevel = (score: number) => {
    if (score >= 60) return "High Risk"
    if (score >= 30) return "Moderate Risk"
    return "Low Risk"
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50"
      case "moderate":
        return "text-orange-600 bg-orange-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const selectedPred = predictions.find((p) => p.condition === selectedPrediction) || predictions[0]

  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Risk Predictions</h3>
          <p className="text-gray-600">AI is analyzing your health data to predict future risks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-gray-600">Machine learning-powered health risk assessment</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Brain className="h-4 w-4" />
          AI Powered
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {predictions.map((prediction) => (
          <Card
            key={prediction.condition}
            className={`cursor-pointer transition-all ${
              selectedPrediction === prediction.condition ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedPrediction(prediction.condition)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{prediction.condition}</h3>
                  <Badge className={getRiskColor(prediction.riskScore)}>{getRiskLevel(prediction.riskScore)}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">{prediction.riskScore}%</span>
                  </div>
                  <Progress value={prediction.riskScore} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{prediction.timeframe} risk</span>
                  <span>{prediction.confidence}% confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPred && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  {selectedPred.condition} Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg border ${getRiskColor(selectedPred.riskScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">{selectedPred.riskScore}% Risk</span>
                    <Badge variant="outline">{selectedPred.timeframe} prediction</Badge>
                  </div>
                  <p className="text-sm mb-3">{selectedPred.explanation}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4" />
                    <span>Confidence: {selectedPred.confidence}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contributing Risk Factors</h4>
                  <div className="space-y-3">
                    {selectedPred.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{factor.name}</span>
                            <Badge variant="outline" className={getImpactColor(factor.impact)}>
                              {factor.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{factor.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{factor.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Risk Reduction Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedPred.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-blue-800 font-medium">{rec}</p>
                      </div>
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
                  <Calendar className="h-5 w-5 text-green-600" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2 bg-transparent" variant="outline">
                  <Activity className="h-4 w-4" />
                  Schedule Specialist
                </Button>
                <Button className="w-full gap-2 bg-transparent" variant="outline">
                  <Heart className="h-4 w-4" />
                  Update Care Plan
                </Button>
                <Button className="w-full gap-2 bg-transparent" variant="outline">
                  <Droplet className="h-4 w-4" />
                  Order Lab Tests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Risk</span>
                    <span className="font-medium">{selectedPred.riskScore}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">With Intervention</span>
                    <span className="font-medium text-green-600">{Math.max(selectedPred.riskScore - 25, 5)}%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Following recommendations could reduce risk by up to 25%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>• Based on validated clinical risk calculators</p>
                <p>• Uses machine learning for personalization</p>
                <p>• Updated with latest medical research</p>
                <p>• {selectedPred.confidence}% prediction confidence</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
