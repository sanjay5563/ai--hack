"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Stethoscope, User, Brain } from "lucide-react"

interface RoleSelectorProps {
  onRoleSelect: (role: "doctor" | "patient") => void
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Stethoscope className="h-10 w-10 text-blue-600" />
              <Brain className="h-5 w-5 text-indigo-600 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SmartEMR AI</h1>
          <p className="text-gray-600">Choose your role to continue</p>
        </div>

        <div className="grid gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onRoleSelect("doctor")}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <Stethoscope className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Doctor Portal</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Access patient records, generate clinical summaries, and manage healthcare data
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Continue as Doctor</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onRoleSelect("patient")}>
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                <User className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-xl">Patient Portal</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                View your medical reports, track medications, and monitor your health
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">Continue as Patient</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
