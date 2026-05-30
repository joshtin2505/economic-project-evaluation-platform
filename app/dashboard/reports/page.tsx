"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  TrendingUp,
} from "lucide-react";
import * as projectService from "@/lib/services/projects";
import {
  selectFeaturedProject,
  type ProjectRecord,
} from "@/lib/services/project-analytics";
import {
  formatRatePercent,
  getBenefitCostRatio,
} from "@/lib/utils/project-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReportsPage() {
  const t = useTranslations("dashboard.reports");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectRows =
          (await projectService.fetchProjects()) as ProjectRecord[];
        setProjects(projectRows);

        const defaultProject = selectFeaturedProject(projectRows);
        if (defaultProject) {
          setSelectedProjectId(defaultProject.id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load reports data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === selectedProjectId) ||
      projects[0] ||
      null,
    [projects, selectedProjectId],
  );

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder={t("selectProject")} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.pdf.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.pdf.description")}
            </p>
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
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.excel.description")}
            </p>
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
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.csv.description")}
            </p>
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
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.print.description")}
            </p>
            <Button className="mt-4" variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              {t("exports.print.action")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t("preview.title")}</CardTitle>
              <CardDescription>{t("preview.description")}</CardDescription>
            </div>
            <Badge>{t("preview.badge")}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedProject ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              {isLoading ? "Loading reports..." : "No projects available yet."}
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-8">
              <div className="border-b pb-6 text-center">
                <h1 className="text-2xl font-bold">{t("report.title")}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {selectedProject.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("report.generatedOn", {
                    date: new Date().toLocaleDateString(),
                  })}
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold">
                  {t("sections.executiveSummary")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.npv")}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xl font-bold ${selectedProject.results && (selectedProject.results.npv ?? 0) >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {selectedProject.results?.npv !== undefined
                        ? `$${selectedProject.results.npv.toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.irr")}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold">
                      {selectedProject.results?.irr !== undefined
                        ? formatRatePercent(selectedProject.results.irr)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.bcRatio")}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold">
                      {getBenefitCostRatio(selectedProject.results) !== undefined
                        ? getBenefitCostRatio(selectedProject.results)!.toFixed(2)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.verdict")}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xl font-bold ${selectedProject.results?.isViable ? "text-success" : "text-destructive"}`}
                    >
                      {selectedProject.results?.isViable
                        ? t("summary.viable")
                        : t("summary.notViable")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold">
                  {t("sections.projectDetails")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.initialInvestment")}
                      </span>
                      <span className="font-mono font-medium">
                        $
                        {toNumber(
                          selectedProject.initial_investment,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.analysisPeriod")}
                      </span>
                      <span className="font-medium">
                        {t("details.years", { count: selectedProject.periods })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.discountRate")}
                      </span>
                      <span className="font-mono font-medium">
                        {(
                          (selectedProject.discount_rate
                            ? Number(selectedProject.discount_rate)
                            : 0) * 100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.paybackPeriod")}
                      </span>
                      <span className="font-medium">
                        {selectedProject.results?.paybackPeriod !== undefined
                          ? `${selectedProject.results.paybackPeriod.toFixed(1)} ${t("details.yearsShort")}`
                          : t("details.na")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.profitabilityIndex")}
                      </span>
                      <span className="font-mono font-medium">
                        {selectedProject.results?.profitabilityIndex !==
                        undefined
                          ? selectedProject.results.profitabilityIndex.toFixed(
                              2,
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.tmar")}
                      </span>
                      <span className="font-mono font-medium">
                        {selectedProject.results?.tmar !== undefined
                          ? `${(selectedProject.results.tmar * 100).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}
