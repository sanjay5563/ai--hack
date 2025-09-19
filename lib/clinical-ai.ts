import type { PatientData, ClinicalSummary, ClinicalAlert } from "./medical-kb"

export class ClinicalAI {
  static generateSummary(patientData: PatientData): ClinicalSummary {
    const alerts = this.generateAlerts(patientData)
    const summary = this.generateProductionSummary(patientData, alerts)

    return {
      summary,
      alerts,
    }
  }

  private static generateProductionSummary(patientData: PatientData, alerts: ClinicalAlert[]): string {
    const age = this.calculateAge(patientData.dob)
    const recentVisit = patientData.visits[patientData.visits.length - 1]
    const criticalAlerts = alerts.filter((alert) => alert.level === "high")
    const mediumAlerts = alerts.filter((alert) => alert.level === "medium")

    // Build structured clinical summary (3-5 sentences as per production spec)
    let summary = `${patientData.name}, ${age}-year-old ${patientData.gender.toLowerCase()}`

    if (patientData.notes) {
      summary += ` with medical history of ${patientData.notes.toLowerCase()}`
    }

    if (recentVisit) {
      summary += `, presents for ${recentVisit.chiefComplaint.toLowerCase()}`
    }
    summary += ". "

    // Add vital trends analysis
    const vitalTrends = this.analyzeVitalTrends(patientData.vitals)
    if (vitalTrends.length > 0) {
      summary += `Current vital trends show ${vitalTrends.join(" and ")}. `
    }

    // Critical findings
    if (criticalAlerts.length > 0) {
      summary += `Critical clinical findings include ${criticalAlerts.map((alert) => alert.message.toLowerCase()).join(" and ")}. `
    }

    // Medium priority findings
    if (mediumAlerts.length > 0) {
      summary += `Additional monitoring required for ${mediumAlerts.map((alert) => alert.message.toLowerCase()).join(" and ")}. `
    }

    // Clinical recommendation
    const totalAlerts = alerts.length
    if (totalAlerts > 0) {
      summary += "Immediate clinical review and therapy optimization recommended based on current indicators."
    } else {
      summary += "Patient appears stable with current management plan."
    }

    return summary
  }

  private static generateAlerts(patientData: PatientData): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = []

    // KB_A1C: HbA1c > 7% = poor diabetes control
    const hba1c = patientData.vitals.find((vital) => vital.type === "hbA1c")
    if (hba1c && hba1c.value > 7.0) {
      alerts.push({
        id: "KB_A1C",
        level: hba1c.value > 9.0 ? "high" : "medium",
        message: `HbA1c ${hba1c.value}% indicates ${hba1c.value > 9.0 ? "poor" : "suboptimal"} diabetes control`,
        evidence: `HbA1c=${hba1c.value}% on ${hba1c.date} (KB_A1C: HbA1c > 7% = poor diabetes control)`,
      })
    }

    // KB_BP: Systolic BP > 140 = high blood pressure
    const systolicBP = patientData.vitals.find((vital) => vital.type === "blood_pressure_systolic")
    if (systolicBP && systolicBP.value > 140) {
      alerts.push({
        id: "KB_BP",
        level: systolicBP.value > 160 ? "high" : "medium",
        message: `Systolic BP ${systolicBP.value} mmHg indicates ${systolicBP.value > 160 ? "severe" : "moderate"} hypertension`,
        evidence: `blood_pressure_systolic=${systolicBP.value} mmHg on ${systolicBP.date} (KB_BP: Systolic BP > 140 = high blood pressure)`,
      })
    }

    // KB_WEIGHT: >5kg gain in 3 months = abnormal
    const weightVitals = patientData.vitals
      .filter((vital) => vital.type === "weight_kg")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (weightVitals.length >= 2) {
      const oldWeight = weightVitals[0]
      const newWeight = weightVitals[weightVitals.length - 1]
      const weightGain = newWeight.value - oldWeight.value
      const monthsDiff = this.getMonthsDifference(oldWeight.date, newWeight.date)

      if (weightGain > 5 && monthsDiff <= 3) {
        alerts.push({
          id: "KB_WEIGHT",
          level: weightGain > 10 ? "high" : "medium",
          message: `Weight gain ${weightGain.toFixed(1)}kg in ${monthsDiff} months exceeds normal parameters`,
          evidence: `weight_kg: ${oldWeight.value}→${newWeight.value}kg between ${oldWeight.date} and ${newWeight.date} (KB_WEIGHT: >5kg gain in 3 months = abnormal)`,
        })
      }
    }

