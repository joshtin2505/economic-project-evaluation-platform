"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  DollarSign,
  Info,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import * as projectService from "@/lib/services/projects";
import {
  buildBenefitCostData,
  getEffectiveDiscountRate,
  selectFeaturedProject,
  type CashFlowRecord,
  type ProjectRecord,
} from "@/lib/services/project-analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

export default function BenefitCostPage() {
  const t = useTranslations("dashboard.benefitCost");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [selectedCashFlows, setSelectedCashFlows] = useState<CashFlowRecord[]>(
    [],
  );
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
            : "Failed to load benefit/cost data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;

    const loadSelectedProject = async () => {
      try {
        const [projectDetail, cashFlowRows] = await Promise.all([
          projectService.fetchProjectById(selectedProjectId),
          projectService.fetchCashFlows(selectedProjectId),
        ]);

        setSelectedProject(projectDetail as ProjectRecord);
        setSelectedCashFlows((cashFlowRows ?? []) as CashFlowRecord[]);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load project details",
        );
      }
    };

    void loadSelectedProject();
  }, [selectedProjectId]);

  const benefitCostData = useMemo(
    () =>
      selectedProject
        ? buildBenefitCostData(selectedProject, selectedCashFlows)
        : { benefits: [], costs: [] },
    [selectedCashFlows, selectedProject],
  );

  const benefitsChartConfig = benefitCostData.benefits.reduce(
    (config, benefit, index) => {
      config[benefit.category] = {
        label: benefit.category,
        color: COLORS[index % COLORS.length],
      };
      return config;
    },
    {} as ChartConfig,
  );

  const costsChartConfig = benefitCostData.costs.reduce(
    (config, cost, index) => {
      config[cost.category] = {
        label: cost.category,
        color: COLORS[index % COLORS.length],
      };
      return config;
    },
    {} as ChartConfig,
  );

  const totalBenefitsPV = benefitCostData.benefits.reduce(
    (sum, benefit) => sum + benefit.pvAmount,
    0,
  );
  const totalCostsPV = benefitCostData.costs.reduce(
    (sum, cost) => sum + cost.pvAmount,
    0,
  );
  const bcRatio = totalCostsPV > 0 ? totalBenefitsPV / totalCostsPV : 0;
  const netBenefit = totalBenefitsPV - totalCostsPV;
  const usingTmarAsRate = selectedProject?.use_tmar_as_discount_rate ?? false;
  const effectiveDiscountRate = selectedProject ? getEffectiveDiscountRate(selectedProject) : 0;

  const benefitsPieData = benefitCostData.benefits.map((benefit) => ({
    name: benefit.category,
    value: benefit.pvAmount,
  }));
  const costsPieData = benefitCostData.costs.map((cost) => ({
    name: cost.category,
    value: cost.pvAmount,
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="py-3 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}
        {isLoading && !error && (
          <Card>
            <CardContent className="py-3 text-sm text-muted-foreground">
              Loading benefit/cost data...
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
                {projects
                  .filter((project) => project.results)
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("formulaTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("formulaDescription")}
                </p>
                {usingTmarAsRate && (
                  <p className="mt-1 text-xs text-primary font-medium">
                    {t("preview.usingTmarAsRate")}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
              <p className="font-mono text-lg">{t("formula")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.ratio")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-3xl font-bold ${bcRatio >= 1 ? "text-success" : "text-destructive"}`}
              >
                {bcRatio.toFixed(2)}
              </p>
              <Badge
                className={
                  bcRatio >= 1
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {bcRatio >= 1
                  ? t("summary.feasible")
                  : t("summary.notFeasible")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.pvBenefits")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                ${totalBenefitsPV.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {t("summary.pvBenefitsHelp")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.pvCosts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                ${totalCostsPV.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                {t("summary.pvCostsHelp")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.netBenefit")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${netBenefit >= 0 ? "text-success" : "text-destructive"}`}
              >
                ${netBenefit.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                {t("summary.netBenefitHelp")}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("comparison.title")}</CardTitle>
            <CardDescription>{t("comparison.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {t("comparison.benefits")}
                    </span>
                    <span className="text-success">
                      ${totalBenefitsPV.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={100} className="h-4 bg-muted" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{t("comparison.costs")}</span>
                    <span className="text-destructive">
                      ${totalCostsPV.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={
                      totalBenefitsPV > 0
                        ? (totalCostsPV / totalBenefitsPV) * 100
                        : 0
                    }
                    className="h-4 bg-muted"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="font-medium">{t("comparison.result")}</span>
                <span
                  className={`text-lg font-bold ${bcRatio >= 1 ? "text-success" : "text-destructive"}`}
                >
                  {bcRatio.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.benefits.title")}</CardTitle>
              <CardDescription>
                {t("charts.benefits.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={benefitsChartConfig}
                className="h-75 w-full"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: any) => [
                          `$${Number(value).toLocaleString()}`,
                          "",
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={benefitsPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {benefitsPieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("charts.costs.title")}</CardTitle>
              <CardDescription>{t("charts.costs.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={costsChartConfig} className="h-75 w-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: any) => [
                          `$${Number(value).toLocaleString()}`,
                          "",
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={costsPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {costsPieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("details.title")}</CardTitle>
            <CardDescription>{t("details.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium">{t("details.benefits")}</h3>
              {benefitCostData.benefits.map((benefit, index) => (
                <div
                  key={benefit.category}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span>{benefit.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">
                      ${benefit.amount.toLocaleString()}
                    </span>
                    <span className="font-mono font-medium text-success">
                      ${benefit.pvAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">{t("details.costs")}</h3>
              {benefitCostData.costs.map((cost) => (
                <div
                  key={cost.category}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span>{cost.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground">
                      ${cost.amount.toLocaleString()}
                    </span>
                    <span className="font-mono font-medium text-destructive">
                      ${cost.pvAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
