"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MedicationReminders } from "./medication-reminders"
import { SleepLifestyleTracker } from "./sleep-lifestyle-tracker"
import { DiseaseModules } from "../ai/disease-modules"
import {
  FileText,
  Pill,
  Moon,
  Activity,
  Heart,
  TrendingUp,
  Calendar,
  Download,
  MessageCircle,
  LogOut,
  User,
  Key,
  Brain,
} from "lucide-react"

interface PatientData {
  id: string
  name: string
  email: string
  phone: string
}

interface MedicalReport {
  id: string
  doctorName: string
  date: string
  summary: string
  diagnosis: string
  medications: string[]
  followUp: string
  doctorMessage?: string
  accessCode?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  nextDose: string
  taken: boolean
}

interface PatientDashboardProps {
  patient: PatientData
  onLogout: () => void
}

export function PatientDashboard({ patient, onLogout }: PatientDashboardProps) {
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [sleepData, setSleepData] = useState({ hours: 7.5, quality: "Good" })
  const [accessCode, setAccessCode] = useState("")
  const [isLoadingReport, setIsLoadingReport] = useState(false)

  const mockPatientData = {
    name: patient.name,
    age: 45,
    vitals: [
      { type: "HbA1c", value: 7.8, unit: "%", date: "2025-01-15" },
      { type: "Glucose", value: 145, unit: "mg/dL", date: "2025-01-15" },
      { type: "Systolic BP", value: 142, unit: "mmHg", date: "2025-01-15" },
      { type: "Diastolic BP", value: 88, unit: "mmHg", date: "2025-01-15" },
      { type: "Weight", value: 85, unit: "kg", date: "2025-01-15" },
      { type: "Heart Rate", value: 78, unit: "bpm", date: "2025-01-15" },
    ],
    conditions: ["Type 2 Diabetes", "Hypertension", "Obesity"],
    medications: ["Metformin 500mg", "Lisinopril 10mg", "Aspirin 81mg"],
    lifestyle: {
      sleep: 7.5,
      activity: 150,
      diet: "Mediterranean",
      smoking: false,
      alcohol: "Moderate",
    },
  }

  useEffect(() => {
    loadPatientData()
    loadSharedReports()
  }, [])

  const loadPatientData = () => {
    const mockReports: MedicalReport[] = [
      {
        id: "1",
        doctorName: "Dr. Sarah Johnson",
        date: "2025-01-15",
        summary: "Regular checkup shows good overall health. Blood pressure slightly elevated.",
        diagnosis: "Mild Hypertension",
        medications: ["Lisinopril 10mg", "Aspirin 81mg"],
        followUp: "Follow up in 3 months",
      },
      {
        id: "2",
        doctorName: "Dr. Michael Chen",
        date: "2025-01-10",
        summary: "Blood sugar levels are well controlled. Continue current medication regimen.",
        diagnosis: "Type 2 Diabetes - Well Controlled",
        medications: ["Metformin 500mg", "Glipizide 5mg"],
        followUp: "Next appointment in 6 months",
      },
    ]

    const mockMedications: Medication[] = [
      {
        id: "1",
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        nextDose: "8:00 AM",
        taken: false,
      },
      {
        id: "2",
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        nextDose: "8:00 AM",
        taken: true,
      },
      {
        id: "3",
        name: "Aspirin",
        dosage: "81mg",
        frequency: "Once daily",
        nextDose: "8:00 PM",
        taken: false,
      },
    ]

    setReports(mockReports)
    setMedications(mockMedications)
  }

  const loadSharedReports = () => {
    const sharedReports = JSON.parse(localStorage.getItem("shared_reports") || "[]")
    const patientReports = sharedReports.filter(
      (report: any) => report.patientEmail === patient.email || report.patientPhone === patient.phone,
    )

    const formattedReports = patientReports.map((report: any) => ({
      id: report.id,
      doctorName: "Dr. " + (report.patientData?.name || "Unknown"),
      date: report.sharedDate,
      summary: report.clinicalSummary?.summary || "Clinical summary available",
      diagnosis: report.clinicalSummary?.alerts?.[0]?.message || "See full report",
      medications: report.clinicalSummary?.recommendations || [],
      followUp: "As recommended by your doctor",
      doctorMessage: report.doctorMessage,
      accessCode: report.accessCode,
    }))

    setReports((prev) => [...prev, ...formattedReports])
  }

  const loadReportByAccessCode = async () => {
    if (!accessCode.trim()) return

    setIsLoadingReport(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const sharedReports = JSON.parse(localStorage.getItem("shared_reports") || "[]")
    const foundReport = sharedReports.find((report: any) => report.accessCode === accessCode.toUpperCase())

    if (foundReport) {
      const newReport: MedicalReport = {
        id: foundReport.id,
        doctorName: "Dr. " + (foundReport.patientData?.name || "Unknown"),
        date: foundReport.sharedDate,
        summary: foundReport.clinicalSummary?.summary || "Clinical summary loaded via access code",
        diagnosis: foundReport.clinicalSummary?.alerts?.[0]?.message || "See full report",
        medications: foundReport.clinicalSummary?.recommendations || [],
        followUp: "As recommended by your doctor",
        doctorMessage: foundReport.doctorMessage,
        accessCode: foundReport.accessCode,
      }

      const exists = reports.some((r) => r.accessCode === accessCode.toUpperCase())
      if (!exists) {
        setReports((prev) => [newReport, ...prev])
      }

      setAccessCode("")
    }

    setIsLoadingReport(false)
  }

  const toggleMedication = (id: string) => {
    setMedications(medications.map((med) => (med.id === id ? { ...med, taken: !med.taken } : med)))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-600">Your health, your data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-gray-900">{patient.name}</p>
                <p className="text-sm text-gray-600">{patient.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Lifestyle</span>
            </TabsTrigger>
            <TabsTrigger value="disease-modules" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Modules</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="ai-coach" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">AI Coach</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Access New Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the access code provided by your doctor to view a new medical report.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="access-code" className="sr-only">
                      Access Code
                    </Label>
                    <Input
                      id="access-code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-digit access code"
                      maxLength={6}
                      className="uppercase"
                    />
                  </div>
                  <Button
                    onClick={loadReportByAccessCode}
                    disabled={isLoadingReport || accessCode.length !== 6}
                    className="gap-2"
                  >
                    {isLoadingReport ? "Loading..." : "Load Report"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <h2 className="text-xl font-semibold text-gray-900">Medical Reports</h2>
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{report.doctorName}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{report.date}</Badge>
                        {report.accessCode && (
                          <Badge variant="secondary" className="gap-1">
                            <Key className="h-3 w-3" />
                            {report.accessCode}
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.doctorMessage && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">Message from Doctor</h4>
                        <p className="text-blue-800 text-sm">{report.doctorMessage}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
                      <p className="text-gray-700">{report.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{report.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Prescribed Medications</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.medications.map((med, index) => (
                          <Badge key={index} variant="secondary">
                            {med}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Follow-up</h4>
                      <p className="text-gray-700">{report.followUp}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="medications" className="space-y-6">
            <MedicationReminders patientId={patient.id} />
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-6">
            <SleepLifestyleTracker patientId={patient.id} />
          </TabsContent>

          <TabsContent value="disease-modules" className="space-y-6">
            <DiseaseModules patientData={mockPatientData} />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5 text-blue-600" />
                    Sleep Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{sleepData.hours}h</div>
                    <p className="text-gray-600">Last night</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Sleep Quality</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {sleepData.quality}
                    </Badge>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Sleep History
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Blood Pressure</span>
                      <span className="font-medium">142/88</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Heart Rate</span>
                      <span className="font-medium">78 bpm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Blood Sugar</span>
                      <span className="font-medium">145 mg/dL</span>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Trends
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-coach" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  AI Health Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-800 font-medium mb-2">Today's Health Insights</p>
                  <ul className="text-purple-700 space-y-1 text-sm">
                    <li>• Your blood pressure is slightly elevated - consider reducing sodium intake</li>
                    <li>• HbA1c levels suggest room for improvement in diabetes management</li>
                    <li>• Regular exercise can help with both blood pressure and blood sugar control</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">Ask your AI health coach anything about your condition:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask about your medications, symptoms, or health tips..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="bg-purple-600 hover:bg-purple-700">Ask AI</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
