export function mapToPlanPayload(parsed: any) {
  return {
    degreeRequirements: {
      institution: parsed.institution || "",
      program: parsed.program_name || parsed.program || "",
      totalCredits: parsed.total_credits || parsed.totalCredits || 120,
      courses: (parsed.courses || []).map((c: any) => ({
        code: c.id || c.code || "",
        name: c.title || c.name || "",
        credits: c.credits || 0,
        description: c.description || "",
        offerings: (c.offered || []).map((o: string) => String(o)),
      })),
      prerequisites: (parsed.courses || []).flatMap((c: any) =>
        (c.prereqs || []).length
          ? [
              {
                course: c.id || c.code || "",
                requires: c.prereqs.map((p: any) => (typeof p === "string" ? p : p?.id || "")),
              },
            ]
          : [],
      ),
    },
    constraints: {
      minCredits: 12,
      maxCredits: 17,
      targetGradTerm: "Spring 2027",
      includeSummers: false,
    },
  }
}
