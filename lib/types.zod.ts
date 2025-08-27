// lib/types.zod.ts
import { z } from "zod";

export const LogicZ: z.ZodType<any> = z.lazy(() =>
  z.object({
    op: z.enum(["AND", "OR"]),
    terms: z.array(z.union([z.string(), LogicZ])),
  })
);

export const CourseZ = z.object({
  id: z.string().min(2),
  title: z.string().optional(),
  credits: z.number(),
  prereqs: z.array(z.union([z.string(), LogicZ])).optional(),
  coreqs: z.array(z.string()).optional(),
  offered: z.array(z.enum(["Fall", "Spring", "Summer"])).optional(),
  honors: z.boolean().optional(),
  level: z.number().int().optional(),
});

export const RequirementGroupZ = z.union([
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("one-of-sets"),
    sets: z.array(z.object({ id: z.string(), label: z.string().optional(), courses: z.array(z.string().min(2)) })),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("choose-n-credits"),
    credits: z.number().positive(),
    from: z.array(z.string().min(2)),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("choose-n-courses"),
    n: z.number().int().positive(),
    from: z.array(z.string().min(2)),
  }),
  z.object({
    id: z.string(),
    label: z.string(),
    rule: z.literal("all-of"),
    courses: z.array(z.string().min(2)),
  }),
]);

export const DegreeRequirementsZ = z.object({
  program_name: z.string().min(2),
  institution: z.string().optional(),
  catalog_year: z.string().optional(),
  total_credits: z.number().optional(),
  courses: z.array(CourseZ).min(1),
  requirement_groups: z.array(RequirementGroupZ).min(1),
});
