import { openaiWebSearch } from "@/lib/openai-responses"
import type { UniversityProfile, Evidence } from "@/lib/universityProfile"
import { jsonChat } from "@/lib/llm"

function hostFrom(institution: string) {
  // naive host guess; you can refine at runtime
  return institution.toLowerCase().includes("michigan state") ? "msu.edu" : "edu"
}

export async function buildUniversityProfile({
  institution,
  program,
  candidateCourseIds,
}: { institution: string; program: string; candidateCourseIds: string[] }): Promise<{
  profile: UniversityProfile
  sources: Evidence[]
}> {
  const host = hostFrom(institution)
  const baseQuery = `${institution} ${program} advising OR checksheet OR sample plan OR roadmap site:${host}`

  // 1) Use OpenAI web_search to find 3–6 .edu links
  const search = await openaiWebSearch({
    query: baseQuery,
    domains: host === "edu" ? undefined : [host],
    max_results: 6,
  })

  // The Responses API returns citations/sources. We'll pass those snippets to a second JSON-only call
  // to synthesize the UniversityProfile deterministically.
  const sources: Evidence[] = (search?.output?.[0]?.content?.sources ?? search?.output?.sources ?? [])
    .map((s: any) => ({
      url: s?.url,
      title: s?.title,
      snippet: s?.snippet,
    }))
    .filter((s: any) => s?.url?.includes(".edu"))
    .slice(0, 4)

  if (sources.length < 2) {
    return {
      profile: {
        institution,
        program,
        sources: [],
        offerings: {},
        mutually_exclusive: [],
        preferred_sequences: [],
        heavy_pairs_avoid: [],
      },
      sources: [],
    }
  }

  // 2) Ask the LLM to synthesize the profile STRICTLY from these sources
  const system = `
You extract a UniversityProfile using ONLY the provided .edu sources below.
Cite each nontrivial claim (offerings, exclusivity, sequences) by copying the source URL into "sources".
Return STRICT JSON for UniversityProfile. If unsure, omit the field rather than guess.`

  const user = JSON.stringify({
    institution,
    program,
    candidateCourseIds,
    sources,
  })

  const out = await jsonChat({ system, user, maxTokens: 1800 })
  const profile: UniversityProfile = {
    institution,
    program,
    catalog_year: out.catalog_year,
    sources: out.sources || sources,
    offerings: out.offerings || {},
    mutually_exclusive: out.mutually_exclusive || [],
    preferred_sequences: out.preferred_sequences || [],
    heavy_pairs_avoid: out.heavy_pairs_avoid || [],
    default_track_choices: out.default_track_choices || {},
  }

  return { profile, sources: profile.sources }
}
