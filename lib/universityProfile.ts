export type Evidence = {
  url: string
  title?: string
  snippet?: string
  section?: string
}

export type UniversityProfile = {
  institution: string
  program: string
  catalog_year?: string
  sources: Evidence[]
  offerings: Record<string, ("Fall" | "Spring" | "Summer")[]>
  mutually_exclusive: string[][]
  preferred_sequences: string[][]
  heavy_pairs_avoid: string[][]
  default_track_choices?: Record<string, string>
}
