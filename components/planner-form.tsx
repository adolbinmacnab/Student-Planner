"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Link2, FileText, Loader2 } from "lucide-react"
import type { PlannerFormData } from "@/types/planner"

const plannerSchema = z
  .object({
    institution: z.string().min(1, "Institution is required"),
    program: z.string().min(1, "Program/Major is required"),
    catalogUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    minCredits: z.number().min(1, "Minimum credits must be at least 1").max(30, "Maximum 30 credits"),
    maxCredits: z.number().min(1, "Maximum credits must be at least 1").max(30, "Maximum 30 credits"),
    targetGradTerm: z.string().min(1, "Target graduation term is required"),
    includeSummers: z.boolean(),
  })
  .refine((data) => data.maxCredits >= data.minCredits, {
    message: "Maximum credits must be greater than or equal to minimum credits",
    path: ["maxCredits"],
  })

type PlannerFormValues = z.infer<typeof plannerSchema>

interface PlannerFormProps {
  onSubmit: (data: PlannerFormData) => void
  isLoading?: boolean
}

export function PlannerForm({ onSubmit, isLoading = false }: PlannerFormProps) {
  const [catalogFile, setCatalogFile] = useState<File | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      minCredits: 12,
      maxCredits: 18,
      includeSummers: false,
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setCatalogFile(file)
    }
  }

  const onFormSubmit = (data: PlannerFormValues) => {
    if (uploadMethod === "url" && !data.catalogUrl) {
      return // Form validation will handle this
    }
    if (uploadMethod === "file" && !catalogFile) {
      return // Should show error to user
    }

    onSubmit({
      ...data,
      catalogFile: catalogFile || undefined,
    })
  }

  const currentYear = new Date().getFullYear()
  const terms = []
  for (let year = currentYear; year <= currentYear + 6; year++) {
    terms.push(`Spring ${year}`, `Summer ${year}`, `Fall ${year}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Academic Planning Form</CardTitle>
        <CardDescription>
          Provide your degree requirements and preferences to generate your personalized academic plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Institution and Program */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                placeholder="e.g., University of California, Berkeley"
                {...register("institution")}
              />
              {errors.institution && <p className="text-sm text-destructive">{errors.institution.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program/Major</Label>
              <Input id="program" placeholder="e.g., Computer Science, B.S." {...register("program")} />
              {errors.program && <p className="text-sm text-destructive">{errors.program.message}</p>}
            </div>
          </div>

          {/* Catalog Input Method Selection */}
          <div className="space-y-4">
            <Label>Degree Requirements Source</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={uploadMethod === "url" ? "default" : "outline"}
                onClick={() => setUploadMethod("url")}
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                Catalog URL
              </Button>
              <Button
                type="button"
                variant={uploadMethod === "file" ? "default" : "outline"}
                onClick={() => setUploadMethod("file")}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload PDF
              </Button>
            </div>

            {uploadMethod === "url" ? (
              <div className="space-y-2">
                <Label htmlFor="catalogUrl">Catalog URL</Label>
                <Input
                  id="catalogUrl"
                  type="url"
                  placeholder="https://catalog.university.edu/program-requirements"
                  {...register("catalogUrl")}
                />
                {errors.catalogUrl && <p className="text-sm text-destructive">{errors.catalogUrl.message}</p>}
                <p className="text-sm text-muted-foreground">Provide a direct link to your degree requirements page</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="catalogFile">Upload Catalog PDF</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="catalogFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {catalogFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {catalogFile.name}
                    </div>
                  )}
                </div>
                {uploadMethod === "file" && !catalogFile && (
                  <p className="text-sm text-destructive">Please select a PDF file</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Upload a PDF containing your degree requirements and course catalog
                </p>
              </div>
            )}
          </div>

          {/* Credit Constraints */}
          <div className="space-y-4">
            <Label>Credit Load per Term</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minCredits">Minimum Credits</Label>
                <Input
                  id="minCredits"
                  type="number"
                  min="1"
                  max="30"
                  {...register("minCredits", { valueAsNumber: true })}
                />
                {errors.minCredits && <p className="text-sm text-destructive">{errors.minCredits.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCredits">Maximum Credits</Label>
                <Input
                  id="maxCredits"
                  type="number"
                  min="1"
                  max="30"
                  {...register("maxCredits", { valueAsNumber: true })}
                />
                {errors.maxCredits && <p className="text-sm text-destructive">{errors.maxCredits.message}</p>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Set your preferred credit load range per term (typically 12-18 credits)
            </p>
          </div>

          {/* Target Graduation Term */}
          <div className="space-y-2">
            <Label htmlFor="targetGradTerm">Target Graduation Term</Label>
            <Select onValueChange={(value) => setValue("targetGradTerm", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your target graduation term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetGradTerm && <p className="text-sm text-destructive">{errors.targetGradTerm.message}</p>}
          </div>

          {/* Summer Courses Toggle */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="includeSummers" className="text-base font-medium">
                Include Summer Terms
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow courses to be scheduled during summer terms to accelerate graduation
              </p>
            </div>
            <Switch
              id="includeSummers"
              {...register("includeSummers")}
              onCheckedChange={(checked) => setValue("includeSummers", checked)}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Your Plan...
              </>
            ) : (
              "Generate Academic Plan"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
