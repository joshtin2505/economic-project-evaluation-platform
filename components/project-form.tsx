"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Info, TrendingUp } from "lucide-react"
import ProjectSaveControls from "@/components/ui/project-save-controls"

interface CashFlowRow {
  period: number
  inflow: number
  outflow: number
}

interface Props {
  t: any
  // form state
  projectName: string
  setProjectName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  initialInvestment: number
  setInitialInvestment: (v: number) => void
  periods: number
  setPeriods: (v: number) => void
  discountRate: number
  setDiscountRate: (v: number) => void
  inflation: number
  setInflation: (v: number) => void
  riskPremium: number
  setRiskPremium: (v: number) => void
  cashFlows: CashFlowRow[]
  addPeriod: () => void
  removePeriod: (index: number) => void
  updateCashFlow: (index: number, field: "inflow" | "outflow", value: number) => void
  calculations: any
  isSaving: null | "draft" | "calculate"
  submitError: string | null
  onSaveDraft: () => void
  onCalculate: () => void
}

export default function ProjectForm(props: Props) {
  const {
    t,
    projectName,
    setProjectName,
    description,
    setDescription,
    initialInvestment,
    setInitialInvestment,
    periods,
    setPeriods,
    discountRate,
    setDiscountRate,
    inflation,
    setInflation,
    riskPremium,
    setRiskPremium,
    cashFlows,
    addPeriod,
    removePeriod,
    updateCashFlow,
    calculations,
    isSaving,
    submitError,
    onSaveDraft,
    onCalculate,
  } = props

  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("projectInfo.title")}</CardTitle>
              <CardDescription>{t("projectInfo.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="projectName">{t("projectInfo.name")}</Label>
                  <Input
                    id="projectName"
                    placeholder={t("projectInfo.namePlaceholder")}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialInvestment" className="flex items-center gap-1">
                    {t("projectInfo.initialInvestment")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("projectInfo.initialInvestmentHelp")}</p>
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
                <Label htmlFor="description">{t("projectInfo.descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("projectInfo.descriptionPlaceholder")}
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
              <CardTitle>{t("financial.title")}</CardTitle>
              <CardDescription>{t("financial.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="discountRate" className="flex items-center gap-1">
                    {t("financial.discountRate")}
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
                    {t("financial.inflation")}
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
                    {t("financial.riskPremium")}
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
                  <Label htmlFor="periods">{t("financial.periods")}</Label>
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
                        // @ts-ignore
                        // parent manages cashFlows via props update
                      } else if (newPeriods < cashFlows.length) {
                        // @ts-ignore
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
                <CardTitle>{t("cashFlows.title")}</CardTitle>
                <CardDescription>{t("cashFlows.description")}</CardDescription>
              </div>
              <Button onClick={addPeriod} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                {t("cashFlows.addPeriod")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">{t("cashFlows.period")}</TableHead>
                      <TableHead>{t("cashFlows.inflows")}</TableHead>
                      <TableHead>{t("cashFlows.outflows")}</TableHead>
                      <TableHead>{t("cashFlows.netFlow")}</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Initial Investment Row */}
                    <TableRow className="bg-muted/30">
                      <TableCell className="font-medium">{t("cashFlows.year0")}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-destructive">
                          ${initialInvestment.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium text-destructive">-{initialInvestment.toLocaleString()}</span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {/* Cash Flow Rows */}
                    {cashFlows.map((cf, index) => (
                      <TableRow key={cf.period}>
                        <TableCell className="font-medium">{t("cashFlows.year", { period: cf.period })}</TableCell>
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
                            {cf.inflow - cf.outflow >= 0 ? "+" : ""}${(cf.inflow - cf.outflow).toLocaleString()}
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
                  <span className="text-muted-foreground">{t("cashFlows.totalInflows")}</span>
                  <span className="font-mono font-medium text-success">${calculations.totalInflows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("cashFlows.totalOutflows")}</span>
                  <span className="font-mono font-medium text-destructive">${calculations.totalOutflows.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <ProjectSaveControls isSaving={isSaving} onSaveDraft={onSaveDraft} onCalculate={onCalculate} />
        </div>

        {/* Calculations Preview Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("preview.title")}</CardTitle>
                <Badge
                  variant={calculations.isViable ? "default" : "destructive"}
                  className={
                    calculations.isViable
                      ? "bg-success/10 text-success hover:bg-success/20"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }
                >
                  {calculations.isViable ? t("preview.viable") : t("preview.notViable")}
                </Badge>
              </div>
              <CardDescription>{t("preview.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NPV */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{t("preview.npv")}</span>
                  </div>
                </div>
                <p className={`mt-1 text-2xl font-bold ${calculations.npv >= 0 ? "text-success" : "text-destructive"}`}>
                  ${calculations.npv.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{calculations.npv >= 0 ? t("preview.addsValue") : t("preview.destroysValue")}</p>
              </div>

              <Separator />

              {/* IRR */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.irr")}</span>
                  <p className="text-lg font-semibold">{calculations.irr}%</p>
                </div>
                <Badge
                  variant="outline"
                  className={Number(calculations.irr) > Number(calculations.tmar) ? "border-success/50 text-success" : "border-destructive/50 text-destructive"}
                >
                  {Number(calculations.irr) > Number(calculations.tmar) ? t("preview.aboveTmar") : t("preview.belowTmar")}
                </Badge>
              </div>

              {/* TMAR */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.tmar")}</span>
                  <p className="text-lg font-semibold">{calculations.tmar}%</p>
                </div>
                <span className="text-xs text-muted-foreground">{t("preview.tmarFormula")}</span>
              </div>

              {/* B/C Ratio */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.bcRatio")}</span>
                  <p className="text-lg font-semibold">{calculations.bcRatio}</p>
                </div>
                <Badge variant="outline" className={Number(calculations.bcRatio) >= 1 ? "border-success/50 text-success" : "border-destructive/50 text-destructive"}>
                  {Number(calculations.bcRatio) >= 1 ? t("preview.bcFeasible") : t("preview.bcNotFeasible")}
                </Badge>
              </div>

              <Separator />

              {/* Formula Reference */}
              <div className="rounded-lg border border-border/50 bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">{t("preview.formulaTitle")}</p>
                <p className="mt-1 font-mono text-xs">{t("preview.formula")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
