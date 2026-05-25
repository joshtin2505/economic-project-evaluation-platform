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
          <h1 className="text-2xl font-bold tracking-tight">Cash Flow Visualization</h1>
          <p className="text-muted-foreground">
            Track inflows, outflows, and cumulative cash position over time
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
              Total Inflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              ${totalInflows.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sum of all positive cash flows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowDown className="h-4 w-4 text-destructive" />
              Total Outflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              ${totalOutflows.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sum of all negative cash flows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Minus className="h-4 w-4" />
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netTotal >= 0 ? "text-success" : "text-destructive"}`}>
              ${netTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Inflows minus Outflows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative View</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall View</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Timeline</CardTitle>
              <CardDescription>
                Inflows and outflows for each period
              </CardDescription>
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
                  <span className="text-muted-foreground">Inflows (Revenue, Benefits)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-chart-5" />
                  <span className="text-muted-foreground">Outflows (Costs, Expenses)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative View */}
        <TabsContent value="cumulative">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Cash Flow</CardTitle>
              <CardDescription>
                Running total of cash flows over time
              </CardDescription>
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
                <h4 className="font-medium">Payback Analysis</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  The cumulative cash flow crosses from negative to positive between 
                  <span className="font-semibold"> Year 5 and Year 6</span>, indicating a 
                  payback period of approximately 5.2 years. This means the initial investment 
                  will be recovered in just over 5 years.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waterfall View */}
        <TabsContent value="waterfall">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Diagram</CardTitle>
              <CardDescription>
                Visual representation of cash movement patterns
              </CardDescription>
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
                  <p className="text-sm text-muted-foreground">Initial Investment</p>
                  <p className="mt-1 text-xl font-bold text-destructive">
                    -${project.initialInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Operating Cash Flows</p>
                  <p className="mt-1 text-xl font-bold text-success">
                    +${(totalInflows - (totalOutflows - project.initialInvestment)).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">Final Position</p>
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
          <CardTitle>Period Details</CardTitle>
          <CardDescription>
            Detailed breakdown of cash flows by period
          </CardDescription>
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
                    {cf.netFlow >= 0 ? "Net +" : "Net -"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inflow:</span>
                    <span className="font-mono text-success">
                      +${cf.inflow.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outflow:</span>
                    <span className="font-mono text-destructive">
                      {cf.outflow === 0 ? "$0" : `-$${Math.abs(cf.outflow).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="border-t pt-1">
                    <div className="flex justify-between font-medium">
                      <span>Net:</span>
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
