import { NextResponse } from "next/server"

export async function GET() {
  const r = await fetch(new URL("/api/research", process.env.NEXTAUTH_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      institution: "Michigan State University",
      program: "Human Biology",
      candidateCourseIds: ["CEM 141", "CEM 161", "CEM 142", "CEM 162", "BS 161", "BS 162", "PHY 221", "PHY 222"],
    }),
  })

  const data = await r.json()
  const sources = data?.sources || []
  return NextResponse.json({
    sourceCount: sources.length,
    sampleSources: sources.slice(0, 3),
    note: data?.needsMoreSources ? "needsMoreSources" : "ok",
  })
}
