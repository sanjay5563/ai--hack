"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "syncing">("synced")

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setSyncStatus("syncing")
      // Simulate sync process
      setTimeout(() => setSyncStatus("synced"), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus("pending")
    }

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline && syncStatus === "synced") {
    return (
      <Badge variant="outline" className="gap-1 text-green-700 border-green-200 bg-green-50">
        <Wifi className="h-3 w-3" />
        Online
      </Badge>
    )
  }

  if (!isOnline) {
    return (
      <Badge variant="outline" className="gap-1 text-orange-700 border-orange-200 bg-orange-50">
        <WifiOff className="h-3 w-3" />
        Offline Mode
      </Badge>
    )
  }

  if (syncStatus === "syncing") {
    return (
      <Badge variant="outline" className="gap-1 text-blue-700 border-blue-200 bg-blue-50">
        <Cloud className="h-3 w-3 animate-pulse" />
        Syncing...
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-200 bg-yellow-50">
      <CloudOff className="h-3 w-3" />
      Sync Pending
    </Badge>
  )
}
