"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp,
  Info,
  Download,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { mockProjects, mockVPNSteps } from "@/lib/mock-data";
import { useTranslations } from "next-intl";
import { useState } from "react";

const chartConfig = {
  npv: {
    label: "Accumulated NPV",
    color: "hsl(var(--chart-1))",
  },
  discountedValue: {
    label: "Discounted Value",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function VPNAnalysisPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id);
  const project =
    mockProjects.find((p) => p.id === selectedProject) || mockProjects[0];
  const t = useTranslations("dashboard.vpn");

  // Chart data for accumulated NPV
  const accumulatedNpvData = mockVPNSteps.map((step) => ({
    period: `Year ${step.period}`,
    npv: step.accumulatedNPV,
    discountedValue: step.discountedValue,
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder={t("selectProject")} />
              </SelectTrigger>
              <SelectContent>
                {mockProjects
                  .filter((p) => p.results)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Formula Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("formulaTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("formulaDescription")}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
              <p className="font-mono text-lg">{t("formula")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.npv")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${project.results && project.results.npv >= 0 ? "text-success" : "text-destructive"}`}
              >
                ${project.results?.npv.toLocaleString()}
              </p>
              <Badge
                className={
                  project.results && project.results.npv >= 0
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {project.results && project.results.npv >= 0
                  ? t("summary.accept")
                  : t("summary.reject")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.discountRate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(project.discountRate * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("summary.discountRateHelp")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.initialInvestment")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${project.initialInvestment.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("summary.initialInvestmentHelp")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.periods")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{project.periods} Years</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("summary.periodsHelp")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">{t("tabs.table")}</TabsTrigger>
            <TabsTrigger value="chart">{t("tabs.chart")}</TabsTrigger>
            <TabsTrigger value="interpretation">
              {t("tabs.interpretation")}
            </TabsTrigger>
          </TabsList>

          {/* Calculation Table */}
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("table.title")}</CardTitle>
                <CardDescription>{t("table.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">
                          {t("table.period")}
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            {t("table.cashFlow")}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("table.cashFlowHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            {t("table.discountFactor")}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("table.discountFactorHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            {t("table.presentValue")}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("table.presentValueHelp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>{t("table.accumulated")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockVPNSteps.map((step, index) => (
                        <TableRow
                          key={step.period}
                          className={
                            index === mockVPNSteps.length - 1
                              ? "bg-muted/30"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {step.period === 0
                              ? t("table.initial")
                              : t("table.year", { period: step.period })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono ${
                                step.cashFlow >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              ${step.cashFlow.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">
                            {step.discountFactor.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono ${
                                step.discountedValue >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              ${step.discountedValue.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono font-semibold ${
                                step.accumulatedNPV >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              ${step.accumulatedNPV.toLocaleString()}
                            </span>
                            {index === mockVPNSteps.length - 1 && (
                              <Badge className="ml-2 bg-primary/10 text-primary">
                                {t("table.finalNpv")}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Calculation Example */}
                <div className="mt-6 rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="mb-3 font-medium">
                    {t("table.exampleTitle")}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-background px-2 py-1 font-mono">
                      {t("table.exampleStep1")}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded bg-background px-2 py-1 font-mono">
                      {t("table.exampleStep2")}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded bg-success/10 px-2 py-1 font-mono text-success">
                      {t("table.exampleStep3")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NPV Chart */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("chart.title")}</CardTitle>
                <CardDescription>{t("chart.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-100 w-full">
                  <AreaChart data={accumulatedNpvData}>
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
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                      className="text-muted-foreground"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                            "",
                          ]}
                        />
                      }
                    />
                    <ReferenceLine
                      y={0}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="npv"
                      stroke="var(--color-npv)"
                      fill="hsl(var(--chart-1) / 0.2)"
                      strokeWidth={2}
                      name="Accumulated NPV"
                    />
                  </AreaChart>
                </ChartContainer>

                {/* Chart Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-chart-1" />
                    <span className="text-muted-foreground">
                      {t("chart.legend.accumulated")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 border-t-2 border-dashed border-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("chart.legend.breakEven")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interpretation */}
          <TabsContent value="interpretation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("interpretation.title")}</CardTitle>
                <CardDescription>
                  {t("interpretation.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Decision Summary */}
                <div className="flex items-start gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <h4 className="font-semibold text-success">
                      {t("interpretation.recommendation")}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("interpretation.recommendationHelp", {
                        npv: project.results?.npv.toLocaleString(),
                        rate: (project.discountRate * 100).toFixed(1),
                      })}
                    </p>
                  </div>
                </div>

                {/* Key Insights */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("interpretation.valueCreation.title")}
                    </h4>
                    <p className="mt-2 text-sm">
                      {t("interpretation.valueCreation.description", {
                        npv: project.results?.npv.toLocaleString(),
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("interpretation.breakeven.title")}
                    </h4>
                    <p className="mt-2 text-sm">
                      {t("interpretation.breakeven.description")}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("interpretation.sensitivity.title")}
                    </h4>
                    <p className="mt-2 text-sm">
                      {t("interpretation.sensitivity.description", {
                        rate: (project.discountRate * 100).toFixed(1),
                        irr: ((project.results?.irr || 0) * 100).toFixed(1),
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t("interpretation.rule.title")}
                    </h4>
                    <p className="mt-2 text-sm">
                      {t("interpretation.rule.description")}
                    </p>
                  </div>
                </div>

                {/* Formula Explanation */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 font-medium">
                    {t("interpretation.whydiscount.title")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("interpretation.whydiscount.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
