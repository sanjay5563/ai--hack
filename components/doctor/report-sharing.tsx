"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Share2, Send, QrCode, Mail, Phone, CheckCircle, Clock } from "lucide-react"
import type { PatientData, ClinicalSummary } from "@/lib/medical-kb"

interface SharedReport {
  id: string
  patientName: string
  patientEmail: string
  patientPhone: string
  reportType: string
  sharedDate: string
  status: "sent" | "viewed" | "pending"
  accessCode: string
}

interface ReportSharingProps {
  patientData: PatientData
  clinicalSummary: ClinicalSummary
}

export function ReportSharing({ patientData, clinicalSummary }: ReportSharingProps) {
  const [sharedReports, setSharedReports] = useState<SharedReport[]>([])
  const [isSharing, setIsSharing] = useState(false)
  const [shareMethod, setShareMethod] = useState<"email" | "sms" | "qr">("email")
  const [patientContact, setPatientContact] = useState({
    email: "",
    phone: "",
    message: "",
  })

  const generateAccessCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const shareReport = async () => {
    setIsSharing(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const accessCode = generateAccessCode()
    const newSharedReport: SharedReport = {
      id: `report_${Date.now()}`,
      patientName: patientData.name,
      patientEmail: patientContact.email,
      patientPhone: patientContact.phone,
      reportType: "Clinical Summary",
      sharedDate: new Date().toISOString().split("T")[0],
      status: "sent",
      accessCode,
    }

    setSharedReports([...sharedReports, newSharedReport])

    const existingSharedReports = JSON.parse(localStorage.getItem("shared_reports") || "[]")
    const reportData = {
      ...newSharedReport,
      patientData,
      clinicalSummary,
      doctorMessage: patientContact.message,
      shareMethod,
    }
    localStorage.setItem("shared_reports", JSON.stringify([...existingSharedReports, reportData]))

    setIsSharing(false)
    setPatientContact({ email: "", phone: "", message: "" })
  }

  const generateQRCode = (accessCode: string) => {
    const reportUrl = `${window.location.origin}/patient-report/${accessCode}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Share Report with Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="share-method">Sharing Method</Label>
              <Select value={shareMethod} onValueChange={(value: "email" | "sms" | "qr") => setShareMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="qr">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {shareMethod === "email" && (
              <div className="space-y-2">
                <Label htmlFor="patient-email">Patient Email</Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={patientContact.email}
                  onChange={(e) => setPatientContact({ ...patientContact, email: e.target.value })}
                  placeholder="patient@example.com"
                />
              </div>
            )}

            {shareMethod === "sms" && (
              <div className="space-y-2">
                <Label htmlFor="patient-phone">Patient Phone</Label>
                <Input
                  id="patient-phone"
                  type="tel"
                  value={patientContact.phone}
                  onChange={(e) => setPatientContact({ ...patientContact, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor-message">Message to Patient (Optional)</Label>
            <Textarea
              id="doctor-message"
              value={patientContact.message}
              onChange={(e) => setPatientContact({ ...patientContact, message: e.target.value })}
              placeholder="Add a personal message for the patient..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Report Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Patient:</strong> {patientData.name}
              </p>
              <p>
                <strong>Report Type:</strong> Clinical Summary with AI Analysis
              </p>
              <p>
                <strong>Includes:</strong> Diagnosis, medications, lifestyle recommendations
              </p>
            </div>
          </div>

          <Button
            onClick={shareReport}
            disabled={
              isSharing ||
              (shareMethod === "email" && !patientContact.email) ||
              (shareMethod === "sms" && !patientContact.phone)
            }
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {isSharing ? "Sharing Report..." : "Share Report"}
          </Button>
        </CardContent>
      </Card>

      {sharedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shared Reports History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{report.patientName}</h4>
                      <Badge
                        variant={
                          report.status === "viewed" ? "default" : report.status === "sent" ? "secondary" : "outline"
                        }
                      >
                        {report.status === "viewed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {report.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {report.reportType} • Shared on {report.sharedDate}
                    </p>
                    <p className="text-xs text-gray-500">
                      Access Code: <code className="bg-gray-100 px-1 rounded">{report.accessCode}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {shareMethod === "qr" && (
                      <img
                        src={generateQRCode(report.accessCode) || "/placeholder.svg"}
                        alt="QR Code"
                        className="w-16 h-16 border rounded"
                      />
                    )}
                    <Button variant="outline" size="sm">
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
