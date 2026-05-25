"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  TrendingUp,
  Calculator,
  Scale,
} from "lucide-react"
import { mockProjects } from "@/lib/mock-data"
import { useState } from "react"

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const project = mockProjects.find((p) => p.id === selectedProject) || mockProjects[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive financial analysis reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {mockProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mt-4 font-semibold">PDF Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete analysis document
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <FileSpreadsheet className="h-6 w-6 text-success" />
            </div>
            <h3 className="mt-4 font-semibold">Excel Export</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Spreadsheet with calculations
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">CSV Data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Raw data for analysis
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Printer className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Print Report</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Printer-friendly version
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Preview of the generated report content
              </CardDescription>
            </div>
            <Badge>PDF Preview</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background p-8">
            {/* Report Header */}
            <div className="border-b pb-6 text-center">
              <h1 className="text-2xl font-bold">Economic Analysis Report</h1>
              <p className="mt-2 text-lg text-muted-foreground">{project.name}</p>
              <p className="text-sm text-muted-foreground">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Executive Summary */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Executive Summary</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">NPV</span>
                  </div>
                  <p className={`mt-1 text-xl font-bold ${project.results && project.results.npv >= 0 ? "text-success" : "text-destructive"}`}>
                    ${project.results?.npv.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">IRR</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {project.results ? `${(project.results.irr * 100).toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">B/C Ratio</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {project.results?.benefitCostRatio.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Verdict</span>
                  </div>
                  <p className={`mt-1 text-xl font-bold ${project.results?.isViable ? "text-success" : "text-destructive"}`}>
                    {project.results?.isViable ? "Viable" : "Not Viable"}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Project Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial Investment:</span>
                    <span className="font-mono font-medium">
                      ${project.initialInvestment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Period:</span>
                    <span className="font-medium">{project.periods} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount Rate:</span>
                    <span className="font-mono font-medium">
                      {(project.discountRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payback Period:</span>
                    <span className="font-medium">
                      {project.results?.paybackPeriod.toFixed(1) || "N/A"} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profitability Index:</span>
                    <span className="font-mono font-medium">
                      {project.results?.profitabilityIndex.toFixed(2) || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TMAR:</span>
                    <span className="font-mono font-medium">
                      {project.results ? `${(project.results.tmar * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Recommendation</h2>
              <div className={`mt-4 rounded-lg p-4 ${project.results?.isViable ? "bg-success/10" : "bg-destructive/10"}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 ${project.results?.isViable ? "text-success" : "text-destructive"}`} />
                  <div>
                    <p className={`font-semibold ${project.results?.isViable ? "text-success" : "text-destructive"}`}>
                      {project.results?.isViable
                        ? "Project Recommended for Investment"
                        : "Project Not Recommended"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {project.results?.isViable
                        ? `Based on the analysis, this project shows a positive NPV of $${project.results.npv.toLocaleString()} and an IRR of ${(project.results.irr * 100).toFixed(1)}% which exceeds the TMAR of ${(project.results.tmar * 100).toFixed(1)}%. The benefit-cost ratio of ${project.results.benefitCostRatio.toFixed(2)} indicates the project will generate $${project.results.benefitCostRatio.toFixed(2)} in benefits for every $1 invested.`
                        : "The project does not meet the minimum acceptable criteria for investment based on the current parameters."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
              <p>This report was generated by EconoLab - Economic Project Evaluation Platform</p>
              <p className="mt-1">Confidential - For internal use only</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Report Sections</CardTitle>
          <CardDescription>
            Customize which sections to include in the exported report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Executive Summary", included: true },
              { name: "Project Details", included: true },
              { name: "Cash Flow Analysis", included: true },
              { name: "NPV Calculations", included: true },
              { name: "IRR Analysis", included: true },
              { name: "Benefit/Cost Analysis", included: true },
              { name: "Sensitivity Analysis", included: false },
              { name: "Risk Assessment", included: false },
              { name: "Recommendations", included: true },
            ].map((section) => (
              <div
                key={section.name}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  section.included ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <span className="text-sm font-medium">{section.name}</span>
                <Badge variant={section.included ? "default" : "outline"}>
                  {section.included ? "Included" : "Optional"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
