"use client"

import { useState, useEffect } from "react"
import { RoleSelector } from "@/components/auth/role-selector"
import { LoginForm } from "@/components/auth/login-form"
import { PatientList } from "@/components/patient-management/patient-list"
import { PatientForm } from "@/components/patient-form"
import { ClinicalSummaryDisplay } from "@/components/clinical-summary"
import { VitalsChart } from "@/components/vitals-chart"
import { VoiceRecorder } from "@/components/voice-recorder"
import { AIChatbot } from "@/components/ai-chatbot"
import { PredictiveAnalytics } from "@/components/predictive-analytics"
import { ReportGenerator } from "@/components/report-generator"
import { QRReport } from "@/components/creative-features/qr-report"
import { MultiLanguage } from "@/components/creative-features/multi-language"
import { OfflineIndicator } from "@/components/creative-features/offline-indicator"
import { ReportSharing } from "@/components/doctor/report-sharing"
import { RiskPrediction } from "@/components/ai/risk-prediction"
import { ClinicalDecisionSupport } from "@/components/ai/clinical-decision-support"
import { DocumentUpload } from "@/components/document-analysis/document-upload"
import { FirebaseAuth } from "@/components/auth/firebase-auth"
import { PatientReportSearch } from "@/components/patient/patient-report-search"
import { PatientManagement } from "@/components/doctor/patient-management"
import type { ClinicalSummary } from "@/lib/medical-kb"
import { ClinicalAI } from "@/lib/clinical-ai"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"
import {
  Brain,
  Stethoscope,
  FileText,
  AlertTriangle,
  BarChart3,
  Bot,
  Mic,
  FileDown,
  ArrowLeft,
  LogOut,
  QrCode,
  Languages,
  Share2,
  TrendingUp,
  Lightbulb,
  Upload,
} from "lucide-react"
import type { User } from "firebase/auth"

interface DoctorData {
  name: string
  email: string
  id: string
}

interface FirebaseUser {
  user: User
  token: string
  role: string
}

type UserRole = "doctor" | "patient" | null

