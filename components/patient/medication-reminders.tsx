"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Pill, Clock, Bell, Plus, Trash2, CheckCircle, Calendar } from "lucide-react"

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  times: string[]
  startDate: string
  endDate?: string
  taken: { [key: string]: boolean }
  remindersEnabled: boolean
  instructions?: string
}

interface MedicationRemindersProps {
  patientId: string
}

export function MedicationReminders({ patientId }: MedicationRemindersProps) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [isAddingMedication, setIsAddingMedication] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "once",
    times: ["08:00"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    instructions: "",
    remindersEnabled: true,
  })

  useEffect(() => {
    loadMedications()
    setupNotifications()
  }, [patientId])

  const loadMedications = () => {
    const savedMedications = localStorage.getItem(`medications_${patientId}`)
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications))
    } else {
      const sampleMedications: Medication[] = [
        {
          id: "1",
          name: "Lisinopril",
          dosage: "10mg",
          frequency: "once",
          times: ["08:00"],
          startDate: "2025-01-01",
          taken: {},
          remindersEnabled: true,
          instructions: "Take with water, preferably in the morning",
        },
        {
          id: "2",
          name: "Metformin",
          dosage: "500mg",
          frequency: "twice",
          times: ["08:00", "20:00"],
          startDate: "2025-01-01",
          taken: {},
          remindersEnabled: true,
          instructions: "Take with meals to reduce stomach upset",
        },
      ]
      setMedications(sampleMedications)
      localStorage.setItem(`medications_${patientId}`, JSON.stringify(sampleMedications))
    }
  }

  const setupNotifications = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  const saveMedications = (updatedMedications: Medication[]) => {
    setMedications(updatedMedications)
    localStorage.setItem(`medications_${patientId}`, JSON.stringify(updatedMedications))
  }

  const addMedication = () => {
    const medication: Medication = {
      id: `med_${Date.now()}`,
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      times: newMedication.times,
      startDate: newMedication.startDate,
      endDate: newMedication.endDate || undefined,
      taken: {},
      remindersEnabled: newMedication.remindersEnabled,
      instructions: newMedication.instructions,
    }

    saveMedications([...medications, medication])
    setNewMedication({
      name: "",
      dosage: "",
      frequency: "once",
      times: ["08:00"],
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      instructions: "",
      remindersEnabled: true,
    })
    setIsAddingMedication(false)
  }

  const deleteMedication = (id: string) => {
    saveMedications(medications.filter((med) => med.id !== id))
  }

  const toggleMedicationTaken = (medicationId: string, time: string) => {
    const today = new Date().toISOString().split("T")[0]
    const key = `${today}_${time}`

    const updatedMedications = medications.map((med) => {
      if (med.id === medicationId) {
        return {
          ...med,
          taken: {
            ...med.taken,
            [key]: !med.taken[key],
          },
        }
      }
      return med
    })

    saveMedications(updatedMedications)

    if (updatedMedications.find((m) => m.id === medicationId)?.taken[key]) {
      showNotification(`✅ ${medications.find((m) => m.id === medicationId)?.name} marked as taken`)
    }
  }

  const toggleReminders = (medicationId: string) => {
    const updatedMedications = medications.map((med) => {
      if (med.id === medicationId) {
        return { ...med, remindersEnabled: !med.remindersEnabled }
      }
      return med
    })
    saveMedications(updatedMedications)
  }

  const showNotification = (message: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("SmartEMR Medication Reminder", {
        body: message,
        icon: "/favicon.ico",
      })
    }
  }

  const updateFrequencyTimes = (frequency: string) => {
    const timeMap: { [key: string]: string[] } = {
      once: ["08:00"],
      twice: ["08:00", "20:00"],
      thrice: ["08:00", "14:00", "20:00"],
      four: ["08:00", "12:00", "16:00", "20:00"],
    }

    setNewMedication({
      ...newMedication,
      frequency,
      times: timeMap[frequency] || ["08:00"],
    })
  }

  const getTodayStatus = (medication: Medication) => {
    const today = new Date().toISOString().split("T")[0]
    const takenToday = medication.times.filter((time) => medication.taken[`${today}_${time}`]).length

    return {
      taken: takenToday,
      total: medication.times.length,
      percentage: Math.round((takenToday / medication.times.length) * 100),
    }
  }

  const getNextDose = (medication: Medication) => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number)
      const doseTime = hours * 60 + minutes

      if (doseTime > currentTime) {
        return time
      }
    }

    // If no more doses today, return first dose of tomorrow
    return `Tomorrow ${medication.times[0]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medication Reminders</h2>
          <p className="text-gray-600">Manage your daily medication schedule</p>
        </div>
        <Button onClick={() => setIsAddingMedication(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {medications.map((medication) => {
              const status = getTodayStatus(medication)
              const nextDose = getNextDose(medication)

              return (
                <div key={medication.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{medication.name}</h4>
                    <Badge
                      variant={status.percentage === 100 ? "default" : status.percentage > 0 ? "secondary" : "outline"}
                    >
                      {status.taken}/{status.total}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{medication.dosage}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Next: {nextDose}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isAddingMedication && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Add New Medication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="med-name">Medication Name</Label>
                <Input
                  id="med-name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-dosage">Dosage</Label>
                <Input
                  id="med-dosage"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 100mg"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="med-frequency">Frequency</Label>
                <Select value={newMedication.frequency} onValueChange={updateFrequencyTimes}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once daily</SelectItem>
                    <SelectItem value="twice">Twice daily</SelectItem>
                    <SelectItem value="thrice">Three times daily</SelectItem>
                    <SelectItem value="four">Four times daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="med-start">Start Date</Label>
                <Input
                  id="med-start"
                  type="date"
                  value={newMedication.startDate}
                  onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reminder Times</Label>
              <div className="flex flex-wrap gap-2">
                {newMedication.times.map((time, index) => (
                  <Input
                    key={index}
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...newMedication.times]
                      newTimes[index] = e.target.value
                      setNewMedication({ ...newMedication, times: newTimes })
                    }}
                    className="w-32"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="med-instructions">Instructions (Optional)</Label>
              <Input
                id="med-instructions"
                value={newMedication.instructions}
                onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                placeholder="e.g., Take with food"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newMedication.remindersEnabled}
                  onCheckedChange={(checked) => setNewMedication({ ...newMedication, remindersEnabled: checked })}
                />
                <Label>Enable reminders</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddingMedication(false)}>
                  Cancel
                </Button>
                <Button onClick={addMedication} disabled={!newMedication.name || !newMedication.dosage}>
                  Add Medication
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {medications.map((medication) => {
          const status = getTodayStatus(medication)
          const today = new Date().toISOString().split("T")[0]

          return (
            <Card key={medication.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-600" />
                      {medication.name} {medication.dosage}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {medication.frequency === "once" && "Once daily"}
                      {medication.frequency === "twice" && "Twice daily"}
                      {medication.frequency === "thrice" && "Three times daily"}
                      {medication.frequency === "four" && "Four times daily"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Bell className={`h-4 w-4 ${medication.remindersEnabled ? "text-green-600" : "text-gray-400"}`} />
                      <Switch
                        checked={medication.remindersEnabled}
                        onCheckedChange={() => toggleReminders(medication.id)}
                        size="sm"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMedication(medication.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {medication.instructions && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Instructions:</strong> {medication.instructions}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Today's Doses</h4>
                    <Badge variant={status.percentage === 100 ? "default" : "outline"}>
                      {status.taken}/{status.total} taken
                    </Badge>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {medication.times.map((time) => {
                      const key = `${today}_${time}`
                      const isTaken = medication.taken[key]

                      return (
                        <div
                          key={time}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isTaken ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                          }`}
                          onClick={() => toggleMedicationTaken(medication.id, time)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{time}</span>
                            </div>
                            {isTaken ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{isTaken ? "Taken" : "Pending"}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {medications.length === 0 && !isAddingMedication && (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No medications added</h3>
            <p className="text-gray-600 mb-4">Start by adding your first medication to track your schedule</p>
            <Button onClick={() => setIsAddingMedication(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
