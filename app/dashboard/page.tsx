"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Calculator,
  CheckCircle2,
  Clock,
  LineChart,
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
import {
  calculatePortfolioMetrics,
  canShowNpvEvolutionChart,
  getActiveProjects,
  type ProjectWithCashFlows,
} from "@/lib/services/portfolio-analytics";
import { formatDecimalRate } from "@/lib/utils/project-results";
import { formatCompactCurrency } from "@/lib/utils/currency-format";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

type KpiChangeType = "positive" | "neutral" | "stored" | "muted";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [portfolioEntries, setPortfolioEntries] = useState<ProjectWithCashFlows[]>(
    [],
  );
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

        const activeProjects = getActiveProjects(projectRows);
        const entries = await Promise.all(
          activeProjects.map(async (project) => {
            const cashFlowRows = await projectService.fetchCashFlows(project.id);
            return {
              project,
              cashFlows: (cashFlowRows ?? []) as CashFlowRecord[],
            };
          }),
        );
        setPortfolioEntries(entries);

        const selectedProject = selectFeaturedProject(projectRows);
        if (selectedProject) {
          const existing = entries.find(
            (entry) => entry.project.id === selectedProject.id,
          );
          if (existing) {
            setFeaturedProject(existing.project);
            setFeaturedCashFlows(existing.cashFlows);
          } else {
            const [projectDetail, cashFlowRows] = await Promise.all([
              projectService.fetchProjectById(selectedProject.id),
              projectService.fetchCashFlows(selectedProject.id),
            ]);
            setFeaturedProject(projectDetail as ProjectRecord);
            setFeaturedCashFlows((cashFlowRows ?? []) as CashFlowRecord[]);
          }
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

  const portfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(projects, portfolioEntries),
    [portfolioEntries, projects],
  );

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

  const showNpvEvolution = useMemo(
    () => canShowNpvEvolutionChart(projects),
    [projects],
  );

  const kpiCards = useMemo(
    () => [
      {
        title: "NPV (VPN)",
        value: formatCompactCurrency(portfolioMetrics.portfolioNpv),
        change: `${portfolioMetrics.activeProjectCount} active`,
        changeType: "positive" as KpiChangeType,
        description: "Portfolio value from saved results",
        icon: TrendingUp,
      },
      {
        title: "Avg. IRR (TIR)",
        value:
          portfolioMetrics.consolidatedIrrDecimal !== null
            ? formatDecimalRate(portfolioMetrics.consolidatedIrrDecimal, 2)
            : "—",
        change: "Consolidated cash-flow IRR",
        changeType: "muted" as KpiChangeType,
        description: "Global IRR on merged active project flows",
        icon: Calculator,
      },
      {
        title: "TMAR",
        value:
          portfolioMetrics.weightedTmarDecimal !== null
            ? formatDecimalRate(portfolioMetrics.weightedTmarDecimal, 2)
            : "—",
        change: "Stored with project data",
        changeType: "stored" as KpiChangeType,
        description: "Investment-weighted average minimum acceptable rate",
        icon: Percent,
      },
      {
        title: "Avg. B/C Ratio",
        value:
          portfolioMetrics.avgBcRatio > 0
            ? portfolioMetrics.avgBcRatio.toFixed(2)
            : "—",
        change: portfolioMetrics.avgBcRatio >= 1 ? "Feasible" : "Pending",
        changeType:
          portfolioMetrics.avgBcRatio >= 1
            ? ("positive" as KpiChangeType)
            : ("muted" as KpiChangeType),
        description: "Benefit/Cost ratio from saved evaluations",
        icon: Scale,
      },
    ],
    [portfolioMetrics],
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

  const consolidatedCashFlowTimeline = useMemo(() => {
    if (portfolioEntries.length === 0) return [];

    const maxPeriod = portfolioEntries.reduce((max, entry) => {
      const entryMax = entry.cashFlows.reduce(
        (periodMax, flow) => Math.max(periodMax, flow.period),
        0,
      );
      return Math.max(max, entryMax);
    }, 0);

    const timeline = [
      {
        period: "Year 0",
        inflow: 0,
        outflow: portfolioEntries.reduce(
          (sum, entry) => sum + Number(entry.project.initial_investment ?? 0),
          0,
        ),
      },
    ];

    for (let period = 1; period <= maxPeriod; period += 1) {
      let inflow = 0;
      let outflow = 0;

      portfolioEntries.forEach((entry) => {
        const flow = entry.cashFlows.find((row) => row.period === period);
        if (!flow) return;
        inflow += Number(flow.inflow ?? 0);
        outflow += Number(flow.outflow ?? 0);
      });

      timeline.push({
        period: `Year ${period}`,
        inflow,
        outflow,
      });
    }

    return timeline;
  }, [portfolioEntries]);

  const cashFlowTimelineData =
    consolidatedCashFlowTimeline.length > 0
      ? consolidatedCashFlowTimeline
      : featuredProject
        ? buildCashFlowTimeline(featuredProject, featuredCashFlows)
        : [];

  const kpiChangeClass = (changeType: KpiChangeType) => {
    switch (changeType) {
      case "positive":
        return "text-success";
      case "stored":
        return "rounded-md bg-amber-500/15 px-1.5 py-0.5 text-amber-100/90 dark:text-amber-200/95";
      case "muted":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

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
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold">{kpi.value}</span>
                <span
                  className={`flex items-center text-xs font-medium ${kpiChangeClass(kpi.changeType)}`}
                >
                  {kpi.changeType === "positive" && (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
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
              <BarChart data={cashFlowTimelineData.slice(0, 12)}>
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
                  tickFormatter={(value) => formatCompactCurrency(Number(value))}
                  className="text-muted-foreground"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value: number | string) => [
                        formatCompactCurrency(Math.abs(Number(value))),
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
            {showNpvEvolution ? (
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
                    tickFormatter={(value) =>
                      formatCompactCurrency(Number(value))
                    }
                    className="text-muted-foreground"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value: number | string) => [
                          formatCompactCurrency(Number(value)),
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
            ) : (
              <Empty className="h-75 border border-dashed border-border/60 bg-muted/20">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LineChart className="h-5 w-5 text-primary/80" />
                  </EmptyMedia>
                  <EmptyTitle>{t("overview.npvEvolutionEmptyTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("overview.npvEvolutionEmptyDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
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