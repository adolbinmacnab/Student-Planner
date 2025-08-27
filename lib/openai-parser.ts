import OpenAI from "openai"
import { z } from "zod"
import type { DegreeRequirements, Logic, RequirementGroup } from "@/types/planner"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const LogicSchema: z.ZodType<Logic> = z.lazy(() =>
  z.object({
    op: z.enum(["AND", "OR"]),
    terms: z.array(z.union([z.string(), LogicSchema])),
  }),
)

const RequirementGroupSchema: z.ZodType<RequirementGroup> = z.discriminatedUnion("rule", [
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("one-of-sets"),
    sets: z.array(
      z.object({
        id: z.string(),
        label: z.string().optional(),
        courses: z.array(z.string()),
      }),
    ),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("choose-n-credits"),
    credits: z.number(),
    from: z.array(z.string()),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("choose-n-courses"),
    n: z.number(),
    from: z.array(z.string()),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("all-of"),
    courses: z.array(z.string()),
  }),
])

const DegreeRequirementsSchema = z.object({
  program_name: z.string(),
  institution: z.string().optional(),
  catalog_year: z.string().optional(),
  total_credits: z.number().optional(),
  courses: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      credits: z.number(),
      prereqs: z.array(z.union([z.string(), LogicSchema])).optional(),
      coreqs: z.array(z.string()).optional(),
      offered: z.array(z.enum(["Fall", "Spring", "Summer"])).optional(),
      honors: z.boolean().optional(),
      level: z.number().optional(),
    }),
  ),
  requirement_groups: z.array(RequirementGroupSchema),
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

Extract STRICT JSON for DegreeRequirements per the schema. When the catalog says 'All courses from one of the following groups' or similar, emit a RequirementGroup with rule:'one-of-sets' and enumerate the sets (e.g., Chem Track A vs B vs Honors). Mark labs/lectures as corequisites. Record obvious offered terms if the text says 'offered Spring only'. Do NOT include courses from multiple alternative sets simultaneously.

JSON Schema:
{
  "program_name": "${program}",
  "institution": "${institution}",
  "catalog_year": "<year if mentioned>",
  "total_credits": <total credits required>,
  "courses": [
    {
      "id": "<course code like CEM 141>",
      "title": "<course title>",
      "credits": <number>,
      "prereqs": ["<course_id>" | {"op":"AND|OR", "terms":["course_id", ...]}],
      "coreqs": ["<concurrent course ids like lab with lecture>"],
      "offered": ["Fall", "Spring", "Summer"],
      "honors": <true if honors version>,
      "level": <100/200/300/400 if determinable>
    }
  ],
  "requirement_groups": [
    {
      "id": "<unique_id>",
      "label": "<human readable name>",
      "rule": "one-of-sets|choose-n-credits|choose-n-courses|all-of",
      "sets": [{"id":"track_a", "label":"Chemistry Track A", "courses":["CEM 141", "CEM 142"]}], // for one-of-sets
      "credits": <number>, // for choose-n-credits
      "n": <number>, // for choose-n-courses  
      "from": ["course_ids"], // for choose-n-credits/courses
      "courses": ["course_ids"] // for all-of
    }
  ]
}

Key Instructions:
1. If catalog shows Chemistry/Biology/Physics tracks, use rule:"one-of-sets" with separate sets
2. Prefer non-honors tracks unless explicitly honors-focused program
3. Mark lab courses as corequisites with their lecture counterparts
4. Use Logic objects for complex prerequisites (e.g., {"op":"OR", "terms":["MATH 151", "MATH 161"]})
5. Extract all requirement groups that govern course selection
6. Only include courses that are actually required or part of selectable groups

Return only valid JSON without additional text.
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
      max_tokens: 6000,
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
      console.error("Validation errors:", error.errors)
      throw new Error("Invalid response format from AI parser")
    }
    throw new Error("Failed to parse degree requirements")
  }
}
