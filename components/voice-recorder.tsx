"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Play, Pause, FileText, Wand2 } from "lucide-react"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [structuredNote, setStructuredNote] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)

        setTimeout(() => {
          const mockTranscriptions = [
            "Patient presents with chest pain radiating to left arm, onset 2 hours ago. No shortness of breath or diaphoresis. Vital signs: BP 140/90, HR 88, RR 16, O2 sat 98% on room air. EKG shows normal sinus rhythm. Recommend cardiac enzymes and chest X-ray.",
            "Follow-up visit for diabetes management. Patient reports good adherence to metformin 1000mg twice daily. Recent HbA1c 7.2%, improved from 8.1% three months ago. Weight stable at 82kg. Blood pressure well controlled. Continue current regimen, recheck in 3 months.",
            "New patient consultation for hypertension. Family history significant for cardiovascular disease. Current BP readings at home averaging 150/95. No current medications. Lifestyle counseling provided. Starting lisinopril 10mg daily. Follow-up in 2 weeks.",
          ]
          const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
          setTranscription(randomTranscription)
          onTranscription(randomTranscription)
        }, 1500)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const generateStructuredNote = async () => {
    if (!transcription) return

    setIsProcessing(true)

    // Simulate AI processing to convert free text to structured clinical note
    setTimeout(() => {
      const structuredOutput = `CHIEF COMPLAINT:
${transcription.split(".")[0]}.

HISTORY OF PRESENT ILLNESS:
${transcription.split(".").slice(1, 3).join(". ")}.

VITAL SIGNS:
${transcription.includes("BP") ? transcription.match(/BP \d+\/\d+|HR \d+|RR \d+|O2 sat \d+%[^.]*/)?.join(", ") || "Not documented" : "Not documented"}

ASSESSMENT & PLAN:
${transcription.split(".").slice(-2).join(". ")}.

FOLLOW-UP:
As recommended above.`

      setStructuredNote(structuredOutput)
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice-to-Clinical Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <MicOff className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {audioURL && (
              <Button onClick={togglePlayback} variant="outline" className="gap-2 bg-transparent">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            )}

            {transcription && (
              <Button
                onClick={generateStructuredNote}
                disabled={isProcessing}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Wand2 className="h-4 w-4" />
                {isProcessing ? "Processing..." : "Structure Note"}
              </Button>
            )}
          </div>

          {audioURL && <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} className="hidden" />}

          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              Recording clinical notes...
            </div>
          )}

          {transcription && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Transcription
                </Badge>
              </div>
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="Transcribed text will appear here..."
                className="min-h-[100px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {structuredNote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Structured Clinical Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <pre className="text-sm whitespace-pre-wrap font-mono">{structuredNote}</pre>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge variant="secondary">AI Generated</Badge>
              <Badge variant="secondary">SOAP Format</Badge>
              <Badge variant="secondary">Ready for EHR</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
