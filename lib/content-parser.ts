import * as cheerio from "cheerio"

async function getPdfParse() {
  const pdfParse = await import("pdf-parse")
  return pdfParse.default
}

export async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StudentPlanner/1.0; +https://studentplanner.app)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $("script, style, nav, header, footer, aside, .navigation, .menu, .sidebar").remove()

    // Try to find the main content area
    let content = ""
    const contentSelectors = [
      "main",
      ".content",
      ".main-content",
      "#content",
      "#main",
      ".catalog-content",
      ".requirements",
      ".degree-requirements",
      "article",
      ".page-content",
    ]

    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0 && element.text().trim().length > 100) {
        content = element.text().trim()
        break
      }
    }

    // Fallback to body content if no specific content area found
    if (!content) {
      content = $("body").text().trim()
    }

    // Clean up whitespace and limit length
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim()

    // Limit content to ~8000 characters to stay within token limits
    if (content.length > 8000) {
      content = content.substring(0, 8000) + "..."
    }

    return content
  } catch (error) {
    console.error("Error extracting content from URL:", error)
    throw new Error("Failed to extract content from the provided URL")
  }
}

export async function extractContentFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await getPdfParse()
    const data = await pdfParse(buffer)
    let content = data.text.trim()

    // Clean up common PDF artifacts
    content = content
      .replace(/\f/g, "\n") // Form feed to newline
      .replace(/\s+/g, " ") // Multiple spaces to single space
      .replace(/\n\s*\n/g, "\n") // Multiple newlines to single
      .trim()

    // Limit content to ~8000 characters
    if (content.length > 8000) {
      content = content.substring(0, 8000) + "..."
    }

    return content
  } catch (error) {
    console.error("Error extracting content from PDF:", error)
    throw new Error("Failed to extract content from the provided PDF")
  }
}
