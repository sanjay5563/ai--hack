"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileText, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"

interface ReportSearchProps {
  token: string
}

interface ReportData {
  report_id: string
  patient_id: number
  patient_name: string
  doctor_uid: string
  filename: string
  created_at: string
  preview: string
  document_id: number | null
}

interface AnalysisData {
  report: string[]
  breakdown: Array<{
    title: string
    summary: string
    quotes: string[]
  }>
  suggestions: Array<{
    text: string
    evidence: string
  }>
  patient_summary: string
  sources: string[]
}

interface QAData {
  answer: string
  evidence: string[]
  confidence: string
}

export function PatientReportSearch({ token }: ReportSearchProps) {
  const [reportId, setReportId] = useState("")
  const [report, setReport] = useState<ReportData | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [question, setQuestion] = useState("")
  const [qaAnswer, setQaAnswer] = useState<QAData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const searchReport = async () => {
    if (!reportId.trim()) {
      setError("Please enter a Report ID")
      return
    }

    setLoading(true)
    setError("")
    setReport(null)
    setAnalysis(null)
    setQaAnswer(null)

    try {
      const response = await fetch(`http://localhost:8001/patient/reports/search/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Report not found or access denied")
      }

      const data = await response.json()
      setReport(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeReport = async () => {
    if (!report?.document_id) {
      setError("No document available for analysis")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8001/documents/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: report.document_id,
          top_k: 6,
        }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setAnalysis(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const askQuestion = async () => {
    if (!report?.document_id || !question.trim()) {
      setError("Please enter a question")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:8001/documents/qa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: report.document_id,
          question: question,
        }),
      })

      if (!response.ok) {
        throw new Error("Question answering failed")
      }

      const data = await response.json()
      setQaAnswer(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Medical Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportId">Report ID</Label>
            <div className="flex gap-2">
              <Input
                id="reportId"
                placeholder="Enter Report ID (e.g., REP-20250119-ABC123)"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchReport()}
              />
              <Button onClick={searchReport} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {report && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Report found! You can now view the analysis and ask questions about your medical report.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Report ID</Label>
                <p className="font-mono text-sm">{report.report_id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Patient Name</Label>
                <p>{report.patient_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Filename</Label>
                <p>{report.filename}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Created</Label>
                <p>{new Date(report.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Preview</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{report.preview}</p>
              </div>
            </div>

            <Button onClick={analyzeReport} disabled={loading || !report.document_id}>
              {loading ? "Analyzing..." : "Generate AI Analysis"}
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="space-y-4">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="breakdown">Detailed Breakdown</TabsTrigger>
                <TabsTrigger value="suggestions">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient-Friendly Summary</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm">{analysis.patient_summary}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Key Points</Label>
                  <ul className="mt-1 space-y-1">
                    {analysis.report.map((point, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                {analysis.breakdown.map((section, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
                    <p className="text-sm text-gray-700 mb-3">{section.summary}</p>
                    {section.quotes.length > 0 && (
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Supporting Evidence:</Label>
                        <ul className="mt-1 space-y-1">
                          {section.quotes.map((quote, qIndex) => (
                            <li key={qIndex} className="text-xs text-gray-600 italic">
                              "{quote}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-4">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-md p-4 bg-green-50">
                    <p className="text-sm font-medium text-green-900 mb-2">{suggestion.text}</p>
                    <p className="text-xs text-green-700 italic">Evidence: {suggestion.evidence}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {report?.document_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask Questions About Your Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <div className="flex gap-2">
                <Input
                  id="question"
                  placeholder="e.g., What is my blood pressure reading?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && askQuestion()}
                />
                <Button onClick={askQuestion} disabled={loading || !question.trim()}>
                  {loading ? "Asking..." : "Ask"}
                </Button>
              </div>
            </div>

            {qaAnswer && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Answer</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm">{qaAnswer.answer}</p>
                  </div>
                </div>

                {qaAnswer.evidence.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Supporting Evidence</Label>
                    <ul className="mt-1 space-y-1">
                      {qaAnswer.evidence.map((evidence, index) => (
                        <li key={index} className="text-xs text-gray-600 italic p-2 bg-gray-50 rounded">
                          "{evidence}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-600">Confidence:</Label>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      qaAnswer.confidence === "high"
                        ? "bg-green-100 text-green-800"
                        : qaAnswer.confidence === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {qaAnswer.confidence}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
