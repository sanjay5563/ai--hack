export interface KnowledgeBaseRule {
  id: string
  condition: string
  description: string
  alertLevel: "low" | "medium" | "high"
}

export const medicalKnowledgeBase: KnowledgeBaseRule[] = [
  {
    id: "KB_A1C",
    condition: "HbA1c > 7.0%",
    description: "HbA1c > 7.0% indicates suboptimal diabetes control.",
    alertLevel: "high",
  },
  {
    id: "KB_BP",
    condition: "Systolic BP > 140 mmHg",
    description: "Systolic blood pressure > 140 mmHg is considered high.",
    alertLevel: "high",
  },
  {
    id: "KB_INTERACTIONS",
    condition: "ACE inhibitor + potassium-sparing diuretic",
    description: "ACE inhibitor + potassium-sparing diuretic may increase hyperkalemia risk.",
    alertLevel: "medium",
  },
  {
    id: "KB_WEIGHT",
    condition: "Weight gain >5kg in 3 months",
    description: "Unintentional weight gain >5kg in 3 months may suggest lifestyle or fluid issues.",
    alertLevel: "medium",
  },
]

export interface PatientVital {
  type: string
  value: number
  unit: string
  date: string
}

export interface PatientVisit {
  date: string
  chiefComplaint: string
  notes: string
}

export interface PatientData {
  name: string
  dob: string
  gender: string
  notes: string
  visits: PatientVisit[]
  vitals: PatientVital[]
}

export interface ClinicalAlert {
  id: string
  level: "low" | "medium" | "high"
  message: string
  evidence: string
}

export interface ClinicalSummary {
  summary: string
  alerts: ClinicalAlert[]
}
