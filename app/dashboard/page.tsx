"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Calculator,
  CheckCircle2,
  Clock,
  Percent,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import * as projectService from "@/lib/services/projects";
import {
  buildCashFlowTimeline,
  buildFinancialEvolutionData,
  buildNotifications,
  buildRecentCalculations,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const cashFlowChartConfig = {
  inflow: {
    label: "Inflows",
    color: "hsl(var(--chart-2))",
  },
  outflow: {
    label: "Outflows",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const npvChartConfig = {
  npv: {
    label: "Actual NPV",
    color: "hsl(var(--chart-1))",
  },
  projectedNpv: {
    label: "Projected NPV",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [featuredProject, setFeaturedProject] = useState<ProjectRecord | null>(
    null,
  );
  const [featuredCashFlows, setFeaturedCashFlows] = useState<CashFlowRecord[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectRows =
          (await projectService.fetchProjects()) as ProjectRecord[];
        setProjects(projectRows);

        const selectedProject = selectFeaturedProject(projectRows);
        if (selectedProject) {
          const [projectDetail, cashFlowRows] = await Promise.all([
            projectService.fetchProjectById(selectedProject.id),
            projectService.fetchCashFlows(selectedProject.id),
          ]);

          setFeaturedProject(projectDetail as ProjectRecord);
          setFeaturedCashFlows((cashFlowRows ?? []) as CashFlowRecord[]);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load dashboard data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const completedProjects = useMemo(
    () => projects.filter((project) => project.status === "completed").length,
    [projects],
  );
  const analyzingProjects = useMemo(
    () => projects.filter((project) => project.status === "analyzing").length,
    [projects],
  );
  const draftProjects = useMemo(
    () => projects.filter((project) => project.status === "draft").length,
    [projects],
  );
  const completedProjectsWithResults = useMemo(
    () => projects.filter((project) => project.results),
    [projects],
  );

  const portfolioNpv = useMemo(
    () =>
      completedProjectsWithResults.reduce(
        (sum, project) => sum + toNumber(project.results?.npv),
        0,
      ),
    [completedProjectsWithResults],
  );
  const avgIrr = useMemo(() => {
    if (completedProjectsWithResults.length === 0) return 0;
    return (
      completedProjectsWithResults.reduce(
        (sum, project) => sum + toNumber(project.results?.irr),
        0,
      ) / completedProjectsWithResults.length
    );
  }, [completedProjectsWithResults]);
  const avgTmar = useMemo(() => {
    if (completedProjectsWithResults.length === 0) return 0;
    return (
      completedProjectsWithResults.reduce(
        (sum, project) => sum + toNumber(project.results?.tmar),
        0,
      ) / completedProjectsWithResults.length
    );
  }, [completedProjectsWithResults]);
  const avgBcRatio = useMemo(() => {
    const rows = completedProjectsWithResults.filter(
      (project) => typeof project.results?.benefitCostRatio === "number",
    );
    if (rows.length === 0) return 0;
    return (
      rows.reduce(
        (sum, project) => sum + toNumber(project.results?.benefitCostRatio),
        0,
      ) / rows.length
    );
  }, [completedProjectsWithResults]);

  const kpiCards = useMemo(
    () => [
      {
        title: "NPV (VPN)",
        value: `$${portfolioNpv.toLocaleString()}`,
        change: `${completedProjectsWithResults.length} completed`,
        changeType: "positive" as const,
        description: "Portfolio value from saved results",
        icon: TrendingUp,
      },
      {
        title: "Avg. IRR (TIR)",
        value: `${(avgIrr * 100).toFixed(1)}%`,
        change:
          completedProjectsWithResults.length > 0
            ? "From saved analyses"
            : "No results yet",
        changeType:
          completedProjectsWithResults.length > 0
            ? ("positive" as const)
            : ("neutral" as const),
        description: "Average internal rate from stored projects",
        icon: Calculator,
      },
      {
        title: "TMAR",
        value: `${(avgTmar * 100).toFixed(1)}%`,
        change: "Stored with project data",
        changeType: "neutral" as const,
        description: "Average minimum acceptable rate",
        icon: Percent,
      },
      {
        title: "Avg. B/C Ratio",
        value: avgBcRatio > 0 ? avgBcRatio.toFixed(2) : "-",
        change: avgBcRatio >= 1 ? "Feasible" : "Pending",
        changeType:
          avgBcRatio >= 1 ? ("positive" as const) : ("neutral" as const),
        description: "Benefit/Cost ratio from saved evaluations",
        icon: Scale,
      },
    ],
    [
      avgBcRatio,
      avgIrr,
      avgTmar,
      completedProjectsWithResults.length,
      portfolioNpv,
    ],
  );

  const recentCalculations = useMemo(
    () => buildRecentCalculations(projects),
    [projects],
  );
  const notifications = useMemo(() => buildNotifications(projects), [projects]);
  const financialEvolutionData = useMemo(
    () => buildFinancialEvolutionData(projects),
    [projects],
  );
  const cashFlowTimelineData = useMemo(
    () =>
      featuredProject
        ? buildCashFlowTimeline(featuredProject, featuredCashFlows)
        : [],
    [featuredCashFlows, featuredProject],
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
      {isLoading && !error && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            Loading dashboard data...
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("overview.title")}
          </h1>
          <p className="text-muted-foreground">{t("overview.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4" />
            {t("projects.new")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{kpi.value}</span>
                <span
                  className={`flex items-center text-xs font-medium ${
                    kpi.changeType === "positive"
                      ? "text-success"
                      : kpi.changeType === "neutral"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }`}
                >
                  {kpi.changeType === "positive" && (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  )}
                  {kpi.changeType === "neutral" && (
                    <ArrowDownRight className="mr-0.5 h-3 w-3" />
                  )}
                  {kpi.change}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("overview.cashFlowTrend")}</CardTitle>
            <CardDescription>
              {t("overview.cashFlowTrendDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={cashFlowChartConfig}
              className="h-75 w-full"
            >
              <BarChart data={cashFlowTimelineData.slice(0, 8)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => [
                        `$${Math.abs(Number(value)).toLocaleString()}`,
                        "",
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="inflow"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  name="Inflows"
                />
                <Bar
                  dataKey="outflow"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  name="Outflows"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("overview.NPVTrend")}</CardTitle>
            <CardDescription>
              {t("overview.NPVTrendDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={npvChartConfig} className="h-75 w-full">
              <AreaChart data={financialEvolutionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: any) => [
                        `$${Number(value).toLocaleString()}`,
                        "",
                      ]}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="npv"
                  stroke="var(--chart-1)"
                  fill="oklch(from var(--chart-1) l c h / 0.2)"
                  strokeWidth={2}
                  name="Actual NPV"
                />
                <Area
                  type="monotone"
                  dataKey="projectedNpv"
                  stroke="var(--chart-3)"
                  fill="oklch(from var(--chart-3) l c h / 0.2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Projected NPV"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("overview.recentCalculations")}</CardTitle>
              <CardDescription>
                {t("overview.recentCalculationsDescription")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reports">{t("overview.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("overview.recentCalcsTable.project")}
                  </TableHead>
                  <TableHead>
                    {t("overview.recentCalcsTable.indicator")}
                  </TableHead>
                  <TableHead>{t("overview.recentCalcsTable.value")}</TableHead>
                  <TableHead>{t("overview.recentCalcsTable.date")}</TableHead>
                  <TableHead>{t("overview.recentCalcsTable.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCalculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-medium">
                      {calc.project}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{calc.indicator}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{calc.value}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {calc.date}
                    </TableCell>
                    <TableCell>
                      {calc.status === "positive" ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t("overview.status.viable")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {t("overview.status.notViable")}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t("overview.notifications")}</CardTitle>
              <CardDescription>
                {t("overview.notificationsDescription")}
              </CardDescription>
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                >
                  {notification.type === "success" && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  )}
                  {notification.type === "warning" && (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  {notification.type === "info" && (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-tight">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium">
                {t("overview.projectStatesSummary.title")}
              </h4>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    {t("overview.projectStatesSummary.completed")}
                  </span>
                  <span className="font-medium">{completedProjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    {t("overview.projectStatesSummary.analyzing")}
                  </span>
                  <span className="font-medium">{analyzingProjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    {t("overview.projectStatesSummary.draft")}
                  </span>
                  <span className="font-medium">{draftProjects}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
