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

export interface PlanningConstraints {
  minCredits: number
  maxCredits: number
  targetGradTerm: string
  includeSummers: boolean
}

export interface DegreeRequirements {
  program_name: string
  institution?: string
  catalog_year?: string
  total_credits?: number
  courses: Course[]
  requirement_groups: RequirementGroup[]
  prerequisites?: Prerequisite[]
}

export interface Course {
  id: string
  title?: string
  credits: number
  prereqs?: (string | Logic)[]
  coreqs?: string[]
  offered?: ("Fall" | "Spring" | "Summer")[]
  honors?: boolean
  level?: number
  description?: string
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

export type Logic = { op: "AND" | "OR"; terms: (string | Logic)[] }

export type RequirementGroup =
  | { id: string; label: string; rule: "one-of-sets"; sets: { id: string; label?: string; courses: string[] }[] }
  | { id: string; label: string; rule: "choose-n-credits"; credits: number; from: string[] }
  | { id: string; label: string; rule: "choose-n-courses"; n: number; from: string[] }
  | { id: string; label: string; rule: "all-of"; courses: string[] }
