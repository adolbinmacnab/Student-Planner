import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rateLimiter } from "@/lib/rate-limiter"

export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)

    // Use user email as identifier, fallback to IP
    const identifier =
      session?.user?.email || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous"

    if (!rateLimiter.isAllowed(identifier)) {
      const resetTime = rateLimiter.getResetTime(identifier)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
          },
        },
      )
    }

    const remaining = rateLimiter.getRemainingRequests(identifier)
    const resetTime = rateLimiter.getResetTime(identifier)

    const response = await handler(request)

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", "5")
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", resetTime.toString())

    return response
  } catch (error) {
    console.error("Rate limit middleware error:", error)
    return handler(request) // Continue without rate limiting on error
  }
}
