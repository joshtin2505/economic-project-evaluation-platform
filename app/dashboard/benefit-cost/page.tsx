"use client"

import { useTranslations } from "next-intl"
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
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Scale,
  Info,
  Download,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { mockProjects, benefitCostData } from "@/lib/mock-data"
import { useState } from "react"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
]

export default function BenefitCostPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const project = mockProjects.find((p) => p.id === selectedProject) || mockProjects[0]
  const t = useTranslations("dashboard.benefitCost")

  const totalBenefitsPV = benefitCostData.benefits.reduce((sum, b) => sum + b.pvAmount, 0)
  const totalCostsPV = benefitCostData.costs.reduce((sum, c) => sum + c.pvAmount, 0)
  const bcRatio = totalBenefitsPV / totalCostsPV
  const netBenefit = totalBenefitsPV - totalCostsPV

  const benefitsPieData = benefitCostData.benefits.map((b) => ({
    name: b.category,
    value: b.pvAmount,
  }))

  const costsPieData = benefitCostData.costs.map((c) => ({
    name: c.category,
    value: c.pvAmount,
  }))

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
              <SelectTrigger className="w-[240px]">
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
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t("formulaTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("formulaDescription")}</p>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-background px-6 py-3">
              <p className="font-mono text-lg">{t("formula")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("summary.ratio")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${bcRatio >= 1 ? "text-success" : "text-destructive"}`}>
                {bcRatio.toFixed(2)}
              </p>
              <Badge
                className={
                  bcRatio >= 1
                    ? "mt-2 bg-success/10 text-success hover:bg-success/20"
                    : "mt-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
                }
              >
                {bcRatio >= 1 ? t("summary.feasible") : t("summary.notFeasible")}
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
              <p className={`text-2xl font-bold ${netBenefit >= 0 ? "text-success" : "text-destructive"}`}>
                ${netBenefit.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                {t("summary.netBenefitHelp")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ratio Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>{t("comparison.title")}</CardTitle>
            <CardDescription>{t("comparison.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress bars */}
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{t("comparison.benefits")}</span>
                    <span className="text-success">${totalBenefitsPV.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={100}
                    className="h-4 bg-muted"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{t("comparison.costs")}</span>
                    <span className="text-destructive">${totalCostsPV.toLocaleString()}</span>
                  </div>
                  <Progress
                    value={(totalCostsPV / totalBenefitsPV) * 100}
                    className="h-4 bg-muted"
                  />
                </div>
              </div>

              {/* Ratio indicator */}
              <div className="flex items-center justify-center rounded-lg bg-muted/50 p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t("comparison.ratioPrefix")}</p>
                  <p className="mt-2 text-4xl font-bold text-primary">
                    ${bcRatio.toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("comparison.ratioSuffix")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables and Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Benefits Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("tables.benefits.title")}</CardTitle>
                  <CardDescription>{t("tables.benefits.description")}</CardDescription>
                </div>
                <Badge variant="outline" className="text-success">
                  {t("tables.total", { value: totalBenefitsPV.toLocaleString() })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tables.category")}</TableHead>
                    <TableHead className="text-right">{t("tables.nominal")}</TableHead>
                    <TableHead className="text-right">{t("tables.pv")}</TableHead>
                    <TableHead className="text-right">{t("tables.percent")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefitCostData.benefits.map((benefit, index) => (
                    <TableRow key={benefit.category}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {benefit.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${benefit.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success">
                        ${benefit.pvAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {((benefit.pvAmount / totalBenefitsPV) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pie Chart */}
              <div className="mt-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={benefitsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {benefitsPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "PV"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Costs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("tables.costs.title")}</CardTitle>
                  <CardDescription>{t("tables.costs.description")}</CardDescription>
                </div>
                <Badge variant="outline" className="text-destructive">
                  {t("tables.total", { value: totalCostsPV.toLocaleString() })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tables.category")}</TableHead>
                    <TableHead className="text-right">{t("tables.nominal")}</TableHead>
                    <TableHead className="text-right">{t("tables.pv")}</TableHead>
                    <TableHead className="text-right">{t("tables.percent")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benefitCostData.costs.map((cost, index) => (
                    <TableRow key={cost.category}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {cost.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${cost.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        ${cost.pvAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {((cost.pvAmount / totalCostsPV) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pie Chart */}
              <div className="mt-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {costsPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "PV"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feasibility Indicator */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <div>
                <h4 className="font-semibold text-success">{t("feasibility.title")}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{t("feasibility.description", { ratio: bcRatio.toFixed(2) })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