    // KB_INTERACTIONS: Check for drug interactions (mock implementation)
    if (
      patientData.notes.toLowerCase().includes("ace inhibitor") &&
      patientData.notes.toLowerCase().includes("potassium")
    ) {
      alerts.push({
        id: "KB_INTERACTIONS",
        level: "medium",
        message: "Potential drug interaction: ACE inhibitor with potassium supplementation",
        evidence: `Patient notes mention ACE inhibitor and potassium (KB_INTERACTIONS: ACE inhibitor + Potassium-sparing diuretic = hyperkalemia risk)`,
      })
    }

    return alerts
  }

  private static analyzeVitalTrends(vitals: any[]): string[] {
    const trends: string[] = []

    // Analyze HbA1c trend with clinical significance
    const hba1cValues = vitals
      .filter((v) => v.type === "hbA1c")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (hba1cValues.length >= 2) {
      const change = hba1cValues[hba1cValues.length - 1].value - hba1cValues[0].value
      if (Math.abs(change) > 0.3) {
        const direction = change > 0 ? "deteriorating" : "improving"
        trends.push(`HbA1c ${direction} by ${Math.abs(change).toFixed(1)}%`)
      }
    }

    // Analyze blood pressure trend
    const bpValues = vitals
      .filter((v) => v.type === "blood_pressure_systolic")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (bpValues.length >= 2) {
      const change = bpValues[bpValues.length - 1].value - bpValues[0].value
      if (Math.abs(change) > 10) {
        const direction = change > 0 ? "increasing" : "decreasing"
        trends.push(`blood pressure ${direction} by ${Math.abs(change)}mmHg`)
      }
    }

    // Analyze weight trend with clinical context
    const weightValues = vitals
      .filter((v) => v.type === "weight_kg")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (weightValues.length >= 2) {
      const change = weightValues[weightValues.length - 1].value - weightValues[0].value
      if (Math.abs(change) > 2) {
        const direction = change > 0 ? "gain" : "loss"
        trends.push(`${Math.abs(change).toFixed(1)}kg weight ${direction}`)
      }
    }

    return trends
  }

  static generateJSONSummary(patientData: PatientData): string {
    const clinicalSummary = this.generateSummary(patientData)

    const jsonOutput = {
      summary: clinicalSummary.summary,
      alerts: clinicalSummary.alerts.map((alert) => ({
        id: alert.id,
        level: alert.level,
        message: alert.message,
        evidence: alert.evidence,
      })),
    }

    return JSON.stringify(jsonOutput, null, 2)
  }

  static async simulateAIAPICall(patientData: PatientData): Promise<ClinicalSummary> {
    // This simulates what would happen with a real AI API call
    const systemPrompt = `You are a medical records assistant for doctors. 
Given structured patient data and knowledge base rules, generate:
1. A concise clinical summary (3–5 sentences).
2. A list of alerts with clear evidence and KB references.

Always return ONLY JSON in this format:
{
  "summary": "string",
  "alerts": [
    {"id": "KB_x", "level": "low|medium|high", "message": "short text", "evidence": "data point + KB id"}
  ]
}`

    const userPrompt = this.buildUserPrompt(patientData)

    // In production, this would be: const response = await openai.chat.completions.create({...})
    // For now, we return our enhanced local processing
    console.log("[v0] System Prompt:", systemPrompt)
    console.log("[v0] User Prompt:", userPrompt)

    return this.generateSummary(patientData)
  }

  private static buildUserPrompt(patientData: PatientData): string {
    const age = this.calculateAge(patientData.dob)

    let prompt = `Knowledge Base:
- KB_A1C: HbA1c > 7% = poor diabetes control
- KB_BP: Systolic BP > 140 = high blood pressure
- KB_WEIGHT: >5kg gain in 3 months = abnormal
- KB_INTERACTIONS: ACE inhibitor + Potassium-sparing diuretic = hyperkalemia risk

Patient Data:
Patient: ${patientData.name}, Age: ${age}, Gender: ${patientData.gender}
Notes: ${patientData.notes}

Visits:`

    patientData.visits.forEach((visit) => {
      prompt += `\n- ${visit.date}: ${visit.chiefComplaint} | ${visit.notes}`
    })

    prompt += `\n\nVitals:`
    patientData.vitals.forEach((vital) => {
      prompt += `\n- ${vital.date}: ${vital.type} = ${vital.value} ${vital.unit}`
    })

    return prompt
  }

  private static calculateAge(dob: string): number {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  private static getMonthsDifference(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.abs((d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()))
  }
}
