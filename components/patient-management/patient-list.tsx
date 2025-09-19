"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, User, Calendar, AlertTriangle } from "lucide-react"
import type { PatientData } from "@/lib/medical-kb"

interface PatientListProps {
  patients: PatientData[]
  onSelectPatient: (patient: PatientData) => void
  onAddPatient: () => void
}

export function PatientList({ patients, onSelectPatient, onAddPatient }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.notes.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPatientStatus = (patient: PatientData) => {
    // Check for high-risk conditions
    const hasHighBP = patient.vitals.some((v) => v.type === "blood_pressure_systolic" && v.value > 140)
    const hasHighA1C = patient.vitals.some((v) => v.type === "hbA1c" && v.value > 7)

    if (hasHighBP || hasHighA1C) return "high-risk"
    return "stable"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
          <p className="text-gray-600">Manage your patient records</p>
        </div>
        <Button onClick={onAddPatient} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search patients..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient, index) => {
          const status = getPatientStatus(patient)
          const lastVisit = patient.visits[patient.visits.length - 1]

          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectPatient(patient)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {patient.gender} • Age {new Date().getFullYear() - new Date(patient.dob).getFullYear()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={status === "high-risk" ? "destructive" : "secondary"} className="gap-1">
                    {status === "high-risk" && <AlertTriangle className="h-3 w-3" />}
                    {status === "high-risk" ? "High Risk" : "Stable"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 line-clamp-2">{patient.notes}</p>
                  {lastVisit && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Last visit: {new Date(lastVisit.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first patient"}
            </p>
            {!searchTerm && (
              <Button onClick={onAddPatient} className="bg-blue-600 hover:bg-blue-700">
                Add Your First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
