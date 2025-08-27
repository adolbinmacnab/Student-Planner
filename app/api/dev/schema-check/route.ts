import { NextResponse } from "next/server"
import { DegreeRequirementsZ } from "@/lib/schemas"

// Minimal sample that exercises: one-of-sets tracks + coreqs on lab/lecture pairs.
const SAMPLE = {
  program_name: "Schema Check — Chemistry Coreqs",
  institution: "Demo University",
  catalog_year: "2025-26",
  total_credits: 120,
  courses: [
    { id: "CEM 141", credits: 3, coreqs: ["CEM 161"], offered: ["Fall", "Spring"], level: 100 },
    { id: "CEM 161", credits: 1, coreqs: ["CEM 141"], offered: ["Fall", "Spring"], level: 100 },
    { id: "CEM 142", credits: 3, coreqs: ["CEM 162"], offered: ["Fall", "Spring"], level: 100 },
    { id: "CEM 162", credits: 1, coreqs: ["CEM 142"], offered: ["Fall", "Spring"], level: 100 },

    // Alternative non-honors track
    { id: "CEM 151", credits: 4, coreqs: ["CEM 161"], offered: ["Fall"], level: 100 },
    { id: "CEM 152", credits: 4, coreqs: ["CEM 162"], offered: ["Spring"], level: 100 },

    // Honors track
    { id: "CEM 181H", credits: 4, honors: true, offered: ["Fall"], level: 100 },
    { id: "CEM 182H", credits: 4, honors: true, offered: ["Spring"], level: 100 },
    { id: "CEM 185H", credits: 2, honors: true, offered: ["Spring"], level: 100 },
  ],
  requirement_groups: [
    {
      id: "chem_track",
      label: "Chemistry Track",
      rule: "one-of-sets",
      sets: [
        { id: "A", label: "General Chem A", courses: ["CEM 141", "CEM 142", "CEM 161", "CEM 162"] },
        { id: "B", label: "General Chem B", courses: ["CEM 151", "CEM 152", "CEM 161", "CEM 162"] },
        { id: "H", label: "Honors Chem", courses: ["CEM 181H", "CEM 182H", "CEM 185H"] },
      ],
    },
  ],
} as const

export async function GET() {
  const parsed = DegreeRequirementsZ.safeParse(SAMPLE)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 422 })
  }
  return NextResponse.json({ ok: true })
}
