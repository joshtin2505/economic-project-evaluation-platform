"use client"

import { useState } from "react"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Calculator,
  Info,
  Download,
  CheckCircle2,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react"
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts"
import { mockProjects, mockTIRIterations, npvVsRateData } from "@/lib/mock-data"

export default function TIRAnalysisPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const project = mockProjects.find((p) => p.id === selectedProject) || mockProjects[0]

  // Convergence chart data
  const convergenceData = mockTIRIterations.map((iter) => ({
    iteration: iter.iteration,
    rate: (iter.rate * 100).toFixed(2),
    npv: iter.npv,
  }))

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TIR Analysis</h1>
            <p className="text-muted-foreground">
              Internal Rate of Return with Newton-Raphson iterative calculation
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
          <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">IRR Definition (Tasa Interna de Retorno)</h3>
                <p className="text-sm text-muted-foreground">
                  The rate that makes NPV equal to zero, found iteratively
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
                <p className="font-mono text-lg">NPV(IRR) = 0</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
                <p className="font-mono text-sm">
                  r<sub>n+1</sub> = r<sub>n</sub> - f(r<sub>n</sub>) / f&apos;(r<sub>n</sub>)
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Newton-Raphson Method</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Internal Rate of Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {((project.results?.irr || 0) * 100).toFixed(1)}%
              </p>
              <Badge
                className={
                  project.results && project.results.irr > project.results.tmar
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {project.results && project.results.irr > project.results.tmar
                  ? "IRR > TMAR: Accept"
                  : "IRR < TMAR: Reject"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TMAR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {((project.results?.tmar || 0) * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Minimum acceptable rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IRR - TMAR Spread
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  project.results && project.results.irr > project.results.tmar
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {project.results
                  ? `${project.results.irr > project.results.tmar ? "+" : ""}${(
                      (project.results.irr - project.results.tmar) *
                      100
                    ).toFixed(1)}%`
                  : "N/A"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Safety margin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Iterations to Converge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mockTIRIterations.length}</p>
              <div className="mt-2 flex items-center gap-1">
                <Zap className="h-3 w-3 text-accent" />
                <p className="text-xs text-muted-foreground">Newton-Raphson method</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* NPV vs Interest Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>NPV vs Discount Rate</CardTitle>
              <CardDescription>
                IRR is where the curve crosses zero
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={npvVsRateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "NPV"]}
                      labelFormatter={(label) => `Rate: ${label}%`}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <ReferenceLine
                      x={18.7}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      label={{
                        value: "IRR = 18.7%",
                        position: "top",
                        fill: "hsl(var(--primary))",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="npv"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1) / 0.2)"
                      strokeWidth={2}
                      name="NPV"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Convergence Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Convergence Path</CardTitle>
              <CardDescription>
                NPV approaching zero through iterations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convergenceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="iteration"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Iteration", position: "bottom", offset: -5 }}
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
                      formatter={(value: number, name: string) => {
                        if (name === "npv") return [`$${value.toLocaleString()}`, "NPV"]
                        return [value, name]
                      }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--success))" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="npv"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                      name="npv"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Newton-Raphson Iterations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Newton-Raphson Iteration Table
            </CardTitle>
            <CardDescription>
              Step-by-step convergence to the Internal Rate of Return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Iteration</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Rate (r)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current estimate of IRR</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        NPV at r
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>f(r) = NPV calculated at current rate</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Derivative
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>f&apos;(r) = Slope of NPV function</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTIRIterations.map((iter) => (
                    <TableRow
                      key={iter.iteration}
                      className={iter.converged ? "bg-success/5" : ""}
                    >
                      <TableCell className="font-medium">{iter.iteration}</TableCell>
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
                            Converged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Iterating...
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
            <CardTitle>Detailed Iteration Steps</CardTitle>
            <CardDescription>
              Expand each iteration to see the mathematical operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {mockTIRIterations.slice(0, 4).map((iter) => (
                <AccordionItem key={iter.iteration} value={`iter-${iter.iteration}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        Iteration {iter.iteration}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        r = {(iter.rate * 100).toFixed(2)}% → NPV = ${iter.npv.toLocaleString()}
                      </span>
                      {iter.converged && (
                        <Badge className="bg-success/10 text-success">Final</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium">Step 1: Calculate NPV at current rate</p>
                          <div className="mt-2 rounded bg-background p-2 font-mono text-sm">
                            f({(iter.rate * 100).toFixed(2)}%) = ${iter.npv.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Step 2: Calculate derivative</p>
                          <div className="mt-2 rounded bg-background p-2 font-mono text-sm">
                            f&apos;({(iter.rate * 100).toFixed(2)}%) = {iter.derivative.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Step 3: Apply Newton-Raphson formula</p>
                        <div className="mt-2 rounded bg-background p-3">
                          <p className="font-mono text-sm">
                            r<sub>new</sub> = r<sub>old</sub> - f(r) / f&apos;(r)
                          </p>
                          <p className="mt-2 font-mono text-sm">
                            r<sub>new</sub> = {(iter.rate * 100).toFixed(4)}% - (
                            {iter.npv.toLocaleString()} / {iter.derivative.toLocaleString()})
                          </p>
                          <p className="mt-2 font-mono text-sm text-primary">
                            r<sub>new</sub> = {((iter.rate + iter.adjustment) * 100).toFixed(4)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {Math.abs(iter.npv) < 100 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-sm text-success">
                              Convergence criterion met: |NPV| {"<"} tolerance
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
                              Rate {iter.adjustment > 0 ? "increased" : "decreased"} by{" "}
                              {Math.abs(iter.adjustment * 100).toFixed(4)}%
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
            <CardTitle>Final Interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <h4 className="font-semibold text-success">
                  IRR = {((project.results?.irr || 0) * 100).toFixed(1)}% {">"} TMAR ={" "}
                  {((project.results?.tmar || 0) * 100).toFixed(1)}%
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  The Internal Rate of Return of {((project.results?.irr || 0) * 100).toFixed(1)}% 
                  exceeds the minimum acceptable rate of return (TMAR) of{" "}
                  {((project.results?.tmar || 0) * 100).toFixed(1)}%. This indicates the project 
                  generates sufficient returns to justify the investment risk. The project should 
                  be <strong>accepted</strong>.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The IRR provides a safety margin of{" "}
                  <span className="font-semibold text-success">
                    {((project.results?.irr || 0) * 100 - (project.results?.tmar || 0) * 100).toFixed(1)}%
                  </span>{" "}
                  above the required return, offering protection against estimation errors and 
                  unforeseen circumstances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