export default function SmartEMRPage() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [doctor, setDoctor] = useState<DoctorData | null>(null)
  const [patient, setPatient] = useState<any | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [currentPatient, setCurrentPatient] = useState<any | null>(null)
  const [currentSummary, setCurrentSummary] = useState<ClinicalSummary | null>(null)
  const [view, setView] = useState<"patients" | "form" | "dashboard" | "management">("patients")

  useEffect(() => {
    if (doctor) {
      const savedPatients = localStorage.getItem(`patients_${doctor.id}`)
      if (savedPatients) {
        setPatients(JSON.parse(savedPatients))
      }
    }
  }, [doctor])

  useEffect(() => {
    if (doctor && patients.length > 0) {
      localStorage.setItem(`patients_${doctor.id}`, JSON.stringify(patients))
    }
  }, [patients, doctor])

  const handleRoleSelect = (role: "doctor" | "patient") => {
    setUserRole(role)
    setDoctor(null)
    setPatient(null)
    setFirebaseUser(null)
    setPatients([])
    setCurrentPatient(null)
    setCurrentSummary(null)
    setView("patients")
  }

  const handleDoctorLogin = (doctorData: DoctorData) => {
    setDoctor(doctorData)
  }

  const handlePatientLogin = (patientData: any) => {
    setPatient(patientData)
  }

  const handleFirebaseLogin = (user: User, token: string, role: string) => {
    const userData = {
      user,
      token,
      role,
    }
    setFirebaseUser(userData)
    setUserRole(role as "doctor" | "patient")

    if (role === "doctor") {
      setDoctor({
        name: user.displayName || user.email?.split("@")[0] || "Doctor",
        email: user.email || "",
        id: user.uid,
      })
    } else {
      setPatient({
        name: user.displayName || user.email?.split("@")[0] || "Patient",
        email: user.email || "",
        id: user.uid,
      })
    }
  }

  const handleLogout = () => {
    setUserRole(null)
    setDoctor(null)
    setPatient(null)
    setFirebaseUser(null)
    setPatients([])
    setCurrentPatient(null)
    setCurrentSummary(null)
    setView("patients")
  }

  const handleBackToRoleSelection = () => {
    setUserRole(null)
    setDoctor(null)
    setPatient(null)
  }

  const handleSelectPatient = (patient: any) => {
    setCurrentPatient(patient)
    const summary = ClinicalAI.generateSummary(patient)
    setCurrentSummary(summary)
    setView("dashboard")
  }

  const handleAddPatient = () => {
    setCurrentPatient(null)
    setCurrentSummary(null)
    setView("form")
  }

  const handlePatientSubmit = (patientData: any) => {
    const existingIndex = patients.findIndex((p) => p.name === patientData.name)
    if (existingIndex >= 0) {
      const updatedPatients = [...patients]
      updatedPatients[existingIndex] = patientData
      setPatients(updatedPatients)
    } else {
      setPatients([...patients, patientData])
    }

    const summary = ClinicalAI.generateSummary(patientData)
    setCurrentSummary(summary)
    setCurrentPatient(patientData)
    setView("dashboard")
  }

  const handleBackToPatients = () => {
    setView("patients")
    setCurrentPatient(null)
    setCurrentSummary(null)
  }

  const handleVoiceTranscription = (text: string) => {
    console.log("[v0] Voice transcription:", text)
  }

  if (!userRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />
  }

  if (!firebaseUser) {
    return <FirebaseAuth onLogin={handleFirebaseLogin} onBack={() => setUserRole(null)} />
  }

  if (userRole === "patient") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                  <Brain className="h-4 w-4 text-indigo-600 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">SmartEMR AI</h1>
                  <p className="text-sm text-gray-600">Patient Portal</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-900">{firebaseUser.user.displayName || "Patient"}</p>
                  <p className="text-sm text-gray-600">{firebaseUser.user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <PatientReportSearch token={firebaseUser.token} />
        </main>
      </div>
    )
  }

  if (userRole === "doctor") {
    if (!doctor) {
      return <LoginForm onLogin={handleDoctorLogin} />
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                  <Brain className="h-4 w-4 text-indigo-600 absolute -top-1 -right-1" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">SmartEMR AI</h1>
                  <p className="text-sm text-gray-600">Smarter records. Faster care.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <OfflineIndicator />
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-900">{doctor?.name}</p>
                  <p className="text-sm text-gray-600">{doctor?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {view === "management" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setView("patients")} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
                  <p className="text-gray-600">Manage patients and upload medical reports</p>
                </div>
              </div>
              <PatientManagement token={firebaseUser.token} />
            </div>
          )}

          {view === "patients" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600">Manage your patients and medical records</p>
                </div>
                <Button onClick={() => setView("management")} className="gap-2">
                  <Users className="h-4 w-4" />
                  Patient Management
                </Button>
              </div>
              <PatientList patients={patients} onSelectPatient={handleSelectPatient} onAddPatient={handleAddPatient} />
            </div>
          )}

          {view === "form" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleBackToPatients} className="gap-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Patients
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Patient</h2>
                  <p className="text-gray-600">Enter patient information and medical history</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PatientForm onSubmit={handlePatientSubmit} />
                </CardContent>
              </Card>
            </div>
          )}

          {view === "dashboard" && currentPatient && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={handleBackToPatients} className="gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-blue-600" />
                      {currentPatient.name}
                    </h2>
                    <p className="text-gray-600">Clinical Analysis Dashboard</p>
                  </div>
                </div>
                <Button onClick={() => setView("form")} variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Edit Patient
                </Button>
              </div>

              <Tabs defaultValue="summary" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 sm:grid-cols-12">
                  <TabsTrigger value="summary" className="gap-1 text-xs sm:text-sm">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Summary</span>
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1 text-xs sm:text-sm">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Charts</span>
                  </TabsTrigger>
                  <TabsTrigger value="predictions" className="gap-1 text-xs sm:text-sm">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Predict</span>
                  </TabsTrigger>
                  <TabsTrigger value="risk-prediction" className="gap-1 text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Risk AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="clinical-support" className="gap-1 text-xs sm:text-sm">
                    <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">CDS</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Docs AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="chatbot" className="gap-1 text-xs sm:text-sm">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">AI Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-1 text-xs sm:text-sm">
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Voice</span>
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm">
                    <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reports</span>
                  </TabsTrigger>
                  <TabsTrigger value="share" className="gap-1 text-xs sm:text-sm">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="gap-1 text-xs sm:text-sm">
                    <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">QR</span>
                  </TabsTrigger>
                  <TabsTrigger value="translate" className="gap-1 text-xs sm:text-sm">
                    <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Translate</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                  {currentSummary && <ClinicalSummaryDisplay summary={currentSummary} />}
                </TabsContent>

                <TabsContent value="charts" className="space-y-6">
                  <VitalsChart vitals={currentPatient.vitals} />
                </TabsContent>

                <TabsContent value="predictions" className="space-y-6">
                  <PredictiveAnalytics patientData={currentPatient} />
                </TabsContent>

                <TabsContent value="risk-prediction" className="space-y-6">
                  <RiskPrediction patientData={currentPatient} />
                </TabsContent>

                <TabsContent value="clinical-support" className="space-y-6">
                  <ClinicalDecisionSupport patientData={currentPatient} />
                </TabsContent>

                <TabsContent value="documents" className="space-y-6">
                  <DocumentUpload patientData={currentPatient} />
                </TabsContent>

                <TabsContent value="chatbot" className="space-y-6">
                  <AIChatbot patientData={currentPatient} />
                </TabsContent>

                <TabsContent value="voice" className="space-y-6">
                  <VoiceRecorder onTranscription={handleVoiceTranscription} />
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                  {currentSummary && <ReportGenerator patientData={currentPatient} clinicalSummary={currentSummary} />}
                </TabsContent>

                <TabsContent value="share" className="space-y-6">
                  {currentSummary && <ReportSharing patientData={currentPatient} clinicalSummary={currentSummary} />}
                </TabsContent>

                <TabsContent value="qr" className="space-y-6">
                  {currentSummary && <QRReport patientData={currentPatient} clinicalSummary={currentSummary} />}
                </TabsContent>

                <TabsContent value="translate" className="space-y-6">
                  {currentSummary && <MultiLanguage clinicalSummary={currentSummary} />}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>

        <footer className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                SmartEMR AI - Supporting Healthcare Professionals with AI-Powered Insights
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Version 2.0</span>
                <span>•</span>
                <span>© 2025 SmartEMR AI</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return null
}
