import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateAcademicPlan, validatePlan } from "@/lib/planner"
import { withEnhancedRateLimit } from "@/lib/enhanced-rate-limit-middleware"
import { sanitizeString, logSecurityEvent } from "@/lib/security"
import { z } from "zod"

const PlanRequestSchema = z
  .object({
    degreeRequirements: z.object({
      institution: z.string().max(200),
      program: z.string().max(200),
      totalCredits: z.number().min(1).max(300),
      courses: z
        .array(
          z.object({
            code: z.string().max(20),
            name: z.string().max(200),
            credits: z.number().min(0).max(20),
            description: z.string().max(1000).optional(),
            offerings: z.array(z.string().max(20)),
          }),
        )
        .max(200), // Limit number of courses
      prerequisites: z
        .array(
          z.object({
            course: z.string().max(20),
            requires: z.array(z.string().max(20)),
          }),
        )
        .max(500), // Limit number of prerequisites
    }),
    constraints: z.object({
      minCredits: z.number().min(1).max(30),
      maxCredits: z.number().min(1).max(30),
      targetGradTerm: z.string().max(50),
      includeSummers: z.boolean(),
    }),
  })
  .refine((data) => data.constraints.maxCredits >= data.constraints.minCredits, {
    message: "Maximum credits must be greater than or equal to minimum credits",
    path: ["constraints", "maxCredits"],
  })

async function handlePlanGeneration(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      logSecurityEvent("auth_failure", request, { endpoint: "plan" })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = PlanRequestSchema.parse(body)

    const { degreeRequirements, constraints } = {
      degreeRequirements: {
        ...validatedData.degreeRequirements,
        institution: sanitizeString(validatedData.degreeRequirements.institution),
        program: sanitizeString(validatedData.degreeRequirements.program),
        courses: validatedData.degreeRequirements.courses.map((course) => ({
          ...course,
          code: sanitizeString(course.code),
          name: sanitizeString(course.name),
          description: course.description ? sanitizeString(course.description) : undefined,
        })),
      },
      constraints: {
        ...validatedData.constraints,
        targetGradTerm: sanitizeString(validatedData.constraints.targetGradTerm),
      },
    }

    console.log(`[plan] Generating plan for ${degreeRequirements.institution} - ${degreeRequirements.program}`)
    console.log(
      `[plan] Constraints: ${constraints.minCredits}-${constraints.maxCredits} credits, target: ${constraints.targetGradTerm}, summers: ${constraints.includeSummers}`,
    )

    // Generate the academic plan
    const plannerOutput = generateAcademicPlan(degreeRequirements, constraints)

    // Validate the generated plan
    const validationErrors = validatePlan(plannerOutput, degreeRequirements)
    if (validationErrors.length > 0) {
      plannerOutput.warnings.push(...validationErrors)
    }

    console.log(
      `[plan] Generated plan with ${plannerOutput.terms.length} terms and ${plannerOutput.warnings.length} warnings`,
    )

    // Log plan summary
    plannerOutput.terms.forEach((term) => {
      console.log(`[plan] ${term.name}: ${term.courses.length} courses, ${term.totalCredits} credits`)
    })

    return NextResponse.json(plannerOutput)
  } catch (error) {
    console.error("[plan] Error:", error)

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
  return withEnhancedRateLimit(request, handlePlanGeneration, "plan")
}
