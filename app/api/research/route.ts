import { NextResponse } from "next/server"
import { buildUniversityProfile } from "@/lib/research-openai"

const cache = new Map<string, any>()

export async function POST(req: Request) {
  const body = await req.json()
  const { institution, program, candidateCourseIds, urls } = body || {}

  if (!institution || !program) {
    return NextResponse.json({ error: "institution and program required" }, { status: 400 })
  }

  const key = `${institution}::${program}`

  // Check cache first (10 minute TTL)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return NextResponse.json(cached.data)
  }

  try {
    const { profile, sources } = await buildUniversityProfile({
      institution,
      program,
      candidateCourseIds: candidateCourseIds || [],
      preferredUrls: urls || [],
    })

    if (!sources || sources.length < 2) {
      const suggestions = [
        `site:${institution.split(" ").slice(-1)[0].toLowerCase()}.edu "${program}" sample plan`,
        `site:edu "${institution}" "${program}" advising checklist`,
        `site:edu "${program}" "schedule of classes"`,
      ]
      const resp = { needsMoreSources: true, suggestions }

      // Cache the response with timestamp
      cache.set(key, { data: resp, timestamp: Date.now() })
      return NextResponse.json(resp)
    }

    const resp = { profile, sources }

    // Cache the successful response with timestamp
    cache.set(key, { data: resp, timestamp: Date.now() })
    return NextResponse.json(resp)
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
