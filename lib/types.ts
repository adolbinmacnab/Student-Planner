// lib/types.ts
export type Logic = { op: "AND" | "OR"; terms: (string | Logic)[] };

export type Course = {
  id: string;                    // e.g., "CEM 141"
  title?: string;
  credits: number;               // integer or fixed decimal
  prereqs?: (string | Logic)[];
  coreqs?: string[];             // lab/lecture partners that must be concurrent
  offered?: ("Fall" | "Spring" | "Summer")[]; // if known
  honors?: boolean;
  level?: number;                // 100/200/300/400, if known
};

export type RequirementGroup =
  | { id: string; label: string; rule: "one-of-sets"; sets: { id: string; label?: string; courses: string[] }[] }
  | { id: string; label: string; rule: "choose-n-credits"; credits: number; from: string[] }
  | { id: string; label: string; rule: "choose-n-courses"; n: number; from: string[] }
  | { id: string; label: string; rule: "all-of"; courses: string[] };

export type DegreeRequirements = {
  program_name: string;
  institution?: string;
  catalog_year?: string;
  total_credits?: number;
  courses: Course[];
  requirement_groups: RequirementGroup[];
};

export type TermPlan = { term: string; courses: { id: string; credits: number }[]; total_credits: number };
export type PlannerOutput = { program_name: string; catalog_year?: string; plan: TermPlan[]; warnings: string[] };
