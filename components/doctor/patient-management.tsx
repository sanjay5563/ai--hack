"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, Upload, AlertCircle, CheckCircle } from "lucide-react"

interface PatientManagementProps {
  token: string
}

interface Patient {
  id: number
  name: string
  dob?: string
  gender?: string
  owner_doctor_uid: string
  created_at: string
}

export function PatientManagement({ token }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // New patient form
  const [newPatientName, setNewPatientName] = useState("")
  const [newPatientDob, setNewPatientDob] = useState("")
  const [newPatientGender, setNewPatientGender] = useState("")

  // File upload
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8001/doctor/patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch patients")
      }

      const data = await response.json()
      setPatients(data.patients || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createPatient = async () => {
    if (!newPatientName.trim()) {
      setError("Patient name is required")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("http://localhost:8001/doctor/patients/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPatientName,
          dob: newPatientDob || null,
          gender: newPatientGender || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create patient")
      }

      const data = await response.json()
      setSuccess(`Patient "${data.name}" created successfully`)
      setNewPatientName("")
      setNewPatientDob("")
      setNewPatientGender("")
      fetchPatients()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadReport = async () => {
    if (!selectedPatient || !uploadFile) {
      setError("Please select a patient and file")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)

      const response = await fetch(`http://localhost:8001/doctor/patients/${selectedPatient.id}/upload_report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload report")
      }

      const data = await response.json()
      setUploadResult(data)
      setSuccess(`Report uploaded successfully! Report ID: ${data.report_id}`)
      setUploadFile(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patients" className="space-y-4">
            <TabsList>
              <TabsTrigger value="patients">My Patients</TabsTrigger>
              <TabsTrigger value="create">Add New Patient</TabsTrigger>
              <TabsTrigger value="upload">Upload Report</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="patients" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Patient List</h3>
                <Button onClick={fetchPatients} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patients found. Create your first patient to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {patients.map((patient) => (
                    <Card
                      key={patient.id}
                      className={`cursor-pointer transition-colors ${
                        selectedPatient?.id === patient.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{patient.name}</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              {patient.dob && <p>DOB: {patient.dob}</p>}
                              {patient.gender && <p>Gender: {patient.gender}</p>}
                              <p>Created: {new Date(patient.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Patient ID: {patient.id}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <h3 className="text-lg font-medium">Add New Patient</h3>

              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    placeholder="Enter patient's full name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientDob">Date of Birth</Label>
                  <Input
                    id="patientDob"
                    type="date"
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientGender">Gender</Label>
                  <Select value={newPatientGender} onValueChange={setNewPatientGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={createPatient} disabled={loading} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {loading ? "Creating..." : "Create Patient"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <h3 className="text-lg font-medium">Upload Medical Report</h3>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Select Patient</Label>
                  {patients.length === 0 ? (
                    <p className="text-sm text-gray-500">No patients available. Create a patient first.</p>
                  ) : (
                    <Select
                      value={selectedPatient?.id.toString() || ""}
                      onValueChange={(value) => {
                        const patient = patients.find((p) => p.id.toString() === value)
                        setSelectedPatient(patient || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportFile">Medical Report File</Label>
                  <Input
                    id="reportFile"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500">Supported formats: PDF, PNG, JPG, TXT</p>
                </div>

                <Button onClick={uploadReport} disabled={loading || !selectedPatient || !uploadFile} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {loading ? "Uploading..." : "Upload Report"}
                </Button>

                {uploadResult && (
                  <Card className="bg-green-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-green-900 mb-2">Upload Successful!</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <p>
                          <strong>Report ID:</strong> {uploadResult.report_id}
                        </p>
                        <p>
                          <strong>Document ID:</strong> {uploadResult.document_id}
                        </p>
                        <p>
                          <strong>Text Chunks:</strong> {uploadResult.chunks}
                        </p>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        <strong>Share this Report ID with your patient:</strong> {uploadResult.report_id}
                        <br />
                        They can use this ID to access their report in the patient portal.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
