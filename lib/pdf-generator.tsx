import type { PlannerOutput } from "@/types/planner"

export function generatePDF(plannerResult: PlannerOutput, studentName: string): void {
  // Create a new window for printing
  const printWindow = window.open("", "_blank")

  if (!printWindow) {
    throw new Error("Unable to open print window. Please check your popup blocker settings.")
  }

  // Generate HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Academic Plan - ${studentName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #059669;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #059669;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0 0 0;
        }
        .summary {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .summary h2 {
          color: #059669;
          margin-top: 0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
        }
        .summary-item .label {
          font-size: 14px;
          color: #666;
        }
        .term {
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .term-header {
          background: #059669;
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .term-header h3 {
          margin: 0;
          font-size: 18px;
        }
        .term-credits {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
        }
        .course-list {
          padding: 0;
        }
        .course {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 15px 20px;
          border-bottom: 1px solid #f3f4f6;
        }
        .course:last-child {
          border-bottom: none;
        }
        .course-info {
          flex: 1;
        }
        .course-code {
          font-weight: bold;
          color: #059669;
        }
        .course-name {
          color: #666;
          margin-left: 8px;
        }
        .course-description {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
          line-height: 1.4;
        }
        .course-credits {
          color: #666;
          font-weight: bold;
          white-space: nowrap;
        }
        .warnings {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }
        .warnings h3 {
          color: #dc2626;
          margin-top: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .warnings ul {
          margin: 15px 0 0 0;
          padding-left: 20px;
        }
        .warnings li {
          color: #dc2626;
          margin-bottom: 8px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .term { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Academic Plan</h1>
        <p>Generated for ${studentName}</p>
        <p>Created on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="summary">
        <h2>Plan Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="value">${plannerResult.terms.length}</div>
            <div class="label">Total Terms</div>
          </div>
          <div class="summary-item">
            <div class="value">${plannerResult.totalCredits}</div>
            <div class="label">Total Credits</div>
          </div>
          <div class="summary-item">
            <div class="value">${plannerResult.terms.reduce((sum, term) => sum + term.courses.length, 0)}</div>
            <div class="label">Total Courses</div>
          </div>
        </div>
      </div>

      ${plannerResult.terms
        .map(
          (term) => `
        <div class="term">
          <div class="term-header">
            <h3>${term.name}</h3>
            <div class="term-credits">${term.totalCredits} credits</div>
          </div>
          <div class="course-list">
            ${term.courses
              .map(
                (course) => `
              <div class="course">
                <div class="course-info">
                  <span class="course-code">${course.code}</span>
                  <span class="course-name">${course.name}</span>
                  ${course.description ? `<div class="course-description">${course.description}</div>` : ""}
                </div>
                <div class="course-credits">${course.credits} cr</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      `,
        )
        .join("")}

      ${
        plannerResult.warnings.length > 0
          ? `
        <div class="warnings">
          <h3>⚠️ Warnings & Recommendations</h3>
          <ul>
            ${plannerResult.warnings.map((warning) => `<li>${warning}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }

      <div class="footer">
        <p>Generated by Student Planner • ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `

  // Write content to the new window
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
