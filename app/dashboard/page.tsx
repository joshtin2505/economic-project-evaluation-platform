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
  TrendingUp,
  TrendingDown,
  Calculator,
  Percent,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { mockProjects, recentCalculations, financialEvolutionData, cashFlowTimelineData } from "@/lib/mock-data"

const kpiCards = [
  {
    title: "NPV (VPN)",
    value: "$635,330",
    change: "+12.5%",
    changeType: "positive" as const,
    description: "Total portfolio NPV",
    icon: TrendingUp,
  },
  {
    title: "Avg. IRR (TIR)",
    value: "16.2%",
    change: "+2.3%",
    changeType: "positive" as const,
    description: "Average internal rate",
    icon: Calculator,
  },
  {
    title: "TMAR",
    value: "12.0%",
    change: "Base Rate",
    changeType: "neutral" as const,
    description: "Minimum acceptable rate",
    icon: Percent,
  },
  {
    title: "Avg. B/C Ratio",
    value: "1.27",
    change: "Feasible",
    changeType: "positive" as const,
    description: "Benefit/Cost ratio",
    icon: Scale,
  },
]

const notifications = [
  { id: 1, type: "success", message: "Solar Panel project analysis completed", time: "2h ago" },
  { id: 2, type: "warning", message: "Office Renovation NPV below threshold", time: "5h ago" },
  { id: 3, type: "info", message: "New Product Line draft saved", time: "1d ago" },
]

export default function DashboardPage() {
  const completedProjects = mockProjects.filter((p) => p.status === "completed").length
  const analyzingProjects = mockProjects.filter((p) => p.status === "analyzing").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your economic project portfolio and key financial indicators.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
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
                      : kpi.changeType === "negative"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {kpi.changeType === "positive" && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                  {kpi.changeType === "negative" && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>Inflows and outflows across all active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowTimelineData.slice(0, 8)}>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Bar
                    dataKey="inflow"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    name="Inflows"
                  />
                  <Bar
                    dataKey="outflow"
                    fill="hsl(var(--chart-5))"
                    radius={[4, 4, 0, 0]}
                    name="Outflows"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Financial Evolution Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>NPV Evolution</CardTitle>
            <CardDescription>Actual vs projected NPV over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="npv"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1) / 0.2)"
                    strokeWidth={2}
                    name="Actual NPV"
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedNpv"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3) / 0.1)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Projected NPV"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Calculations */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Calculations</CardTitle>
              <CardDescription>Latest economic indicator computations</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reports">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCalculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-medium">{calc.project}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{calc.indicator}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{calc.value}</TableCell>
                    <TableCell className="text-muted-foreground">{calc.date}</TableCell>
                    <TableCell>
                      {calc.status === "positive" ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Viable
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Not Viable
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent alerts and updates</CardDescription>
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
                    <p className="text-sm leading-tight">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Project Status Summary */}
            <div className="mt-6 rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium">Project Status</h4>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Completed
                  </span>
                  <span className="font-medium">{completedProjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Analyzing
                  </span>
                  <span className="font-medium">{analyzingProjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    Draft
                  </span>
                  <span className="font-medium">
                    {mockProjects.length - completedProjects - analyzingProjects}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
