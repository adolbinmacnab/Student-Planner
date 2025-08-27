import { OPENAI_API_KEY } from "@/lib/config"

type WebSearchOpts = {
  query: string
  domains?: string[]
  recency_days?: number // e.g., 3650 for 10yr advising pages
  max_results?: number // 3–6 is plenty
}

export async function openaiWebSearch(opts: WebSearchOpts) {
  const { query, domains = [], recency_days = 3650, max_results = 5 } = opts

  const body = {
    model: "gpt-4o", // or "gpt-4o-mini", both support web_search in Responses
    tools: [
      {
        type: "web_search",
        web_search: {
          query,
          recency_days,
          max_results,
          domains: domains.length ? domains : undefined,
        },
      },
    ],
    input: [
      { role: "system", content: "You are a research assistant. Return JSON only." },
      { role: "user", content: `Search for high-quality .edu sources for: ${query}` },
    ],
    response_format: { type: "json_object" },
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Responses API error ${res.status}: ${await res.text()}`)
  }
  return await res.json() // includes tool output with citations in the response
}
