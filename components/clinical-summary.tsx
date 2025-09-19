import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ClinicalSummary } from "@/lib/medical-kb"
import { AlertTriangle, Info, AlertCircle } from "lucide-react"

interface ClinicalSummaryProps {
  summary: ClinicalSummary
}

export function ClinicalSummaryDisplay({ summary }: ClinicalSummaryProps) {
  const getAlertIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <AlertCircle className="h-4 w-4" />
      case "low":
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Clinical Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{summary.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            Clinical Alerts
            <Badge variant="outline">{summary.alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.alerts.length === 0 ? (
            <p className="text-muted-foreground">No clinical alerts generated.</p>
          ) : (
            summary.alerts.map((alert, index) => (
              <Alert key={index} variant={getAlertVariant(alert.level)}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.level)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(alert.level)} className="text-xs">
                        {alert.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{alert.id}</span>
                    </div>
                    <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <strong>Evidence:</strong> {alert.evidence}
                    </div>
                  </div>
                </div>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
