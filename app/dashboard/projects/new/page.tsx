"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Trash2,
  Info,
  Calculator,
  TrendingUp,
  Save,
  ArrowRight,
} from "lucide-react"

interface CashFlowRow {
  period: number
  inflow: number
  outflow: number
}

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [initialInvestment, setInitialInvestment] = useState<number>(500000)
  const [periods, setPeriods] = useState<number>(5)
  const [discountRate, setDiscountRate] = useState<number>(12)
  const [inflation, setInflation] = useState<number>(3)
  const [riskPremium, setRiskPremium] = useState<number>(2)

  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([
    { period: 1, inflow: 100000, outflow: 20000 },
    { period: 2, inflow: 120000, outflow: 22000 },
    { period: 3, inflow: 140000, outflow: 24000 },
    { period: 4, inflow: 160000, outflow: 26000 },
    { period: 5, inflow: 180000, outflow: 28000 },
  ])

  const addPeriod = () => {
    const newPeriod = cashFlows.length + 1
    setCashFlows([...cashFlows, { period: newPeriod, inflow: 0, outflow: 0 }])
    setPeriods(newPeriod)
  }

  const removePeriod = (index: number) => {
    if (cashFlows.length > 1) {
      const newFlows = cashFlows.filter((_, i) => i !== index).map((cf, i) => ({
        ...cf,
        period: i + 1,
      }))
      setCashFlows(newFlows)
      setPeriods(newFlows.length)
    }
  }

  const updateCashFlow = (index: number, field: "inflow" | "outflow", value: number) => {
    const newFlows = [...cashFlows]
    newFlows[index][field] = value
    setCashFlows(newFlows)
  }

  // Real-time calculations preview
  const calculations = useMemo(() => {
    const rate = discountRate / 100
    let npv = -initialInvestment
    let totalInflows = 0
    let totalOutflows = initialInvestment

    cashFlows.forEach((cf, index) => {
      const netFlow = cf.inflow - cf.outflow
      const discountFactor = Math.pow(1 + rate, index + 1)
      npv += netFlow / discountFactor
      totalInflows += cf.inflow
      totalOutflows += cf.outflow
    })

    // Simple IRR approximation using bisection
    let irr = 0
    let low = -0.5
    let high = 1.0
    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2
      let testNpv = -initialInvestment
      cashFlows.forEach((cf, index) => {
        testNpv += (cf.inflow - cf.outflow) / Math.pow(1 + mid, index + 1)
      })
      if (testNpv > 0) {
        low = mid
      } else {
        high = mid
      }
      irr = mid
    }

    const tmar = (discountRate + inflation + riskPremium) / 100
    const pvBenefits = cashFlows.reduce((sum, cf, index) => {
      return sum + cf.inflow / Math.pow(1 + rate, index + 1)
    }, 0)
    const pvCosts = initialInvestment + cashFlows.reduce((sum, cf, index) => {
      return sum + cf.outflow / Math.pow(1 + rate, index + 1)
    }, 0)
    const bcRatio = pvBenefits / pvCosts

    return {
      npv: Math.round(npv),
      irr: (irr * 100).toFixed(2),
      tmar: (tmar * 100).toFixed(1),
      bcRatio: bcRatio.toFixed(2),
      totalInflows,
      totalOutflows,
      isViable: npv > 0 && irr * 100 > tmar * 100 && bcRatio > 1,
    }
  }, [cashFlows, initialInvestment, discountRate, inflation, riskPremium])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Enter your project details and cash flow projections for economic analysis.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Basic details about your investment project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., Solar Panel Installation"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialInvestment" className="flex items-center gap-1">
                      Initial Investment ($)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The upfront cost required to start the project</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="initialInvestment"
                      type="number"
                      value={initialInvestment}
                      onChange={(e) => setInitialInvestment(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Parameters</CardTitle>
                <CardDescription>Configure discount rates and economic factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountRate" className="flex items-center gap-1">
                      Discount Rate (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rate used to discount future cash flows to present value</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="discountRate"
                      type="number"
                      step="0.1"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inflation" className="flex items-center gap-1">
                      Inflation (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expected annual inflation rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="inflation"
                      type="number"
                      step="0.1"
                      value={inflation}
                      onChange={(e) => setInflation(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskPremium" className="flex items-center gap-1">
                      Risk Premium (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Additional return required to compensate for project risk</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="riskPremium"
                      type="number"
                      step="0.1"
                      value={riskPremium}
                      onChange={(e) => setRiskPremium(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periods">Number of Periods</Label>
                    <Input
                      id="periods"
                      type="number"
                      value={periods}
                      onChange={(e) => {
                        const newPeriods = Number(e.target.value)
                        setPeriods(newPeriods)
                        // Adjust cash flows array
                        if (newPeriods > cashFlows.length) {
                          const newFlows = [...cashFlows]
                          for (let i = cashFlows.length; i < newPeriods; i++) {
                            newFlows.push({ period: i + 1, inflow: 0, outflow: 0 })
                          }
                          setCashFlows(newFlows)
                        } else if (newPeriods < cashFlows.length) {
                          setCashFlows(cashFlows.slice(0, newPeriods))
                        }
                      }}
                      min={1}
                      max={30}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flows Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Cash Flows by Period</CardTitle>
                  <CardDescription>Enter expected inflows and outflows for each year</CardDescription>
                </div>
                <Button onClick={addPeriod} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Period
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Period</TableHead>
                        <TableHead>Inflows ($)</TableHead>
                        <TableHead>Outflows ($)</TableHead>
                        <TableHead>Net Flow ($)</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Initial Investment Row */}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-medium">Year 0</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">-</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-destructive">
                            ${initialInvestment.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium text-destructive">
                            -${initialInvestment.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {/* Cash Flow Rows */}
                      {cashFlows.map((cf, index) => (
                        <TableRow key={cf.period}>
                          <TableCell className="font-medium">Year {cf.period}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={cf.inflow}
                              onChange={(e) => updateCashFlow(index, "inflow", Number(e.target.value))}
                              className="h-8 w-28 font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={cf.outflow}
                              onChange={(e) => updateCashFlow(index, "outflow", Number(e.target.value))}
                              className="h-8 w-28 font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono font-medium ${
                                cf.inflow - cf.outflow >= 0 ? "text-success" : "text-destructive"
                              }`}
                            >
                              {cf.inflow - cf.outflow >= 0 ? "+" : ""}
                              ${(cf.inflow - cf.outflow).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removePeriod(index)}
                              disabled={cashFlows.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="mt-4 flex items-center justify-end gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Inflows: </span>
                    <span className="font-mono font-medium text-success">
                      ${calculations.totalInflows.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Outflows: </span>
                    <span className="font-mono font-medium text-destructive">
                      ${calculations.totalOutflows.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Indicators
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calculations Preview Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Real-time Preview</CardTitle>
                  <Badge
                    variant={calculations.isViable ? "default" : "destructive"}
                    className={
                      calculations.isViable
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }
                  >
                    {calculations.isViable ? "Viable" : "Not Viable"}
                  </Badge>
                </div>
                <CardDescription>Estimated indicators based on current inputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NPV */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">NPV (VPN)</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Net Present Value: Sum of discounted cash flows</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      calculations.npv >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    ${calculations.npv.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {calculations.npv >= 0 ? "Project adds value" : "Project destroys value"}
                  </p>
                </div>

                <Separator />

                {/* IRR */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">IRR (TIR)</span>
                    <p className="text-lg font-semibold">{calculations.irr}%</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      Number(calculations.irr) > Number(calculations.tmar)
                        ? "border-success/50 text-success"
                        : "border-destructive/50 text-destructive"
                    }
                  >
                    {Number(calculations.irr) > Number(calculations.tmar)
                      ? "Above TMAR"
                      : "Below TMAR"}
                  </Badge>
                </div>

                {/* TMAR */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">TMAR</span>
                    <p className="text-lg font-semibold">{calculations.tmar}%</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    r + π + β
                  </span>
                </div>

                {/* B/C Ratio */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">B/C Ratio</span>
                    <p className="text-lg font-semibold">{calculations.bcRatio}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      Number(calculations.bcRatio) >= 1
                        ? "border-success/50 text-success"
                        : "border-destructive/50 text-destructive"
                    }
                  >
                    {Number(calculations.bcRatio) >= 1 ? "B/C ≥ 1" : "B/C < 1"}
                  </Badge>
                </div>

                <Separator />

                {/* Formula Reference */}
                <div className="rounded-lg border border-border/50 bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">NPV Formula</p>
                  <p className="mt-1 font-mono text-xs">
                    NPV = -I₀ + Σ CFₜ/(1+r)ᵗ
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
