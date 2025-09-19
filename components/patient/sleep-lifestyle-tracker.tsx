"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Moon, Activity, Utensils, Droplets, Plus } from "lucide-react"

interface SleepEntry {
  id: string
  date: string
  bedtime: string
  wakeTime: string
  quality: "poor" | "fair" | "good" | "excellent"
  duration: number
  notes?: string
}

interface ActivityEntry {
  id: string
  date: string
  type: string
  duration: number
  intensity: "low" | "moderate" | "high"
  calories?: number
}

interface NutritionEntry {
  id: string
  date: string
  meal: "breakfast" | "lunch" | "dinner" | "snack"
  description: string
  calories?: number
  notes?: string
}

interface WaterEntry {
  id: string
  date: string
  amount: number // in ml
}

interface LifestyleTrackerProps {
  patientId: string
}

export function SleepLifestyleTracker({ patientId }: LifestyleTrackerProps) {
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([])
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([])
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([])
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([])
  const [activeTab, setActiveTab] = useState<"sleep" | "activity" | "nutrition" | "water">("sleep")
  const [isAddingEntry, setIsAddingEntry] = useState(false)

  const [newSleepEntry, setNewSleepEntry] = useState({
    bedtime: "22:00",
    wakeTime: "07:00",
    quality: "good" as const,
    notes: "",
  })

  const [newActivityEntry, setNewActivityEntry] = useState({
    type: "",
    duration: 30,
    intensity: "moderate" as const,
    calories: 0,
  })

  const [newNutritionEntry, setNewNutritionEntry] = useState({
    meal: "breakfast" as const,
    description: "",
    calories: 0,
    notes: "",
  })

  const [todayWater, setTodayWater] = useState(0)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = () => {
    const sleepData = localStorage.getItem(`sleep_${patientId}`)
    const activityData = localStorage.getItem(`activity_${patientId}`)
    const nutritionData = localStorage.getItem(`nutrition_${patientId}`)
    const waterData = localStorage.getItem(`water_${patientId}`)

    if (sleepData) setSleepEntries(JSON.parse(sleepData))
    if (activityData) setActivityEntries(JSON.parse(activityData))
    if (nutritionData) setNutritionEntries(JSON.parse(nutritionData))
    if (waterData) setWaterEntries(JSON.parse(waterData))

    const today = new Date().toISOString().split("T")[0]
    const todayWaterEntry = waterData ? JSON.parse(waterData).find((entry: WaterEntry) => entry.date === today) : null
    setTodayWater(todayWaterEntry?.amount || 0)
  }

  const saveData = (type: string, data: any[]) => {
    localStorage.setItem(`${type}_${patientId}`, JSON.stringify(data))
  }

  const calculateSleepDuration = (bedtime: string, wakeTime: string) => {
    const [bedHour, bedMin] = bedtime.split(":").map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number)

    const bedMinutes = bedHour * 60 + bedMin
    let wakeMinutes = wakeHour * 60 + wakeMin

    // Handle overnight sleep
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60
    }

    return (wakeMinutes - bedMinutes) / 60
  }

  const addSleepEntry = () => {
    const duration = calculateSleepDuration(newSleepEntry.bedtime, newSleepEntry.wakeTime)
    const entry: SleepEntry = {
      id: `sleep_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      bedtime: newSleepEntry.bedtime,
      wakeTime: newSleepEntry.wakeTime,
      quality: newSleepEntry.quality,
      duration,
      notes: newSleepEntry.notes,
    }

    const updated = [entry, ...sleepEntries]
    setSleepEntries(updated)
    saveData("sleep", updated)
    setIsAddingEntry(false)
    setNewSleepEntry({ bedtime: "22:00", wakeTime: "07:00", quality: "good", notes: "" })
  }

  const addActivityEntry = () => {
    const entry: ActivityEntry = {
      id: `activity_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: newActivityEntry.type,
      duration: newActivityEntry.duration,
      intensity: newActivityEntry.intensity,
      calories: newActivityEntry.calories || undefined,
    }

    const updated = [entry, ...activityEntries]
    setActivityEntries(updated)
    saveData("activity", updated)
    setIsAddingEntry(false)
    setNewActivityEntry({ type: "", duration: 30, intensity: "moderate", calories: 0 })
  }

  const addNutritionEntry = () => {
    const entry: NutritionEntry = {
      id: `nutrition_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      meal: newNutritionEntry.meal,
      description: newNutritionEntry.description,
      calories: newNutritionEntry.calories || undefined,
      notes: newNutritionEntry.notes,
    }

    const updated = [entry, ...nutritionEntries]
    setNutritionEntries(updated)
    saveData("nutrition", updated)
    setIsAddingEntry(false)
    setNewNutritionEntry({ meal: "breakfast", description: "", calories: 0, notes: "" })
  }

  const addWater = (amount: number) => {
    const today = new Date().toISOString().split("T")[0]
    const newAmount = todayWater + amount
    setTodayWater(newAmount)

    const existingIndex = waterEntries.findIndex((entry) => entry.date === today)
    let updated: WaterEntry[]

    if (existingIndex >= 0) {
      updated = waterEntries.map((entry) => (entry.date === today ? { ...entry, amount: newAmount } : entry))
    } else {
      const newEntry: WaterEntry = {
        id: `water_${Date.now()}`,
        date: today,
        amount: newAmount,
      }
      updated = [newEntry, ...waterEntries]
    }

    setWaterEntries(updated)
    saveData("water", updated)
  }

  const getWeeklyStats = () => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const weekStart = lastWeek.toISOString().split("T")[0]

    const recentSleep = sleepEntries.filter((entry) => entry.date >= weekStart)
    const recentActivity = activityEntries.filter((entry) => entry.date >= weekStart)
    const recentWater = waterEntries.filter((entry) => entry.date >= weekStart)

    return {
      avgSleep:
        recentSleep.length > 0
          ? (recentSleep.reduce((sum, entry) => sum + entry.duration, 0) / recentSleep.length).toFixed(1)
          : "0",
      totalActivity: recentActivity.reduce((sum, entry) => sum + entry.duration, 0),
      avgWater:
        recentWater.length > 0
          ? Math.round(recentWater.reduce((sum, entry) => sum + entry.amount, 0) / recentWater.length)
          : 0,
    }
  }

  const stats = getWeeklyStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lifestyle Tracking</h2>
          <p className="text-gray-600">Monitor your sleep, activity, nutrition, and hydration</p>
        </div>
        <Button onClick={() => setIsAddingEntry(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Moon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Sleep</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgSleep}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Weekly Activity</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalActivity}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Water</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.avgWater}ml</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { key: "sleep", label: "Sleep", icon: Moon },
          { key: "activity", label: "Activity", icon: Activity },
          { key: "nutrition", label: "Nutrition", icon: Utensils },
          { key: "water", label: "Water", icon: Droplets },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "sleep" && (
        <div className="space-y-4">
          {isAddingEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-600" />
                  Log Sleep
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bedtime">Bedtime</Label>
                    <Input
                      id="bedtime"
                      type="time"
                      value={newSleepEntry.bedtime}
                      onChange={(e) => setNewSleepEntry({ ...newSleepEntry, bedtime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waketime">Wake Time</Label>
                    <Input
                      id="waketime"
                      type="time"
                      value={newSleepEntry.wakeTime}
                      onChange={(e) => setNewSleepEntry({ ...newSleepEntry, wakeTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep-quality">Sleep Quality</Label>
                  <Select
                    value={newSleepEntry.quality}
                    onValueChange={(value: any) => setNewSleepEntry({ ...newSleepEntry, quality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep-notes">Notes (Optional)</Label>
                  <Textarea
                    id="sleep-notes"
                    value={newSleepEntry.notes}
                    onChange={(e) => setNewSleepEntry({ ...newSleepEntry, notes: e.target.value })}
                    placeholder="How did you sleep? Any factors affecting your sleep?"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addSleepEntry}>Add Sleep Entry</Button>
                  <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {sleepEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{entry.date}</h4>
                        <Badge
                          variant={
                            entry.quality === "excellent"
                              ? "default"
                              : entry.quality === "good"
                                ? "secondary"
                                : entry.quality === "fair"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {entry.quality}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {entry.bedtime} - {entry.wakeTime} ({entry.duration.toFixed(1)}h)
                      </p>
                      {entry.notes && <p className="text-sm text-gray-500 italic">{entry.notes}</p>}
                    </div>
                    <Moon className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          {isAddingEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Log Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-type">Activity Type</Label>
                    <Input
                      id="activity-type"
                      value={newActivityEntry.type}
                      onChange={(e) => setNewActivityEntry({ ...newActivityEntry, type: e.target.value })}
                      placeholder="e.g., Walking, Running, Yoga"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-duration">Duration (minutes)</Label>
                    <Input
                      id="activity-duration"
                      type="number"
                      value={newActivityEntry.duration}
                      onChange={(e) =>
                        setNewActivityEntry({ ...newActivityEntry, duration: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-intensity">Intensity</Label>
                    <Select
                      value={newActivityEntry.intensity}
                      onValueChange={(value: any) => setNewActivityEntry({ ...newActivityEntry, intensity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activity-calories">Calories (Optional)</Label>
                    <Input
                      id="activity-calories"
                      type="number"
                      value={newActivityEntry.calories}
                      onChange={(e) =>
                        setNewActivityEntry({ ...newActivityEntry, calories: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addActivityEntry} disabled={!newActivityEntry.type}>
                    Add Activity
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {activityEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{entry.type}</h4>
                        <Badge
                          variant={
                            entry.intensity === "high"
                              ? "default"
                              : entry.intensity === "moderate"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {entry.intensity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {entry.duration} minutes • {entry.date}
                        {entry.calories && ` • ${entry.calories} calories`}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "water" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-cyan-600" />
                Today's Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-600">{todayWater}ml</div>
                <p className="text-gray-600">Daily Goal: 2000ml</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((todayWater / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[250, 500, 750, 1000].map((amount) => (
                  <Button key={amount} variant="outline" onClick={() => addWater(amount)} className="gap-2">
                    <Droplets className="h-4 w-4" />+{amount}ml
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {waterEntries.slice(0, 7).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{entry.date}</h4>
                      <p className="text-sm text-gray-600">{entry.amount}ml</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-cyan-600 h-2 rounded-full"
                          style={{ width: `${Math.min((entry.amount / 2000) * 100, 100)}%` }}
                        />
                      </div>
                      <Droplets className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "nutrition" && (
        <div className="space-y-4">
          {isAddingEntry && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  Log Meal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meal-type">Meal Type</Label>
                    <Select
                      value={newNutritionEntry.meal}
                      onValueChange={(value: any) => setNewNutritionEntry({ ...newNutritionEntry, meal: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal-calories">Calories (Optional)</Label>
                    <Input
                      id="meal-calories"
                      type="number"
                      value={newNutritionEntry.calories}
                      onChange={(e) =>
                        setNewNutritionEntry({ ...newNutritionEntry, calories: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meal-description">What did you eat?</Label>
                  <Textarea
                    id="meal-description"
                    value={newNutritionEntry.description}
                    onChange={(e) => setNewNutritionEntry({ ...newNutritionEntry, description: e.target.value })}
                    placeholder="Describe your meal..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={addNutritionEntry} disabled={!newNutritionEntry.description}>
                    Add Meal
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {nutritionEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium capitalize">{entry.meal}</h4>
                        <Badge variant="outline">{entry.date}</Badge>
                        {entry.calories && <Badge variant="secondary">{entry.calories} cal</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{entry.description}</p>
                      {entry.notes && <p className="text-sm text-gray-500 italic">{entry.notes}</p>}
                    </div>
                    <Utensils className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
