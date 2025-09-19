"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PatientData, PatientVital, PatientVisit } from "@/lib/medical-kb"
import { Plus, Trash2 } from "lucide-react"

interface PatientFormProps {
  onSubmit: (data: PatientData) => void
}

export function PatientForm({ onSubmit }: PatientFormProps) {
  const [patientData, setPatientData] = useState<PatientData>({
    name: "",
    dob: "",
    gender: "",
    notes: "",
    visits: [],
    vitals: [],
  })

  const addVisit = () => {
    setPatientData((prev) => ({
      ...prev,
      visits: [...prev.visits, { date: "", chiefComplaint: "", notes: "" }],
    }))
  }

  const updateVisit = (index: number, field: keyof PatientVisit, value: string) => {
    setPatientData((prev) => ({
      ...prev,
      visits: prev.visits.map((visit, i) => (i === index ? { ...visit, [field]: value } : visit)),
    }))
  }

  const removeVisit = (index: number) => {
    setPatientData((prev) => ({
      ...prev,
      visits: prev.visits.filter((_, i) => i !== index),
    }))
  }

  const addVital = () => {
    setPatientData((prev) => ({
      ...prev,
      vitals: [...prev.vitals, { type: "", value: 0, unit: "", date: "" }],
    }))
  }

  const updateVital = (index: number, field: keyof PatientVital, value: string | number) => {
    setPatientData((prev) => ({
      ...prev,
      vitals: prev.vitals.map((vital, i) => (i === index ? { ...vital, [field]: value } : vital)),
    }))
  }

  const removeVital = (index: number) => {
    setPatientData((prev) => ({
      ...prev,
      vitals: prev.vitals.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(patientData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Patient Name</Label>
              <Input
                id="name"
                value={patientData.name}
                onChange={(e) => setPatientData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter patient name"
                required
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={patientData.dob}
                onChange={(e) => setPatientData((prev) => ({ ...prev, dob: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={patientData.gender}
                onChange={(e) => setPatientData((prev) => ({ ...prev, gender: e.target.value }))}
                placeholder="Male/Female"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Medical History</Label>
            <Textarea
              id="notes"
              value={patientData.notes}
              onChange={(e) => setPatientData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Type 2 diabetes for 10 years, on Metformin and Ramipril"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-primary">Patient Visits</CardTitle>
          <Button type="button" onClick={addVisit} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Visit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientData.visits.map((visit, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Visit {index + 1}</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => removeVisit(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={visit.date} onChange={(e) => updateVisit(index, "date", e.target.value)} />
                </div>
                <div>
                  <Label>Chief Complaint</Label>
                  <Input
                    value={visit.chiefComplaint}
                    onChange={(e) => updateVisit(index, "chiefComplaint", e.target.value)}
                    placeholder="Follow-up diabetes"
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={visit.notes}
                  onChange={(e) => updateVisit(index, "notes", e.target.value)}
                  placeholder="Adjusted Metformin dose"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-primary">Vital Signs</CardTitle>
          <Button type="button" onClick={addVital} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vital
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {patientData.vitals.map((vital, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Vital {index + 1}</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => removeVital(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Type</Label>
                  <Input
                    value={vital.type}
                    onChange={(e) => updateVital(index, "type", e.target.value)}
                    placeholder="hbA1c"
                  />
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vital.value}
                    onChange={(e) => updateVital(index, "value", Number.parseFloat(e.target.value) || 0)}
                    placeholder="8.2"
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={vital.unit}
                    onChange={(e) => updateVital(index, "unit", e.target.value)}
                    placeholder="%"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={vital.date} onChange={(e) => updateVital(index, "date", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg">
        Generate Clinical Summary
      </Button>
    </form>
  )
}
