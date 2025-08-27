import { z } from "zod"

// Recursive logic schema for complex prerequisites
const LogicSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    op: z.enum(["AND", "OR"]),
    terms: z.array(z.union([z.string(), LogicSchema])),
  }),
)

// Course schema with enhanced validation
const CourseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  credits: z.number(),
  prereqs: z.array(z.union([z.string(), LogicSchema])).optional(),
  coreqs: z.array(z.string()).optional(),
  offered: z.array(z.enum(["Fall", "Spring", "Summer"])).optional(),
  honors: z.boolean().optional(),
  level: z.number().optional(),
  description: z.string().optional(),
})

// Requirement group schema with discriminated union for different rule types
const RequirementGroupSchema = z.discriminatedUnion("rule", [
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

// Main degree requirements schema
export const DegreeRequirementsZ = z.object({
  program_name: z.string(),
  institution: z.string().optional(),
  catalog_year: z.string().optional(),
  total_credits: z.number().optional(),
  courses: z.array(CourseSchema),
  requirement_groups: z.array(RequirementGroupSchema),
  prerequisites: z
    .array(
      z.object({
        course: z.string(),
        requires: z.array(z.string()),
      }),
    )
    .optional(),
})

export type DegreeRequirements = z.infer<typeof DegreeRequirementsZ>

// Export individual schemas for reuse
export { LogicSchema, CourseSchema, RequirementGroupSchema }
