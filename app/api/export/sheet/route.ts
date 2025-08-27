import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAcademicPlanSheet } from "@/lib/google-sheets"
import { withEnhancedRateLimit } from "@/lib/enhanced-rate-limit-middleware"
import { logSecurityEvent } from "@/lib/security"
import { z } from "zod"

const ExportRequestSchema = z.object({
  plannerOutput: z.object({
    terms: z
      .array(
        z.object({
          name: z.string().max(50),
          courses: z
            .array(
              z.object({
                code: z.string().max(20),
                name: z.string().max(200),
                credits: z.number().min(0).max(20),
                offerings: z.array(z.string().max(20)),
                description: z.string().max(1000).optional(),
              }),
            )
            .max(20), // Max 20 courses per term
          totalCredits: z.number().min(0).max(50),
        }),
      )
      .max(12), // Max 12 terms
    warnings: z.array(z.string().max(500)).max(50), // Max 50 warnings
    totalCredits: z.number().min(0).max(500),
  }),
})

async function handleSheetExport(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      logSecurityEvent("auth_failure", request, { endpoint: "export/sheet" })
      return NextResponse.json({ error: "Unauthorized or missing access token" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ExportRequestSchema.parse(body)

    const { plannerOutput } = validatedData

    console.log(`[export/sheet] Creating Google Sheet for user: ${session.user?.email}`)
    console.log(`[export/sheet] Plan has ${plannerOutput.terms.length} terms and ${plannerOutput.totalCredits} credits`)

    // Create the Google Sheet
    const sheetUrl = await createAcademicPlanSheet(
      plannerOutput,
      session.accessToken,
      session.user?.email || "unknown@example.com",
    )

    console.log(`[export/sheet] Successfully created sheet: ${sheetUrl}`)

    return NextResponse.json({ sheetUrl })
  } catch (error) {
    console.error("[export/sheet] Error:", error)

    if (error instanceof z.ZodError) {
      logSecurityEvent("invalid_input", request, { errors: error.errors })
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: error.errors,
        },
        { status: 400 },
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return withEnhancedRateLimit(request, handleSheetExport, "export")
}
