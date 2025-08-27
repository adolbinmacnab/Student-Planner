import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Academic Planner | Student Planner",
  description: "Create your personalized academic plan with AI-powered degree requirement parsing",
}

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
