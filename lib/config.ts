export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required")
}
