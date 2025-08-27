export interface PlannerFormData {
  institution: string
  program: string
  catalogUrl?: string
  catalogFile?: File
  minCredits: number
  maxCredits: number
  targetGradTerm: string
  includeSummers: boolean
}

export interface DegreeRequirements {
  institution: string
  program: string
  totalCredits: number
  courses: Course[]
  prerequisites: Prerequisite[]
}

export interface Course {
  code: string
  name: string
  credits: number
  description?: string
  offerings: string[] // e.g., ["Fall", "Spring", "Summer"]
}

export interface Prerequisite {
  course: string
  requires: string[]
}

export interface PlannerOutput {
  terms: Term[]
  warnings: string[]
  totalCredits: number
}

export interface Term {
  name: string
  courses: Course[]
  totalCredits: number
}
