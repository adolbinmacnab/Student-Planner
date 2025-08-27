import { generateAcademicPlan, validatePlan } from "../planner"
import type { DegreeRequirements, PlanningConstraints } from "../planner"

describe("Academic Planner", () => {
  const mockRequirements: DegreeRequirements = {
    institution: "Test University",
    program: "Computer Science",
    totalCredits: 120,
    courses: [
      { code: "CS 101", name: "Intro to CS", credits: 3, offerings: ["Fall", "Spring"] },
      { code: "CS 201", name: "Data Structures", credits: 3, offerings: ["Fall", "Spring"] },
      { code: "MATH 151", name: "Calculus I", credits: 4, offerings: ["Fall", "Spring", "Summer"] },
      { code: "MATH 152", name: "Calculus II", credits: 4, offerings: ["Fall", "Spring", "Summer"] },
    ],
    prerequisites: [
      { course: "CS 201", requires: ["CS 101"] },
      { course: "MATH 152", requires: ["MATH 151"] },
    ],
  }

  const mockConstraints: PlanningConstraints = {
    minCredits: 12,
    maxCredits: 18,
    targetGradTerm: "Spring 2026",
    includeSummers: false,
  }

  test("generates a valid academic plan", () => {
    const result = generateAcademicPlan(mockRequirements, mockConstraints)

    expect(result.terms.length).toBeGreaterThan(0)
    expect(result.terms.length).toBeLessThanOrEqual(8)
    expect(result.totalCredits).toBeGreaterThan(0)
  })

  test("respects prerequisite constraints", () => {
    const result = generateAcademicPlan(mockRequirements, mockConstraints)
    const validationErrors = validatePlan(result, mockRequirements)

    const prereqViolations = validationErrors.filter((error) => error.includes("unmet prerequisites"))

    expect(prereqViolations).toHaveLength(0)
  })

  test("respects credit constraints", () => {
    const result = generateAcademicPlan(mockRequirements, mockConstraints)

    result.terms.forEach((term) => {
      expect(term.totalCredits).toBeLessThanOrEqual(mockConstraints.maxCredits)
    })
  })

  test("handles invalid target term", () => {
    const invalidConstraints = {
      ...mockConstraints,
      targetGradTerm: "Invalid Term",
    }

    const result = generateAcademicPlan(mockRequirements, invalidConstraints)

    expect(result.warnings).toContain("Invalid target graduation term format")
    expect(result.terms).toHaveLength(0)
  })
})
