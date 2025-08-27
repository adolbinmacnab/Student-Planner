import OpenAI from "openai"
import { OPENAI_API_KEY } from "@/lib/config"

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export async function jsonChat({
  system,
  user,
  maxTokens = 1500,
  model = "gpt-4o",
}: {
  system: string
  user: string
  maxTokens?: number
  model?: string
}): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature: 0.1,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response content from OpenAI")
    }

    return JSON.parse(content)
  } catch (error) {
    console.error("Error in jsonChat:", error)
    throw new Error(
      `Failed to get JSON response from OpenAI: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
