import { sanitizeString, sanitizeUrl, validateFileUpload } from "../security"

describe("Security utilities", () => {
  describe("sanitizeString", () => {
    test("removes HTML tags", () => {
      const input = '<script>alert("xss")</script>Computer Science'
      const result = sanitizeString(input)
      expect(result).toBe("Computer Science")
    })

    test("removes javascript protocol", () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeString(input)
      expect(result).toBe("")
    })

    test("limits string length", () => {
      const input = "a".repeat(2000)
      const result = sanitizeString(input)
      expect(result.length).toBe(1000)
    })
  })

  describe("sanitizeUrl", () => {
    test("accepts valid HTTPS URLs", () => {
      const input = "https://example.com/catalog"
      const result = sanitizeUrl(input)
      expect(result).toBe(input)
    })

    test("rejects javascript protocol", () => {
      const input = 'javascript:alert("xss")'
      expect(() => sanitizeUrl(input)).toThrow("Invalid protocol")
    })

    test("rejects malformed URLs", () => {
      const input = "not-a-url"
      expect(() => sanitizeUrl(input)).toThrow("Invalid URL format")
    })
  })

  describe("validateFileUpload", () => {
    test("accepts valid PDF files", () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" })
      expect(() => validateFileUpload(file)).not.toThrow()
    })

    test("rejects files that are too large", () => {
      const largeContent = new Array(11 * 1024 * 1024).fill("a").join("")
      const file = new File([largeContent], "large.pdf", { type: "application/pdf" })
      expect(() => validateFileUpload(file)).toThrow("Invalid file")
    })

    test("rejects non-PDF files", () => {
      const file = new File(["content"], "test.txt", { type: "text/plain" })
      expect(() => validateFileUpload(file)).toThrow("Invalid file")
    })

    test("rejects files with path traversal in name", () => {
      const file = new File(["content"], "../../../etc/passwd", { type: "application/pdf" })
      expect(() => validateFileUpload(file)).toThrow("Invalid file name")
    })
  })
})
