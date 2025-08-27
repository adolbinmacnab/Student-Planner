import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { extractContentFromUrl, extractContentFromPdf } from "@/lib/content-parser"
import { parseRequirementsWithAI } from "@/lib/openai-parser"
import { withEnhancedRateLimit } from "@/lib/enhanced-rate-limit-middleware"
import { sanitizeString, sanitizeUrl, logSecurityEvent } from "@/lib/security"
import { z } from "zod"

const ParseRequestSchema = z
  .object({
    urlOrPdf: z.string().optional(),
    pdfBuffer: z.string().optional(), // base64 encoded PDF
    institution: z.string().min(1).max(200),
    program: z.string().min(1).max(200),
  })
  .refine((data) => data.urlOrPdf || data.pdfBuffer, {
    message: "Either urlOrPdf or pdfBuffer must be provided",
  })

async function handleParseRequirements(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      logSecurityEvent("auth_failure", request, { endpoint: "parseRequirements" })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = ParseRequestSchema.parse(body)

    const { urlOrPdf, pdfBuffer, institution, program } = {
      ...validatedData,
      institution: sanitizeString(validatedData.institution),
      program: sanitizeString(validatedData.program),
      urlOrPdf: validatedData.urlOrPdf ? sanitizeUrl(validatedData.urlOrPdf) : undefined,
    }

    // Extract content from URL or PDF
    let content: string

    if (urlOrPdf) {
      console.log(`[parseRequirements] Extracting content from URL: ${urlOrPdf}`)
      content = await extractContentFromUrl(urlOrPdf)
    } else if (pdfBuffer) {
      console.log(`[parseRequirements] Extracting content from PDF buffer`)

      try {
        const buffer = Buffer.from(pdfBuffer, "base64")
        if (buffer.length > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error("PDF file too large (max 10MB)")
        }
        content = await extractContentFromPdf(buffer)
      } catch (error) {
        logSecurityEvent("invalid_input", request, { error: "Invalid PDF upload" })
        throw error
      }
    } else {
      return NextResponse.json({ error: "No content source provided" }, { status: 400 })
    }

    if (!content || content.length < 100) {
      return NextResponse.json(
        {
          error: "Insufficient content extracted. Please check the URL or PDF contains degree requirements.",
        },
        { status: 400 },
      )
    }

    console.log(`[parseRequirements] Parsing requirements for ${institution} - ${program}`)
    console.log(`[parseRequirements] Content length: ${content.length} characters`)

    // Parse requirements using OpenAI
    const degreeRequirements = await parseRequirementsWithAI(content, institution, program)

    console.log(`[parseRequirements] Successfully parsed ${degreeRequirements.courses.length} courses`)

    return NextResponse.json(degreeRequirements)
  } catch (error) {
    console.error("[parseRequirements] Error:", error)

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
  return withEnhancedRateLimit(request, handleParseRequirements, "parseRequirements")
}
