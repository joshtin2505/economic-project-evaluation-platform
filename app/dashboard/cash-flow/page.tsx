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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart,
  Line,
} from "recharts"
import { mockProjects, cashFlowTimelineData } from "@/lib/mock-data"
import { useState } from "react"

export default function CashFlowPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const project = mockProjects.find((p) => p.id === selectedProject) || mockProjects[0]
  const t = useTranslations("dashboard.cashFlowPage")

  // Calculate cumulative cash flow
  const cumulativeData = cashFlowTimelineData.map((cf, index) => {
    const netFlow = cf.inflow + cf.outflow // outflow is already negative
    const previousCumulative =
      index === 0
        ? 0
        : cashFlowTimelineData.slice(0, index).reduce((sum, prev) => sum + prev.inflow + prev.outflow, 0)
    return {
      ...cf,
      netFlow,
      cumulative: previousCumulative + netFlow,
    }
  })

  const totalInflows = cashFlowTimelineData.reduce((sum, cf) => sum + cf.inflow, 0)
  const totalOutflows = Math.abs(cashFlowTimelineData.reduce((sum, cf) => sum + cf.outflow, 0))
  const netTotal = totalInflows - totalOutflows

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
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowUp className="h-4 w-4 text-success" />
              {t("summary.inflows")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              ${totalInflows.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("summary.inflowsHelp")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowDown className="h-4 w-4 text-destructive" />
              {t("summary.outflows")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              ${totalOutflows.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("summary.outflowsHelp")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Minus className="h-4 w-4" />
              {t("summary.net")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netTotal >= 0 ? "text-success" : "text-destructive"}`}>
              ${netTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("summary.netHelp")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
          <TabsTrigger value="cumulative">{t("tabs.cumulative")}</TabsTrigger>
          <TabsTrigger value="waterfall">{t("tabs.waterfall")}</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>{t("timeline.title")}</CardTitle>
              <CardDescription>{t("timeline.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowTimelineData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${Math.abs(value).toLocaleString()}`, ""]}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                    <Bar
                      dataKey="inflow"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      name="Inflows"
                    />
                    <Bar
                      dataKey="outflow"
                      fill="hsl(var(--chart-5))"
                      radius={[0, 0, 4, 4]}
                      name="Outflows"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-chart-2" />
                  <span className="text-muted-foreground">{t("timeline.legend.inflows")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-chart-5" />
                  <span className="text-muted-foreground">{t("timeline.legend.outflows")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative View */}
        <TabsContent value="cumulative">
          <Card>
            <CardHeader>
              <CardTitle>{t("cumulative.title")}</CardTitle>
              <CardDescription>{t("cumulative.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar
                      dataKey="netFlow"
                      fill="hsl(var(--chart-1) / 0.5)"
                      radius={[4, 4, 0, 0]}
                      name="Net Flow"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      name="Cumulative"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Payback Analysis */}
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium">{t("cumulative.payback.title")}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{t("cumulative.payback.description")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waterfall View */}
        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle>{t("waterfall.title")}</CardTitle>
              <CardDescription>{t("waterfall.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Timeline Visualization */}
              <div className="relative py-8">
                {/* Central timeline */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border" />

                <div className="relative flex justify-between">
                  {cumulativeData.slice(0, 8).map((cf, index) => {
                    const isPositive = cf.netFlow >= 0
                    const height = Math.min(Math.abs(cf.netFlow) / 5000, 100)
                    return (
                      <div key={cf.period} className="flex flex-col items-center">
                        {/* Bar above or below line */}
                        <div
                          className={`relative flex items-end justify-center ${
                            isPositive ? "mb-2" : "mt-2"
                          }`}
                          style={{
                            height: "100px",
                            order: isPositive ? 0 : 2,
                          }}
                        >
                          <div
                            className={`w-8 rounded transition-all hover:opacity-80 ${
                              isPositive ? "bg-success" : "bg-destructive"
                            }`}
                            style={{
                              height: `${height}px`,
                              minHeight: "8px",
                            }}
                          />
                        </div>

                        {/* Period marker */}
                        <div
                          className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                          style={{ order: 1 }}
                        >
                          {index}
                        </div>

                        {/* Value label */}
                        <div
                          className="mt-2 text-center"
                          style={{ order: isPositive ? 2 : 0 }}
                        >
                          <p
                            className={`text-xs font-medium ${
                              isPositive ? "text-success" : "text-destructive"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {(cf.netFlow / 1000).toFixed(0)}k
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("waterfall.summary.initialInvestment")}</p>
                  <p className="mt-1 text-xl font-bold text-destructive">
                    -${project.initialInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("waterfall.summary.operatingCashFlows")}</p>
                  <p className="mt-1 text-xl font-bold text-success">
                    +${(totalInflows - (totalOutflows - project.initialInvestment)).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("waterfall.summary.finalPosition")}</p>
                  <p className={`mt-1 text-xl font-bold ${netTotal >= 0 ? "text-success" : "text-destructive"}`}>
                    ${netTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cash Flow Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("details.title")}</CardTitle>
          <CardDescription>{t("details.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cumulativeData.map((cf) => (
              <div key={cf.period} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cf.period}</span>
                  <Badge
                    variant="outline"
                    className={cf.netFlow >= 0 ? "text-success" : "text-destructive"}
                  >
                    {cf.netFlow >= 0 ? t("details.netPositive") : t("details.netNegative")}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.inflow")}</span>
                    <span className="font-mono text-success">
                      +${cf.inflow.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("details.outflow")}</span>
                    <span className="font-mono text-destructive">
                      {cf.outflow === 0 ? "$0" : `-$${Math.abs(cf.outflow).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t pt-1">
                    <div className="flex justify-between font-medium">
                      <span>{t("details.net")}</span>
                      <span
                        className={`font-mono ${
                          cf.netFlow >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ${cf.netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
