import OpenAI from "openai"
import { z } from "zod"
import type { DegreeRequirements } from "@/types/planner"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const DegreeRequirementsSchema = z.object({
  institution: z.string(),
  program: z.string(),
  totalCredits: z.number(),
  courses: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      credits: z.number(),
      description: z.string().optional(),
      offerings: z.array(z.string()),
    }),
  ),
  prerequisites: z.array(
    z.object({
      course: z.string(),
      requires: z.array(z.string()),
    }),
  ),
})

export async function parseRequirementsWithAI(
  content: string,
  institution: string,
  program: string,
): Promise<DegreeRequirements> {
  try {
    const prompt = `
You are an expert academic advisor tasked with parsing degree requirements from catalog content.

Institution: ${institution}
Program: ${program}

Catalog Content:
${content}

Please extract and structure the degree requirements into the following JSON format:

{
  "institution": "${institution}",
  "program": "${program}",
  "totalCredits": <total credits required for graduation>,
  "courses": [
    {
      "code": "<course code like CS 101>",
      "name": "<full course name>",
      "credits": <number of credits>,
      "description": "<brief description if available>",
      "offerings": ["Fall", "Spring", "Summer"] // when the course is typically offered
    }
  ],
  "prerequisites": [
    {
      "course": "<course code>",
      "requires": ["<prerequisite course codes>"]
    }
  ]
}

Instructions:
1. Extract ALL required courses for the degree program
2. Include core requirements, major requirements, and any electives with specific constraints
3. Determine typical course offerings based on context (assume Fall/Spring if not specified)
4. Extract prerequisite relationships where mentioned
5. If total credits aren't explicitly stated, estimate based on typical degree requirements (usually 120-130 credits)
6. Only include courses that are specifically required or part of required categories
7. Use standard course code formats (e.g., "CS 101", "MATH 151")

Return only valid JSON without any additional text or formatting.
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a precise academic catalog parser. Return only valid JSON that matches the specified schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error("No response from OpenAI")
    }

    // Parse and validate the JSON response
    const parsedData = JSON.parse(responseContent)
    const validatedData = DegreeRequirementsSchema.parse(parsedData)

    return validatedData
  } catch (error) {
    console.error("Error parsing requirements with AI:", error)
    if (error instanceof z.ZodError) {
      throw new Error("Invalid response format from AI parser")
    }
    throw new Error("Failed to parse degree requirements")
  }
}
