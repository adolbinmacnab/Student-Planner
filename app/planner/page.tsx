"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  GraduationCap,
  User,
  LogOut,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Download,
  ExternalLink,
} from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { PlannerForm } from "@/components/planner-form"
import type { PlannerFormData, PlannerOutput } from "@/types/planner"
import { generatePDF } from "@/lib/pdf-generator"
import { mapToPlanPayload } from "@/lib/planMapper"

export default function PlannerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [plannerResult, setPlannerResult] = useState<PlannerOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your planner...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const handleFormSubmit = async (data: PlannerFormData) => {
    setIsGenerating(true)
    setError(null)
    setExportedSheetUrl(null)

    try {
      // First, parse the requirements
      console.log("Parsing requirements...")

      const parsePayload: any = {
        institution: data.institution,
        program: data.program,
      }

      if (data.catalogUrl) {
        parsePayload.urlOrPdf = data.catalogUrl
      } else if (data.catalogFile) {
        // Convert file to base64
        const buffer = await data.catalogFile.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        parsePayload.pdfBuffer = base64
      }

      const parseResponse = await fetch("/api/parseRequirements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsePayload),
      })

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json()
        throw new Error(errorData.error || "Failed to parse requirements")
      }

      const parsedRequirements = await parseResponse.json()
      console.log("Requirements parsed successfully:", parsedRequirements)

      // Then, generate the plan
      console.log("Generating academic plan...")

      const payload = mapToPlanPayload(parsedRequirements)
      payload.constraints = {
        minCredits: data.minCredits,
        maxCredits: data.maxCredits,
        targetGradTerm: data.targetGradTerm,
        includeSummers: data.includeSummers,
      }

      console.log("Plan API payload:", payload)

      const planResponse = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!planResponse.ok) {
        const errorData = await planResponse.json()
        throw new Error(errorData.error || "Failed to generate plan")
      }

      const planResult: PlannerOutput = await planResponse.json()
      console.log("Plan generated successfully:", planResult)

      setPlannerResult(planResult)
    } catch (error) {
      console.error("Error generating plan:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportToSheets = async () => {
    if (!plannerResult) return

    setIsExporting(true)
    setError(null)

    try {
      console.log("Exporting to Google Sheets...")

      const exportResponse = await fetch("/api/export/sheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plannerOutput: plannerResult,
        }),
      })

      if (!exportResponse.ok) {
        const errorData = await exportResponse.json()
        throw new Error(errorData.error || "Failed to export to Google Sheets")
      }

      const { sheetUrl } = await exportResponse.json()
      console.log("Successfully exported to Google Sheets:", sheetUrl)

      setExportedSheetUrl(sheetUrl)

      // Open the sheet in a new tab
      window.open(sheetUrl, "_blank")
    } catch (error) {
      console.error("Error exporting to Google Sheets:", error)
      setError(error instanceof Error ? error.message : "Failed to export to Google Sheets")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!plannerResult || !session?.user?.name) return

    setIsDownloadingPDF(true)
    setError(null)

    try {
      generatePDF(plannerResult, session.user.name)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setError(error instanceof Error ? error.message : "Failed to generate PDF")
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Student Planner</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{session.user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance mb-2">Welcome back, {session.user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground text-pretty">
            Let's create your personalized academic plan. Fill out the form below to get started.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p className="text-sm text-destructive/80 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Success Message for Sheet Export */}
        {exportedSheetUrl && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5 text-primary" />
                <p className="font-medium">Google Sheet Created Successfully!</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-primary/80">Your academic plan has been exported to Google Sheets.</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={exportedSheetUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Sheet
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planner Form Card */}
        <PlannerForm onSubmit={handleFormSubmit} isLoading={isGenerating} />

        {/* Results Display Section */}
        {plannerResult && (
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Your Academic Plan
                </CardTitle>
                <CardDescription>
                  Generated plan with {plannerResult.terms.length} terms and {plannerResult.totalCredits} total credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Terms Grid */}
                  <div className="grid gap-4">
                    {plannerResult.terms.map((term, index) => (
                      <div key={index} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-lg">{term.name}</h3>
                          <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                            {term.totalCredits} credits
                          </span>
                        </div>
                        <div className="space-y-2">
                          {term.courses.map((course, courseIndex) => (
                            <div
                              key={courseIndex}
                              className="flex justify-between items-start text-sm bg-muted/30 p-3 rounded"
                            >
                              <div>
                                <span className="font-medium">{course.code}</span>
                                <span className="text-muted-foreground ml-2">{course.name}</span>
                                {course.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
                                )}
                              </div>
                              <span className="text-muted-foreground font-medium">{course.credits} cr</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warnings */}
                  {plannerResult.warnings.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h4 className="font-semibold text-destructive">Warnings & Recommendations</h4>
                      </div>
                      <ul className="text-sm space-y-1">
                        {plannerResult.warnings.map((warning, index) => (
                          <li key={index} className="text-destructive">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button onClick={handleExportToSheets} disabled={isExporting}>
                      {isExporting ? (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4 animate-pulse" />
                          Creating Sheet...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Create Google Sheet
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloadingPDF || !plannerResult}>
                      {isDownloadingPDF ? (
                        <>
                          <Download className="mr-2 h-4 w-4 animate-pulse" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Plans Created</CardTitle>
              <div className="text-2xl font-bold">{plannerResult ? 1 : 0}</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Planned</CardTitle>
              <div className="text-2xl font-bold">{plannerResult?.totalCredits || 0}</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sheets Exported</CardTitle>
              <div className="text-2xl font-bold">{exportedSheetUrl ? 1 : 0}</div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
