import type { NextRequest } from "next/server"
import { z } from "zod"

// Input sanitization utilities
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .substring(0, 1000) // Limit length
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol")
    }
    return parsed.toString()
  } catch {
    throw new Error("Invalid URL format")
  }
}

// Request validation schemas
export const FileUploadSchema = z.object({
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  type: z.literal("application/pdf"),
  name: z.string().max(255),
})

export const UrlSchema = z.string().url().max(2048)

// Security headers
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://sheets.googleapis.com https://www.googleapis.com;",
}

// Request logging for security monitoring
export function logSecurityEvent(
  type: "rate_limit" | "auth_failure" | "invalid_input" | "api_error",
  request: NextRequest,
  details?: any,
) {
  const timestamp = new Date().toISOString()
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  const url = request.url

  console.log(`[SECURITY] ${timestamp} - ${type.toUpperCase()}`, {
    ip,
    userAgent,
    url,
    details,
  })

  // In production, you might want to send this to a monitoring service
  // like DataDog, Sentry, or CloudWatch
}

// Validate file uploads
export function validateFileUpload(file: File): void {
  const result = FileUploadSchema.safeParse({
    size: file.size,
    type: file.type,
    name: file.name,
  })

  if (!result.success) {
    throw new Error(`Invalid file: ${result.error.errors.map((e) => e.message).join(", ")}`)
  }

  // Additional security checks
  if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) {
    throw new Error("Invalid file name")
  }
}

// Enhanced rate limiter with different limits for different endpoints
export class EnhancedRateLimiter {
  private limits = new Map<string, Map<string, { count: number; resetTime: number }>>()

  private configs = {
    parseRequirements: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 per minute
    plan: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
    export: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
    default: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute
  }

  isAllowed(identifier: string, endpoint: string): boolean {
    const config = this.configs[endpoint as keyof typeof this.configs] || this.configs.default
    const now = Date.now()

    if (!this.limits.has(endpoint)) {
      this.limits.set(endpoint, new Map())
    }

    const endpointLimits = this.limits.get(endpoint)!
    const entry = endpointLimits.get(identifier)

    if (!entry || now > entry.resetTime) {
      endpointLimits.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return true
    }

    if (entry.count >= config.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(identifier: string, endpoint: string): number {
    const config = this.configs[endpoint as keyof typeof this.configs] || this.configs.default
    const endpointLimits = this.limits.get(endpoint)

    if (!endpointLimits) return config.maxRequests

    const entry = endpointLimits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests
    }
    return Math.max(0, config.maxRequests - entry.count)
  }

  cleanup(): void {
    const now = Date.now()
    for (const [endpoint, endpointLimits] of this.limits.entries()) {
      for (const [identifier, entry] of endpointLimits.entries()) {
        if (now > entry.resetTime) {
          endpointLimits.delete(identifier)
        }
      }
      if (endpointLimits.size === 0) {
        this.limits.delete(endpoint)
      }
    }
  }
}

export const enhancedRateLimiter = new EnhancedRateLimiter()

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    enhancedRateLimiter.cleanup()
  },
  5 * 60 * 1000,
)
