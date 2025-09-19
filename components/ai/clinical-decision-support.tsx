"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, AlertTriangle, Clock, User, Pill, Activity, FileText, Brain } from "lucide-react"

interface ClinicalRecommendation {
  id: string
  type: "medication" | "lifestyle" | "monitoring" | "referral" | "diagnostic"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  evidence: string
  rationale: string
  contraindications?: string[]
  alternatives?: string[]
  timeline: string
}

interface ClinicalAlert {
  id: string
  severity: "critical" | "warning" | "info"
  category: string
  message: string
  action: string
  evidence: string
}

interface ClinicalDecisionSupportProps {
  patientData: any
}

export function ClinicalDecisionSupport({ patientData }: ClinicalDecisionSupportProps) {
  const [recommendations, setRecommendations] = useState<ClinicalRecommendation[]>([])
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([])
  const [activeTab, setActiveTab] = useState("recommendations")

  useEffect(() => {
    generateClinicalRecommendations()
    generateClinicalAlerts()
  }, [patientData])

  const generateClinicalRecommendations = () => {
    const recs: ClinicalRecommendation[] = []

    const hba1c = patientData.vitals?.find((v: any) => v.type.includes("HbA1c"))?.value || 7.8
    const systolic = patientData.vitals?.find((v: any) => v.type.includes("Systolic"))?.value || 140
    const age = patientData.age || 45

    const conditions = patientData.conditions || []
    if (conditions.some((c: string) => c.toLowerCase().includes("diabetes"))) {
      if (hba1c > 8) {
        recs.push({
          id: "diabetes-intensify",
          type: "medication",
          priority: "high",
          title: "Intensify Diabetes Therapy",
          description: "Current HbA1c of " + hba1c + "% is above target. Consider medication adjustment or addition.",
          evidence: "ADA 2024 Guidelines recommend HbA1c <7% for most adults",
          rationale: "Elevated HbA1c increases risk of microvascular and macrovascular complications",
          alternatives: ["Add SGLT2 inhibitor", "Increase metformin dose", "Add GLP-1 agonist"],
          timeline: "Within 2-4 weeks",
        })
      }

      recs.push({
        id: "diabetes-monitoring",
        type: "monitoring",
        priority: "medium",
        title: "Continuous Glucose Monitoring",
        description: "Consider CGM for better glucose pattern recognition and management",
        evidence: "Studies show CGM improves HbA1c by 0.3-0.5%",
        rationale: "Real-time glucose data helps optimize therapy and reduce hypoglycemia",
        timeline: "Next appointment",
      })
    }

    if (systolic > 140) {
      recs.push({
        id: "bp-medication",
        type: "medication",
        priority: "high",
        title: "Optimize Blood Pressure Control",
        description: "Current BP " + systolic + " mmHg is above target. Consider ACE inhibitor adjustment.",
        evidence: "ACC/AHA 2017 Guidelines recommend BP <130/80 mmHg",
        rationale: "Each 10 mmHg reduction in systolic BP reduces cardiovascular events by 20%",
        contraindications: ["Hyperkalemia", "Acute kidney injury", "Angioedema history"],
        alternatives: ["Increase current dose", "Add thiazide diuretic", "Switch to ARB"],
        timeline: "Within 1-2 weeks",
      })
    }

    recs.push({
      id: "lifestyle-exercise",
      type: "lifestyle",
      priority: "medium",
      title: "Structured Exercise Program",
      description: "Implement 150 minutes of moderate-intensity aerobic exercise per week",
      evidence: "Exercise reduces HbA1c by 0.6% and systolic BP by 5-7 mmHg",
      rationale: "Physical activity improves insulin sensitivity and cardiovascular health",
      timeline: "Start immediately, gradual progression",
    })

    if (age > 40) {
      recs.push({
        id: "statin-therapy",
        type: "medication",
        priority: "medium",
        title: "Consider Statin Therapy",
        description: "Evaluate for primary prevention statin based on cardiovascular risk",
        evidence: "2018 AHA/ACC Cholesterol Guidelines",
        rationale: "Diabetes and hypertension increase cardiovascular risk significantly",
        contraindications: ["Active liver disease", "Pregnancy", "Myopathy"],
        timeline: "Next visit after lipid panel",
      })
    }

    recs.push({
      id: "endo-referral",
      type: "referral",
      priority: "medium",
      title: "Endocrinology Consultation",
      description: "Refer for complex diabetes management and optimization",
      evidence: "Specialist care improves diabetes outcomes",
      rationale: "Multiple comorbidities and suboptimal control warrant specialist input",
      timeline: "Within 4-6 weeks",
    })

    setRecommendations(recs)
  }

  const generateClinicalAlerts = () => {
    const clinicalAlerts: ClinicalAlert[] = []

    const hba1c = patientData.vitals?.find((v: any) => v.type.includes("HbA1c"))?.value || 7.8
    const systolic = patientData.vitals?.find((v: any) => v.type.includes("Systolic"))?.value || 140

    if (hba1c > 9) {
      clinicalAlerts.push({
        id: "hba1c-critical",
        severity: "critical",
        category: "Diabetes",
        message: "HbA1c significantly elevated at " + hba1c + "%",
        action: "Urgent diabetes management review required",
        evidence: "HbA1c >9% associated with high complication risk",
      })
    }

    if (systolic > 160) {
      clinicalAlerts.push({
        id: "bp-critical",
        severity: "critical",
        category: "Hypertension",
        message: "Blood pressure critically elevated",
        action: "Consider immediate antihypertensive therapy",
        evidence: "Systolic BP >160 mmHg requires prompt treatment",
      })
    }

    const medications = patientData.medications || []
    if (medications.includes("Metformin") && medications.includes("Lisinopril")) {
      clinicalAlerts.push({
        id: "drug-interaction",
        severity: "warning",
        category: "Drug Interaction",
        message: "Monitor kidney function with ACE inhibitor + Metformin",
        action: "Check creatinine and eGFR regularly",
        evidence: "Both drugs can affect kidney function",
      })
    }

    clinicalAlerts.push({
      id: "eye-exam",
      severity: "info",
      category: "Preventive Care",
      message: "Annual diabetic eye exam due",
      action: "Schedule ophthalmology appointment",
      evidence: "Annual screening recommended for diabetic retinopathy",
    })

    setAlerts(clinicalAlerts)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medication":
        return Pill
      case "lifestyle":
        return Activity
      case "monitoring":
        return Clock
      case "referral":
        return User
      case "diagnostic":
        return FileText
      default:
        return Lightbulb
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clinical Decision Support</h2>
          <p className="text-gray-600">AI-powered recommendations based on clinical guidelines</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Brain className="h-4 w-4" />
          Evidence-Based
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Clinical Alerts ({alerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((rec) => {
            const Icon = getTypeIcon(rec.type)
            return (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      {rec.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant="outline">{rec.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{rec.description}</p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Clinical Rationale</h4>
                      <p className="text-sm text-gray-600">{rec.rationale}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Evidence Base</h4>
                      <p className="text-sm text-gray-600">{rec.evidence}</p>
                    </div>
                  </div>

                  {rec.alternatives && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Alternative Options</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.alternatives.map((alt, index) => (
                          <Badge key={index} variant="outline">
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.contraindications && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Contraindications</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.contraindications.map((contra, index) => (
                          <Badge key={index} variant="outline" className="text-red-600 border-red-200">
                            {contra}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Timeline: {rec.timeline}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        More Info
                      </Button>
                      <Button size="sm">Implement</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : alert.severity === "warning"
                              ? "text-orange-600"
                              : "text-blue-600"
                        }`}
                      />
                      <h3 className="font-medium text-gray-900">{alert.category}</h3>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{alert.message}</p>
                    <p className="text-sm font-medium text-gray-900">Action: {alert.action}</p>
                    <p className="text-xs text-gray-500">Evidence: {alert.evidence}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                    <Button size="sm">Act Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
