"use client";

import { useTranslations } from "next-intl";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Calculator,
  Info,
  Download,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { useMemo } from "react";
import { useProjectAnalysis } from "@/lib/hooks/useProjectAnalysis";
import {
  buildNpvVsRateData,
  buildTirIterations,
  getEffectiveDiscountRate,
} from "@/lib/services/project-analytics";
import {
  asPercent,
  formatRatePercent,
  isRateAbove,
} from "@/lib/utils/project-results";

const npvChartConfig = {
  npv: {
    label: "NPV",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const convergenceChartConfig = {
  npv: {
    label: "NPV",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function TIRAnalysisPage() {
  const {
    projectOptions,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    selectedCashFlows,
    isLoading,
    error,
  } = useProjectAnalysis({ requireResults: true });
  const t = useTranslations("dashboard.tir");

  const tirIterations = useMemo(
    () =>
      selectedProject
        ? buildTirIterations(selectedProject, selectedCashFlows)
        : [],
    [selectedCashFlows, selectedProject],
  );

  const npvVsRateData = useMemo(
    () =>
      selectedProject
        ? buildNpvVsRateData(selectedProject, selectedCashFlows)
        : [],
    [selectedCashFlows, selectedProject],
  );

  const irrPercent = asPercent(selectedProject?.results?.irr);
  const tmarPercent = asPercent(selectedProject?.results?.tmar);
  const spreadPercent = irrPercent - tmarPercent;
  const usingTmarAsRate = selectedProject?.use_tmar_as_discount_rate ?? false;
  const effectiveDiscountRate = selectedProject ? getEffectiveDiscountRate(selectedProject) : 0;

  const convergenceData = tirIterations.map((iter) => ({
    iteration: iter.iteration,
    rate: (iter.rate * 100).toFixed(2),
    npv: iter.npv,
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
              Loading...
            </CardContent>
          </Card>
        )}
        {/* Page Header */}
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
                {projectOptions.map((p) => (
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
          <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("formulaTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("formulaDescription")}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
                <p className="font-mono text-lg">{t("formula")}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
                <p className="font-mono text-sm">
                  r<sub>n+1</sub> = r<sub>n</sub> - f(r<sub>n</sub>) / f&apos;(r
                  <sub>n</sub>)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("newtonRaphson")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.irr")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {formatRatePercent(selectedProject?.results?.irr)}
              </p>
              <Badge
                className={
                  isRateAbove(
                    selectedProject?.results?.irr,
                    selectedProject?.results?.tmar,
                  )
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {isRateAbove(
                  selectedProject?.results?.irr,
                  selectedProject?.results?.tmar,
                )
                  ? t("summary.accept")
                  : t("summary.reject")}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.tmar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatRatePercent(selectedProject?.results?.tmar)}
              </p>
              {usingTmarAsRate && (
                <p className="mt-2 text-xs text-primary font-medium">
                  {t("preview.usingTmarAsRate")}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {t("summary.tmarHelp")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.spread")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  isRateAbove(
                    selectedProject?.results?.irr,
                    selectedProject?.results?.tmar,
                  )
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {selectedProject?.results
                  ? `${spreadPercent >= 0 ? "+" : ""}${spreadPercent.toFixed(1)}%`
                  : "N/A"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("summary.spreadHelp")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.iterations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{tirIterations.length}</p>
              <div className="mt-2 flex items-center gap-1">
                <Zap className="h-3 w-3 text-accent" />
                <p className="text-xs text-muted-foreground">
                  {t("summary.iterationsHelp")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* NPV vs Interest Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.npv.title")}</CardTitle>
              <CardDescription>{t("charts.npv.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={npvChartConfig} className="h-75 w-full">
                <AreaChart data={npvVsRateData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="rate"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
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
                        labelFormatter={(label) => `Rate: ${label}%`}
                        formatter={(value) => [
                          `$${Number(value).toLocaleString()}`,
                          "NPV",
                        ]}
                      />
                    }
                  />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="3 3"
                  />
                  {irrPercent > 0 && (
                    <ReferenceLine
                      x={irrPercent}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      label={{
                        value: `IRR = ${irrPercent.toFixed(1)}%`,
                        position: "top",
                        fill: "hsl(var(--primary))",
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="npv"
                    stroke="var(--chart-1)"
                    fill="oklch(from var(--chart-1) l c h / 0.5)"
                    strokeWidth={2}
                    name="NPV"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Convergence Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.convergence.title")}</CardTitle>
              <CardDescription>
                {t("charts.convergence.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={convergenceChartConfig}
                className="h-75 w-full"
              >
                <LineChart data={convergenceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="iteration"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: t("charts.convergence.axisLabel"),
                      position: "bottom",
                      offset: -5,
                    }}
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
                        formatter={(value, name) => {
                          if (name === "npv")
                            return [
                              `$${Number(value).toLocaleString()}`,
                              "NPV",
                            ];
                          return [value, name];
                        }}
                      />
                    }
                  />
                  <ReferenceLine
                    y={0}
                    stroke="hsl(var(--chart-2))"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="npv"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ fill: "var(--chart-2)", strokeWidth: 2, r: 4 }}
                    name="npv"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Newton-Raphson Iterations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t("iterations.title")}
            </CardTitle>
            <CardDescription>{t("iterations.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">
                      {t("iterations.iteration")}
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t("iterations.rate")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("iterations.rateHelp")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t("iterations.npv")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("iterations.npvHelp")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        {t("iterations.derivative")}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("iterations.derivativeHelp")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>{t("iterations.adjustment")}</TableHead>
                    <TableHead>{t("iterations.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tirIterations.map((iter) => (
                    <TableRow
                      key={iter.iteration}
                      className={iter.converged ? "bg-success/5" : ""}
                    >
                      <TableCell className="font-medium">
                        {iter.iteration}
                      </TableCell>
                      <TableCell className="font-mono">
                        {(iter.rate * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono ${
                            iter.npv >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          ${iter.npv.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {iter.derivative.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {iter.adjustment >= 0 ? "+" : ""}
                          {(iter.adjustment * 100).toFixed(4)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {iter.converged ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {t("iterations.converged")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            {t("iterations.iterating")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Iteration Details Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>{t("details.title")}</CardTitle>
            <CardDescription>{t("details.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {tirIterations.slice(0, 4).map((iter) => (
                <AccordionItem
                  key={iter.iteration}
                  value={`iter-${iter.iteration}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        {t("details.iterationLabel", {
                          iteration: iter.iteration,
                        })}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        r = {(iter.rate * 100).toFixed(2)}% → NPV = $
                        {iter.npv.toLocaleString()}
                      </span>
                      {iter.converged && (
                        <Badge className="bg-success/10 text-success">
                          {t("details.final")}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium">
                            {t("details.step1")}
                          </p>
                          <div className="mt-2 rounded bg-background p-2 font-mono text-sm">
                            f({(iter.rate * 100).toFixed(2)}%) = $
                            {iter.npv.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {t("details.step2")}
                          </p>
                          <div className="mt-2 rounded bg-background p-2 font-mono text-sm">
                            f&apos;({(iter.rate * 100).toFixed(2)}%) ={" "}
                            {iter.derivative.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t("details.step3")}
                        </p>
                        <div className="mt-2 rounded bg-background p-3">
                          <p className="font-mono text-sm">
                            r<sub>new</sub> = r<sub>old</sub> - f(r) /
                            f&apos;(r)
                          </p>
                          <p className="mt-2 font-mono text-sm">
                            r<sub>new</sub> = {(iter.rate * 100).toFixed(4)}% -
                            ({iter.npv.toLocaleString()} /{" "}
                            {iter.derivative.toLocaleString()})
                          </p>
                          <p className="mt-2 font-mono text-sm text-primary">
                            r<sub>new</sub> ={" "}
                            {((iter.rate + iter.adjustment) * 100).toFixed(4)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {Math.abs(iter.npv) < 100 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm text-success">
                              {t("details.converged")}
                            </span>
                          </>
                        ) : (
                          <>
                            {iter.adjustment > 0 ? (
                              <TrendingUp className="h-4 w-4 text-primary" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-primary" />
                            )}
                            <span className="text-sm text-muted-foreground">
                              {t("details.adjustment", {
                                direction:
                                  iter.adjustment > 0
                                    ? t("details.increased")
                                    : t("details.decreased"),
                                value: Math.abs(iter.adjustment * 100).toFixed(
                                  4,
                                ),
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Final Interpretation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("final.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <h4 className="font-semibold text-success">
                  IRR = {formatRatePercent(selectedProject?.results?.irr)}{" "}
                  {">"} TMAR ={" "}
                  {formatRatePercent(selectedProject?.results?.tmar)}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("final.description", {
                    irr: formatRatePercent(selectedProject?.results?.irr),
                    tmar: formatRatePercent(selectedProject?.results?.tmar),
                  })}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("final.margin", {
                    margin: (
                      spreadPercent
                    ).toFixed(1),
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
