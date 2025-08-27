import { NextResponse } from "next/server"

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const url = new URL("/api/research", baseUrl)

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution: "Michigan State University",
        program: "Human Biology",
        candidateCourseIds: ["CEM 141", "CEM 161", "CEM 142", "CEM 162", "BS 161", "BS 162", "PHY 221", "PHY 222"],
      }),
    })

    if (!r.ok) {
      return NextResponse.json({
        sourceCount: 0,
        sampleSources: [],
        note: `API error: ${r.status} ${r.statusText}`,
        error: true,
      })
    }

    const text = await r.text()
    if (!text.trim()) {
      return NextResponse.json({
        sourceCount: 0,
        sampleSources: [],
        note: "Empty response from research API",
        error: true,
      })
    }

    const data = JSON.parse(text)
    const sources = data?.sources || []
    return NextResponse.json({
      sourceCount: sources.length,
      sampleSources: sources.slice(0, 3),
      note: data?.needsMoreSources ? "needsMoreSources" : "ok",
    })
  } catch (error) {
    console.error("[v0] Websearch smoke test error:", error)
    return NextResponse.json({
      sourceCount: 0,
      sampleSources: [],
      note: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: true,
    })
  }
}
