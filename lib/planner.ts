import type { DegreeRequirements, Course, Prerequisite, PlannerOutput, Term } from "@/types/planner"

export interface PlanningConstraints {
  minCredits: number
  maxCredits: number
  targetGradTerm: string
  includeSummers: boolean
}

interface CourseWithPrereqs extends Course {
  prerequisites: string[]
  scheduled?: boolean
  termScheduled?: string
}

export function generateAcademicPlan(
  requirements: DegreeRequirements,
  constraints: PlanningConstraints,
): PlannerOutput {
  const warnings: string[] = []

  // Parse target graduation term
  const targetTerm = parseTargetTerm(constraints.targetGradTerm)
  if (!targetTerm) {
    warnings.push("Invalid target graduation term format")
    return { terms: [], warnings, totalCredits: 0 }
  }

  // Generate term sequence
  const termSequence = generateTermSequence(targetTerm, constraints.includeSummers)

  // Prepare courses with prerequisite information
  const coursesWithPrereqs = prepareCourses(requirements.courses, requirements.prerequisites)

  // Schedule courses across terms
  const scheduledTerms = scheduleCourses(coursesWithPrereqs, termSequence, constraints, warnings)

  // Calculate total credits
  const totalCredits = scheduledTerms.reduce((sum, term) => sum + term.totalCredits, 0)

  // Add final warnings
  if (totalCredits < requirements.totalCredits) {
    warnings.push(`Planned credits (${totalCredits}) are less than required (${requirements.totalCredits})`)
  }

  if (scheduledTerms.length > 8) {
    warnings.push("Plan exceeds 8 terms - consider increasing credit load or including summers")
  }

  return {
    terms: scheduledTerms.slice(0, 8), // Limit to 8 terms as specified
    warnings,
    totalCredits,
  }
}

function parseTargetTerm(targetTerm: string): { season: string; year: number } | null {
  const match = targetTerm.match(/^(Spring|Summer|Fall)\s+(\d{4})$/)
  if (!match) return null

  return {
    season: match[1],
    year: Number.parseInt(match[2]),
  }
}

function generateTermSequence(targetTerm: { season: string; year: number }, includeSummers: boolean): string[] {
  const terms: string[] = []
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  // Determine starting term based on current date
  const startYear = currentYear
  let startSeason = "Fall"

  if (currentMonth >= 1 && currentMonth <= 5) {
    startSeason = "Spring"
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    startSeason = includeSummers ? "Summer" : "Fall"
  }

  // Generate terms until target
  let year = startYear
  let seasonIndex = ["Spring", "Summer", "Fall"].indexOf(startSeason)

  while (terms.length < 12) {
    // Maximum 12 terms to prevent infinite loops
    const seasons = includeSummers ? ["Spring", "Summer", "Fall"] : ["Spring", "Fall"]
    const currentSeason = seasons[seasonIndex % seasons.length]

    terms.push(`${currentSeason} ${year}`)

    // Check if we've reached the target
    if (currentSeason === targetTerm.season && year === targetTerm.year) {
      break
    }

    seasonIndex++
    if (includeSummers) {
      if (seasonIndex % 3 === 0) year++
    } else {
      if (seasonIndex % 2 === 0) year++
    }
  }

  return terms
}

function prepareCourses(courses: Course[], prerequisites: Prerequisite[]): CourseWithPrereqs[] {
  const prereqMap = new Map<string, string[]>()

  prerequisites.forEach((prereq) => {
    prereqMap.set(prereq.course, prereq.requires)
  })

  return courses.map((course) => ({
    ...course,
    prerequisites: prereqMap.get(course.code) || [],
    scheduled: false,
  }))
}

