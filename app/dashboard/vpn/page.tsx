"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TrendingUp,
  Info,
  Download,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import { mockProjects, mockVPNSteps } from "@/lib/mock-data"
import { useState } from "react"

export default function VPNAnalysisPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const project = mockProjects.find((p) => p.id === selectedProject) || mockProjects[0]

  // Chart data for accumulated NPV
  const accumulatedNpvData = mockVPNSteps.map((step) => ({
    period: `Year ${step.period}`,
    npv: step.accumulatedNPV,
    discountedValue: step.discountedValue,
  }))

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VPN Analysis</h1>
            <p className="text-muted-foreground">
              Net Present Value calculation with step-by-step visualization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select project" />
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
                <h3 className="font-semibold">NPV Formula (Valor Presente Neto)</h3>
                <p className="text-sm text-muted-foreground">
                  Sum of discounted cash flows minus initial investment
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
              <p className="font-mono text-lg">
                NPV = -I₀ + Σ<sub>t=1</sub><sup>n</sup> CF<sub>t</sub> / (1 + r)<sup>t</sup>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Present Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${project.results && project.results.npv >= 0 ? "text-success" : "text-destructive"}`}>
                ${project.results?.npv.toLocaleString()}
              </p>
              <Badge
                className={
                  project.results && project.results.npv >= 0
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {project.results && project.results.npv >= 0 ? "NPV > 0: Accept" : "NPV < 0: Reject"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discount Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(project.discountRate * 100).toFixed(1)}%</p>
              <p className="mt-2 text-xs text-muted-foreground">Annual rate used for discounting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Initial Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${project.initialInvestment.toLocaleString()}</p>
              <p className="mt-2 text-xs text-muted-foreground">Upfront capital required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Analysis Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{project.periods} Years</p>
              <p className="mt-2 text-xs text-muted-foreground">Project time horizon</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Calculation Table</TabsTrigger>
            <TabsTrigger value="chart">NPV Chart</TabsTrigger>
            <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
          </TabsList>

          {/* Calculation Table */}
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Discounted Cash Flow Calculations</CardTitle>
                <CardDescription>
                  Each period&apos;s cash flow is discounted using the formula: PV = CF / (1 + r)^t
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Period</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Cash Flow (CF)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Net cash flow for the period</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Discount Factor
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>1 / (1 + r)^t</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Discounted Value
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>CF × Discount Factor</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableHead>
                        <TableHead>Accumulated NPV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockVPNSteps.map((step, index) => (
                        <TableRow
                          key={step.period}
                          className={index === mockVPNSteps.length - 1 ? "bg-muted/30" : ""}
                        >
                          <TableCell className="font-medium">
                            {step.period === 0 ? "Initial" : `Year ${step.period}`}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono ${
                                step.cashFlow >= 0 ? "text-success" : "text-destructive"
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
                                step.discountedValue >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              ${step.discountedValue.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono font-semibold ${
                                step.accumulatedNPV >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              ${step.accumulatedNPV.toLocaleString()}
                            </span>
                            {index === mockVPNSteps.length - 1 && (
                              <Badge className="ml-2 bg-primary/10 text-primary">Final NPV</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Calculation Example */}
                <div className="mt-6 rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h4 className="mb-3 font-medium">Calculation Example (Year 1)</h4>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded bg-background px-2 py-1 font-mono">
                      PV₁ = $75,000 / (1 + 0.12)¹
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded bg-background px-2 py-1 font-mono">
                      PV₁ = $75,000 / 1.12
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded bg-success/10 px-2 py-1 font-mono text-success">
                      PV₁ = $66,964
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
                <CardTitle>Accumulated NPV Over Time</CardTitle>
                <CardDescription>
                  Watch how NPV evolves as cash flows are discounted and accumulated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accumulatedNpvData}>
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
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      <Area
                        type="monotone"
                        dataKey="npv"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1) / 0.2)"
                        strokeWidth={2}
                        name="Accumulated NPV"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-chart-1" />
                    <span className="text-muted-foreground">Accumulated NPV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 border-t-2 border-dashed border-muted-foreground" />
                    <span className="text-muted-foreground">Break-even line</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interpretation */}
          <TabsContent value="interpretation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Interpretation</CardTitle>
                <CardDescription>
                  Understanding the NPV results and investment decision
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Decision Summary */}
                <div className="flex items-start gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <h4 className="font-semibold text-success">Investment Recommendation: ACCEPT</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      The project has a positive NPV of ${project.results?.npv.toLocaleString()}, indicating it will 
                      generate value above the required return rate of {(project.discountRate * 100).toFixed(1)}%.
                    </p>
                  </div>
                </div>

                {/* Key Insights */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Value Creation</h4>
                    <p className="mt-2 text-sm">
                      This project will create <span className="font-semibold text-success">
                        ${project.results?.npv.toLocaleString()}
                      </span> in present value terms above the initial investment, 
                      after accounting for the time value of money.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Break-even Analysis</h4>
                    <p className="mt-2 text-sm">
                      The accumulated NPV crosses from negative to positive between 
                      <span className="font-semibold"> Year 9 and Year 10</span>, 
                      indicating the discounted payback period.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Discount Rate Sensitivity</h4>
                    <p className="mt-2 text-sm">
                      At the current discount rate of {(project.discountRate * 100).toFixed(1)}%, 
                      the project remains profitable. The NPV would become zero at an IRR of{" "}
                      <span className="font-semibold">{((project.results?.irr || 0) * 100).toFixed(1)}%</span>.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Decision Rule</h4>
                    <p className="mt-2 text-sm">
                      Since <span className="font-mono font-semibold">NPV {">"} 0</span>, 
                      the project should be accepted. It exceeds the minimum required return 
                      and adds value to the organization.
                    </p>
                  </div>
                </div>

                {/* Formula Explanation */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-3 font-medium">Why Discount Cash Flows?</h4>
                  <p className="text-sm text-muted-foreground">
                    Money received in the future is worth less than money received today due to the 
                    time value of money. Discounting converts future cash flows to their present 
                    value equivalent, allowing for meaningful comparison of cash flows occurring 
                    at different times. The discount rate reflects the opportunity cost of capital 
                    and the risk associated with the investment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
