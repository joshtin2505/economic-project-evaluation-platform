"use client"

import { useTranslations } from "next-intl"
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
  const t = useTranslations("dashboard.reports")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder={t("selectProject")} />
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
            <h3 className="mt-4 font-semibold">{t("exports.pdf.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("exports.pdf.description")}</p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("exports.pdf.action")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <FileSpreadsheet className="h-6 w-6 text-success" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.excel.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("exports.excel.description")}</p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("exports.excel.action")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.csv.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("exports.csv.description")}</p>
            <Button className="mt-4" variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              {t("exports.csv.action")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Printer className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.print.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("exports.print.description")}</p>
            <Button className="mt-4" variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              {t("exports.print.action")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("preview.title")}</CardTitle>
              <CardDescription>{t("preview.description")}</CardDescription>
            </div>
            <Badge>{t("preview.badge")}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background p-8">
            {/* Report Header */}
            <div className="border-b pb-6 text-center">
              <h1 className="text-2xl font-bold">{t("report.title")}</h1>
              <p className="mt-2 text-lg text-muted-foreground">{project.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("report.generatedOn", { date: new Date().toLocaleDateString() })}
              </p>
            </div>

            {/* Executive Summary */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">{t("sections.executiveSummary")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{t("summary.npv")}</span>
                  </div>
                  <p className={`mt-1 text-xl font-bold ${project.results && project.results.npv >= 0 ? "text-success" : "text-destructive"}`}>
                    ${project.results?.npv.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{t("summary.irr")}</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {project.results ? `${(project.results.irr * 100).toFixed(1)}%` : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{t("summary.bcRatio")}</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">
                    {project.results?.benefitCostRatio.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{t("summary.verdict")}</span>
                  </div>
                  <p className={`mt-1 text-xl font-bold ${project.results?.isViable ? "text-success" : "text-destructive"}`}>
                    {project.results?.isViable ? t("summary.viable") : t("summary.notViable")}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">{t("sections.projectDetails")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.initialInvestment")}</span>
                    <span className="font-mono font-medium">
                      ${project.initialInvestment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.analysisPeriod")}</span>
                    <span className="font-medium">{t("details.years", { count: project.periods })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.discountRate")}</span>
                    <span className="font-mono font-medium">
                      {(project.discountRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.paybackPeriod")}</span>
                    <span className="font-medium">
                      {project.results?.paybackPeriod.toFixed(1) || t("details.na")} {t("details.yearsShort")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.profitabilityIndex")}</span>
                    <span className="font-mono font-medium">
                      {project.results?.profitabilityIndex.toFixed(2) || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.tmar")}</span>
                    <span className="font-mono font-medium">
                      {project.results ? `${(project.results.tmar * 100).toFixed(1)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">{t("sections.recommendation")}</h2>
              <div className={`mt-4 rounded-lg p-4 ${project.results?.isViable ? "bg-success/10" : "bg-destructive/10"}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`mt-0.5 h-5 w-5 ${project.results?.isViable ? "text-success" : "text-destructive"}`} />
                  <div>
                    <p className={`font-semibold ${project.results?.isViable ? "text-success" : "text-destructive"}`}>
                      {project.results?.isViable ? t("recommendation.accept") : t("recommendation.reject")}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {project.results?.isViable
                        ? t("recommendation.acceptText", {
                            npv: project.results.npv.toLocaleString(),
                            irr: (project.results.irr * 100).toFixed(1),
                            tmar: (project.results.tmar * 100).toFixed(1),
                            ratio: project.results.benefitCostRatio.toFixed(2),
                          })
                        : t("recommendation.rejectText")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
              <p>{t("footer.generatedBy")}</p>
              <p className="mt-1">{t("footer.confidential")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sectionsChecklist.title")}</CardTitle>
          <CardDescription>{t("sectionsChecklist.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: t("sectionsChecklist.items.executiveSummary"), included: true },
              { name: t("sectionsChecklist.items.projectDetails"), included: true },
              { name: t("sectionsChecklist.items.cashFlowAnalysis"), included: true },
              { name: t("sectionsChecklist.items.npvCalculations"), included: true },
              { name: t("sectionsChecklist.items.irrAnalysis"), included: true },
              { name: t("sectionsChecklist.items.benefitCostAnalysis"), included: true },
              { name: t("sectionsChecklist.items.sensitivityAnalysis"), included: false },
              { name: t("sectionsChecklist.items.riskAssessment"), included: false },
              { name: t("sectionsChecklist.items.recommendations"), included: true },
            ].map((section) => (
              <div
                key={section.name}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  section.included ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <span className="text-sm font-medium">{section.name}</span>
                <Badge variant={section.included ? "default" : "outline"}>
                  {section.included ? t("sectionsChecklist.included") : t("sectionsChecklist.optional")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
