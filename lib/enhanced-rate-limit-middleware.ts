import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { enhancedRateLimiter, logSecurityEvent, securityHeaders } from "@/lib/security"

export async function withEnhancedRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  endpoint: string,
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)

    // Use user email as identifier, fallback to IP
    const identifier =
      session?.user?.email || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous"

    if (!enhancedRateLimiter.isAllowed(identifier, endpoint)) {
      logSecurityEvent("rate_limit", request, { endpoint, identifier })

      const remaining = enhancedRateLimiter.getRemainingRequests(identifier, endpoint)

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Too many requests to ${endpoint}. Please try again later.`,
          endpoint,
        },
        {
          status: 429,
          headers: {
            ...securityHeaders,
            "Retry-After": "60",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Endpoint": endpoint,
          },
        },
      )
    }

    const remaining = enhancedRateLimiter.getRemainingRequests(identifier, endpoint)
    const response = await handler(request)

    // Add security headers and rate limit info to successful responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Endpoint", endpoint)

    return response
  } catch (error) {
    console.error("Enhanced rate limit middleware error:", error)
    logSecurityEvent("api_error", request, { error: error instanceof Error ? error.message : "Unknown error" })
    return handler(request) // Continue without rate limiting on error
  }
}
