"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, ImageIcon, AlertCircle, CheckCircle, Loader2, MessageSquare } from "lucide-react"

interface DocumentAnalysis {
  report: string[]
  breakdown: Array<{
    title: string
    summary: string
    quotes: string[]
  }>
  suggestions: string[]
  patient_summary: string
  sources: string[]
}

interface DocumentUploadProps {
  patientData?: any
}

export function DocumentUpload({ patientData }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [documentId, setDocumentId] = useState<number | null>(null)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [question, setQuestion] = useState("")
  const [qaResponse, setQaResponse] = useState<any>(null)
  const [askingQuestion, setAskingQuestion] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAnalysis(null)
      setDocumentId(null)
      setQaResponse(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      // Simulate document upload and text extraction
      const formData = new FormData()
      formData.append("file", file)

      // Mock API call - in production, this would call your FastAPI backend
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock response
      const mockDocumentId = Math.floor(Math.random() * 1000) + 1
      setDocumentId(mockDocumentId)

      console.log("[v0] Document uploaded successfully:", mockDocumentId)
    } catch (error) {
      console.error("[v0] Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!documentId) return

    setAnalyzing(true)
    try {
      // Mock AI analysis - in production, this would call your FastAPI /documents/analyze endpoint
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock comprehensive analysis response
      const mockAnalysis: DocumentAnalysis = {
        report: [
          "Patient presents with elevated HbA1c of 8.2% indicating poor glycemic control",
          "Blood pressure readings show hypertensive range (150/90 mmHg)",
          "BMI of 28.5 suggests overweight status requiring intervention",
          "Lipid panel shows borderline high cholesterol (220 mg/dL)",
          "Microalbumin positive suggesting early diabetic nephropathy",
          "Retinal screening shows mild non-proliferative diabetic retinopathy",
        ],
        breakdown: [
          {
            title: "Laboratory Results",
            summary: "Multiple abnormal values indicating diabetes complications",
            quotes: [
              "HbA1c: 8.2% (target <7%)",
              "Creatinine: 1.3 mg/dL (elevated)",
              "Microalbumin: 45 mg/g (positive)",
            ],
          },
          {
            title: "Vital Signs",
            summary: "Hypertensive readings requiring immediate attention",
            quotes: ["BP: 150/90 mmHg", "Heart rate: 88 bpm", "Weight: 185 lbs"],
          },
          {
            title: "Clinical Assessment",
            summary: "Type 2 diabetes with multiple complications",
            quotes: ["Poor glycemic control", "Early nephropathy", "Mild retinopathy"],
          },
        ],
        suggestions: [
          "Intensify diabetes management - consider insulin therapy or GLP-1 agonist",
          "Initiate ACE inhibitor for nephroprotection and blood pressure control",
          "Refer to ophthalmology for diabetic retinopathy monitoring",
          "Nutritionist consultation for weight management and dietary counseling",
          "Increase monitoring frequency - HbA1c every 3 months until target achieved",
        ],
        patient_summary:
          "Your recent lab results show that your diabetes needs better control. Your blood sugar levels are higher than target, and we've detected early signs of diabetes affecting your kidneys and eyes. We'll work together on a new treatment plan to improve your health.",
        sources: ["Lab report section 1", "Vital signs section", "Clinical notes section 2"],
      }

      setAnalysis(mockAnalysis)
      console.log("[v0] Document analysis completed")
    } catch (error) {
      console.error("[v0] Analysis failed:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!question.trim() || !documentId) return

    setAskingQuestion(true)
    try {
      // Mock QA response - in production, this would call your FastAPI /documents/qa endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock intelligent QA response based on question
      const mockQaResponse = {
        answer: question.toLowerCase().includes("hba1c")
          ? "The patient's HbA1c is 8.2%, which is significantly above the target of <7% for most diabetic patients."
          : question.toLowerCase().includes("blood pressure")
            ? "The blood pressure reading is 150/90 mmHg, which is in the hypertensive range and requires treatment."
            : "Based on the document, the patient shows multiple signs of diabetes complications requiring comprehensive management.",
        evidence: [
          "HbA1c: 8.2% (target <7%)",
          "Blood pressure: 150/90 mmHg",
          "Microalbumin positive indicating early kidney involvement",
        ],
        confidence: "high",
      }

      setQaResponse(mockQaResponse)
      console.log("[v0] QA response generated")
    } catch (error) {
      console.error("[v0] QA failed:", error)
    } finally {
      setAskingQuestion(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload & AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document">Upload Medical Document</Label>
            <Input
              id="document"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">Supported formats: PDF, Images (PNG, JPG), Text files</p>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {file.type.includes("image") ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={!file || uploading} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>

            {documentId && (
              <Button onClick={handleAnalyze} disabled={analyzing} variant="secondary" className="gap-2">
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            )}
          </div>

          {documentId && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Document uploaded successfully (ID: {documentId})
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Clinical Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Analysis Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.report.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Document Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.breakdown.map((section, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-sm">{section.title}</h4>
                  <p className="text-sm text-muted-foreground">{section.summary}</p>
                  <div className="space-y-1">
                    {section.quotes.map((quote, qIndex) => (
                      <div key={qIndex} className="text-xs bg-muted p-2 rounded border-l-2 border-blue-500">
                        "{quote}"
                      </div>
                    ))}
                  </div>
                  {index < analysis.breakdown.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Clinical Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Evidence-Based Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 text-xs">
                      {index + 1}
                    </Badge>
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient-Friendly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm">{analysis.patient_summary}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Q&A Section */}
      {documentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask Questions About This Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                placeholder="e.g., What is the patient's HbA1c level? What are the main concerns?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
              />
            </div>

            <Button onClick={handleAskQuestion} disabled={!question.trim() || askingQuestion} className="gap-2">
              {askingQuestion ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Ask Question
                </>
              )}
            </Button>

            {qaResponse && (
              <div className="space-y-3 mt-4">
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-sm mb-2">Answer:</h4>
                  <p className="text-sm">{qaResponse.answer}</p>
                </div>

                {qaResponse.evidence.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Supporting Evidence:</h4>
                    {qaResponse.evidence.map((evidence: string, index: number) => (
                      <div key={index} className="text-xs bg-muted p-2 rounded border-l-2 border-green-500">
                        "{evidence}"
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={qaResponse.confidence === "high" ? "default" : "secondary"} className="text-xs">
                    Confidence: {qaResponse.confidence}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