function scheduleCourses(
  courses: CourseWithPrereqs[],
  termSequence: string[],
  constraints: PlanningConstraints,
  warnings: string[],
): Term[] {
  const scheduledTerms: Term[] = []
  const unscheduledCourses = [...courses]

  for (const termName of termSequence) {
    const term: Term = {
      name: termName,
      courses: [],
      totalCredits: 0,
    }

    const termSeason = termName.split(" ")[0]

    // Find courses that can be scheduled this term
    const availableCourses = unscheduledCourses.filter(
      (course) =>
        !course.scheduled &&
        canScheduleInTerm(course, termSeason, scheduledTerms) &&
        prerequisitesMet(course, scheduledTerms),
    )

    // Sort by priority (required courses first, then by credits)
    availableCourses.sort((a, b) => {
      // Prioritize courses with more prerequisites (likely more advanced)
      const aPrereqCount = a.prerequisites.length
      const bPrereqCount = b.prerequisites.length
      if (aPrereqCount !== bPrereqCount) {
        return bPrereqCount - aPrereqCount
      }

      // Then by credits (higher credit courses first)
      return b.credits - a.credits
    })

    // Schedule courses up to credit limit
    for (const course of availableCourses) {
      if (term.totalCredits + course.credits <= constraints.maxCredits) {
        term.courses.push({
          code: course.code,
          name: course.name,
          credits: course.credits,
          description: course.description,
          offerings: course.offerings,
        })
        term.totalCredits += course.credits
        course.scheduled = true
        course.termScheduled = termName
      }
    }

    // Check if term meets minimum credit requirement
    if (term.totalCredits > 0 && term.totalCredits < constraints.minCredits) {
      warnings.push(`${termName}: Only ${term.totalCredits} credits scheduled (minimum: ${constraints.minCredits})`)
    }

    if (term.courses.length > 0) {
      scheduledTerms.push(term)
    }

    // Remove scheduled courses from unscheduled list
    unscheduledCourses.splice(0, unscheduledCourses.length, ...unscheduledCourses.filter((c) => !c.scheduled))

    // Stop if all courses are scheduled
    if (unscheduledCourses.length === 0) {
      break
    }
  }

  // Add warnings for unscheduled courses
  const unscheduled = unscheduledCourses.filter((c) => !c.scheduled)
  if (unscheduled.length > 0) {
    warnings.push(`Unable to schedule ${unscheduled.length} courses: ${unscheduled.map((c) => c.code).join(", ")}`)
  }

  return scheduledTerms
}

function canScheduleInTerm(course: CourseWithPrereqs, termSeason: string, scheduledTerms: Term[]): boolean {
  // Check if course is offered in this term
  if (!course.offerings.includes(termSeason)) {
    return false
  }

  // Check if course is already scheduled
  return !scheduledTerms.some((term) => term.courses.some((scheduledCourse) => scheduledCourse.code === course.code))
}

function prerequisitesMet(course: CourseWithPrereqs, scheduledTerms: Term[]): boolean {
  if (course.prerequisites.length === 0) {
    return true
  }

  const scheduledCourses = scheduledTerms.flatMap((term) => term.courses.map((c) => c.code))

  return course.prerequisites.every((prereq) => scheduledCourses.includes(prereq))
}

// Utility function for testing
export function validatePlan(plan: PlannerOutput, requirements: DegreeRequirements): string[] {
  const validationErrors: string[] = []

  // Check if all required courses are included
  const plannedCourses = plan.terms.flatMap((term) => term.courses.map((c) => c.code))
  const requiredCourses = requirements.courses.map((c) => c.code)

  const missingCourses = requiredCourses.filter((code) => !plannedCourses.includes(code))
  if (missingCourses.length > 0) {
    validationErrors.push(`Missing required courses: ${missingCourses.join(", ")}`)
  }

  // Check prerequisite violations
  const scheduledCoursesByTerm = new Map<string, string[]>()

  for (const term of plan.terms) {
    const previousCourses = Array.from(scheduledCoursesByTerm.values()).flat()

    for (const course of term.courses) {
      const courseReq = requirements.courses.find((c) => c.code === course.code)
      if (courseReq) {
        const prereqs = requirements.prerequisites.find((p) => p.course === course.code)?.requires || []
        const unmetPrereqs = prereqs.filter((prereq) => !previousCourses.includes(prereq))

        if (unmetPrereqs.length > 0) {
          validationErrors.push(`${course.code} in ${term.name} has unmet prerequisites: ${unmetPrereqs.join(", ")}`)
        }
      }
    }

    scheduledCoursesByTerm.set(
      term.name,
      term.courses.map((c) => c.code),
    )
  }

  return validationErrors
}
