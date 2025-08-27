import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Calendar, FileSpreadsheet, Brain, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Student Planner</span>
          </div>
          <Button asChild>
            <Link href="/auth/signin">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-primary/10 rounded-full">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Plan Your Academic Journey with <span className="text-primary">AI-Powered</span> Precision
          </h1>
          <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
            Transform complex degree requirements into clear, actionable academic plans. Upload your catalog, set your
            constraints, and let AI create your personalized roadmap to graduation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/signin">Start Planning Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
              Everything You Need to Graduate on Time
            </h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Our intelligent system handles the complexity so you can focus on learning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Parsing</CardTitle>
                <CardDescription>
                  Upload your degree catalog or paste a URL. Our AI extracts requirements, prerequisites, and course
                  offerings automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Generate 8-term plans that respect prerequisites, course offerings, and your credit load preferences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Google Sheets Export</CardTitle>
                <CardDescription>
                  Export your academic plan directly to Google Sheets for easy sharing and collaboration with advisors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Prerequisite Tracking</CardTitle>
                <CardDescription>
                  Never miss a prerequisite again. Our system ensures courses are scheduled in the correct order.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your academic data is protected with enterprise-grade security and Google OAuth authentication.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Instant Results</CardTitle>
                <CardDescription>
                  Get your complete academic plan in seconds, not hours of manual planning and course catalog searching.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Three simple steps to your personalized academic plan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary text-primary-foreground rounded-full text-2xl font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload Requirements</h3>
              <p className="text-muted-foreground text-pretty">
                Provide your degree catalog URL or upload a PDF. Our AI will parse all requirements and prerequisites.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary text-primary-foreground rounded-full text-2xl font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Set Preferences</h3>
              <p className="text-muted-foreground text-pretty">
                Configure your credit load, target graduation term, and whether you'll take summer courses.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary text-primary-foreground rounded-full text-2xl font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Your Plan</h3>
              <p className="text-muted-foreground text-pretty">
                Receive your complete 8-term academic plan with warnings and export options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">Ready to Plan Your Future?</h2>
          <p className="text-xl text-muted-foreground text-pretty mb-8">
            Join thousands of students who have streamlined their path to graduation
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/auth/signin">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold">Student Planner</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 Student Planner. Built with Next.js and AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
