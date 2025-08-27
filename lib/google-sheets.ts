import { google } from "googleapis"
import type { PlannerOutput } from "@/types/planner"

export async function createAcademicPlanSheet(
  plannerOutput: PlannerOutput,
  accessToken: string,
  userEmail: string,
): Promise<string> {
  try {
    // Initialize Google APIs with user's access token
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const sheets = google.sheets({ version: "v4", auth })
    const drive = google.drive({ version: "v3", auth })

    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `4-Year Plan — ${plannerOutput.terms[0]?.name || "Academic Plan"} (${new Date().getFullYear()})`,
        },
        sheets: [
          {
            properties: {
              title: "Plan Overview",
              gridProperties: {
                rowCount: 100,
                columnCount: 10,
              },
            },
          },
        ],
      },
      fields: "spreadsheetId,sheets.properties",
    })

    const spreadsheetId = createRes.data.spreadsheetId!
    const sheetProps = createRes.data.sheets![0].properties!
    const sheetId = sheetProps.sheetId!
    const sheetTitle = sheetProps.title!

    // Prepare data for the sheet
    const sheetData = formatPlannerDataForSheet(plannerOutput)

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:D${sheetData.length}`,
      valueInputOption: "RAW",
      requestBody: {
        values: sheetData,
      },
    })

    await formatSheet(sheets, spreadsheetId, sheetId, sheetData.length, plannerOutput.terms.length)

    // Set sharing permissions (optional - make it accessible to the user)
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: "writer",
        type: "user",
        emailAddress: userEmail,
      },
    })

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`

    console.log(`[google-sheets] Created sheet: ${sheetUrl}`)

    return sheetUrl
  } catch (error) {
    console.error("[google-sheets] Error creating sheet:", error)
    throw new Error("Failed to create Google Sheet")
  }
}

function formatPlannerDataForSheet(plannerOutput: PlannerOutput): string[][] {
  const data: string[][] = []

  // Header row
  data.push(["Academic Plan Overview"])
  data.push([]) // Empty row

  // Summary information
  data.push(["Summary"])
  data.push(["Total Terms:", plannerOutput.terms.length.toString()])
  data.push(["Total Credits:", plannerOutput.totalCredits.toString()])
  data.push(["Warnings:", plannerOutput.warnings.length.toString()])
  data.push([]) // Empty row

  // Terms and courses
  data.push(["Term Schedule"])
  data.push([]) // Empty row

  plannerOutput.terms.forEach((term, termIndex) => {
    // Term header
    data.push([`${term.name} (${term.totalCredits} credits)`])

    // Course headers
    data.push(["Course Code", "Course Name", "Credits", "Offerings"])

    // Course data
    term.courses.forEach((course) => {
      data.push([course.code, course.name, course.credits.toString(), course.offerings.join(", ")])
    })

    data.push([]) // Empty row between terms
  })

  // Warnings section
  if (plannerOutput.warnings.length > 0) {
    data.push(["Warnings & Recommendations"])
    data.push([]) // Empty row

    plannerOutput.warnings.forEach((warning, index) => {
      data.push([`${index + 1}.`, warning])
    })
  }

  return data
}

async function formatSheet(
  sheets: any,
  spreadsheetId: string,
  sheetId: number,
  dataRowCount: number,
  termCount: number,
): Promise<void> {
  try {
    const requests = []

    if (dataRowCount > 0) {
      // Format header row
      requests.push({
        repeatCell: {
          range: {
            sheetId, // Use captured sheetId instead of 0
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 4,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.4 }, // Primary color
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                fontSize: 16,
                bold: true,
              },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      })
    }

    if (dataRowCount > 2) {
      // Format section headers
      requests.push({
        repeatCell: {
          range: {
            sheetId, // Use captured sheetId instead of 0
            startRowIndex: 2,
            endRowIndex: 3,
            startColumnIndex: 0,
            endColumnIndex: 4,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              textFormat: {
                bold: true,
                fontSize: 12,
              },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      })
    }

    // Auto-resize columns
    requests.push({
      autoResizeDimensions: {
        dimensions: {
          sheetId, // Use captured sheetId instead of 0
          dimension: "COLUMNS",
          startIndex: 0,
          endIndex: 4,
        },
      },
    })

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests,
        },
      })
    } catch (batchError: any) {
      console.error("[google-sheets] BatchUpdate failed:", {
        error: batchError.message,
        details: batchError.response?.data,
        requests: JSON.stringify(requests, null, 2),
      })
      throw batchError
    }
  } catch (error) {
    console.error("[google-sheets] Error formatting sheet:", error)
    throw error
  }
}
