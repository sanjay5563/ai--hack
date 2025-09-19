"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, User, Send } from "lucide-react"
import type { PatientData } from "@/lib/medical-kb"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  patientData: PatientData | null
}

export function AIChatbot({ patientData }: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I'm your AI clinical assistant. Ask me anything about the patient's data, trends, or clinical insights.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (!patientData) {
      return "Please load patient data first to get clinical insights."
    }

    if (lowerQuery.includes("diabetes") || lowerQuery.includes("hba1c")) {
      const hba1c = patientData.vitals.find((v) => v.type === "hbA1c")
      if (hba1c) {
        return `The patient's HbA1c is ${hba1c.value}% (recorded on ${hba1c.date}). This indicates ${hba1c.value > 7 ? "poor" : "good"} diabetes control. Target is <7% for most patients.`
      }
      return "No HbA1c data available for this patient."
    }

    if (lowerQuery.includes("blood pressure") || lowerQuery.includes("hypertension")) {
      const bp = patientData.vitals.find((v) => v.type === "blood_pressure_systolic")
      if (bp) {
        return `Systolic blood pressure is ${bp.value} mmHg (${bp.date}). This is ${bp.value > 140 ? "elevated and may indicate hypertension" : "within normal range"}.`
      }
      return "No blood pressure data available."
    }

    if (lowerQuery.includes("weight") || lowerQuery.includes("trend")) {
      const weights = patientData.vitals
        .filter((v) => v.type === "weight_kg")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (weights.length >= 2) {
        const change = weights[weights.length - 1].value - weights[0].value
        return `Weight trend: ${weights[0].value}kg → ${weights[weights.length - 1].value}kg (${change > 0 ? "+" : ""}${change.toFixed(1)}kg change). ${Math.abs(change) > 5 ? "Significant weight change noted." : "Stable weight."}`
      }
      return "Insufficient weight data for trend analysis."
    }

    if (lowerQuery.includes("summary") || lowerQuery.includes("overview")) {
      const age = new Date().getFullYear() - new Date(patientData.dob).getFullYear()
      return `${patientData.name}, ${age} years old, ${patientData.gender}. Medical history: ${patientData.notes}. Recent visits: ${patientData.visits.length}. Key vitals tracked: ${[...new Set(patientData.vitals.map((v) => v.type))].join(", ")}.`
    }

    if (lowerQuery.includes("risk") || lowerQuery.includes("alert")) {
      const risks = []
      const hba1c = patientData.vitals.find((v) => v.type === "hbA1c")
      const bp = patientData.vitals.find((v) => v.type === "blood_pressure_systolic")

      if (hba1c && hba1c.value > 7) risks.push("diabetes control")
      if (bp && bp.value > 140) risks.push("hypertension")

      return risks.length > 0
        ? `Current risk factors: ${risks.join(", ")}. Recommend close monitoring and therapy optimization.`
        : "No major risk factors identified from current data."
    }

    return "I can help you analyze patient data, trends, diabetes control, blood pressure, weight changes, and clinical risks. What specific aspect would you like to explore?"
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: generateResponse(input),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, botResponse])
    setInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Ask SmartEMR
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-80">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex-shrink-0">
                    {message.type === "user" ? (
                      <User className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Bot className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about patient data, trends, or clinical insights..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
