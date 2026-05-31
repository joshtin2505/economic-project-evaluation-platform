"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Info, TrendingUp, Check } from "lucide-react"
import ProjectSaveControls from "@/components/ui/project-save-controls"
import type { FundingSource, TmarMethod } from "@/lib/utils/tmar"

interface CashFlowRow {
  period: number
  inflow: number
  outflow: number
}

interface Props {
  t: any
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
  tmarMethod: TmarMethod
  setTmarMethod: (v: TmarMethod) => void
  useTmarAsDiscountRate: boolean
  setUseTmarAsDiscountRate: (v: boolean) => void
  fundingSources: FundingSource[]
  updateFundingSource: (
    id: string,
    field: keyof Pick<FundingSource, "name" | "share" | "cost">,
    value: string | number,
  ) => void
  addFundingSource: () => void
  removeFundingSource: (id: string) => void
  cashFlows: CashFlowRow[]
  addPeriod: () => void
  removePeriod: (index: number) => void
  updateCashFlow: (index: number, field: "inflow" | "outflow", value: number) => void
  calculations: {
    npv: number
    irr: string
    tmar: string
    tmarMethod: TmarMethod
    fundingShareTotal: number
    bcRatio: string
    totalInflows: number
    totalOutflows: number
    effectiveDiscountRate: number
    useTmarAsDiscountRate: boolean
    isViable: boolean
  }
  isSaving: null | "draft" | "calculate"
  submitError: string | null
  onSaveDraft: () => void
  onCalculate: () => void
  salvageValue: number
  setSalvageValue: (v: number) => void
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
    tmarMethod,
    setTmarMethod,
    useTmarAsDiscountRate,
    setUseTmarAsDiscountRate,
    fundingSources,
    updateFundingSource,
    addFundingSource,
    removeFundingSource,
    cashFlows,
    addPeriod,
    removePeriod,
    updateCashFlow,
    calculations,
    isSaving,
    submitError,
    onSaveDraft,
    onCalculate,
    salvageValue,
    setSalvageValue,
  } = props

  const fundingShareValid = Math.abs(calculations.fundingShareTotal - 100) < 0.01
  const previewFormulaKey =
    calculations.tmarMethod === "mixta"
      ? "preview.tmarFormulaMixta"
      : "preview.tmarFormulaSimple"

  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setInitialInvestment(value)
                      // Auto-calculate salvage value as 20% of initial investment
                      setSalvageValue(value * 0.2)
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salvageValue" className="flex items-center gap-1">
                  {t("projectInfo.salvageValue")}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("projectInfo.salvageValueHelp")}</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="salvageValue"
                  type="number"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  {t("projectInfo.salvageValueNote", { percentage: 20, value: (initialInvestment * 0.2).toLocaleString() })}
                </p>
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

          <Card>
            <CardHeader>
              <CardTitle>{t("financial.title")}</CardTitle>
              <CardDescription>{t("financial.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountRate">{t("financial.discountRate")}</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.1"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    disabled={useTmarAsDiscountRate}
                    className={useTmarAsDiscountRate ? "bg-muted/50" : ""}
                  />
                  {useTmarAsDiscountRate && (
                    <p className="text-xs text-muted-foreground">
                      {t("financial.usingTmarAsDiscount")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periods">{t("financial.periods")}</Label>
                  <Input
                    id="periods"
                    type="number"
                    value={periods}
                    onChange={(e) => setPeriods(Number(e.target.value))}
                    min={1}
                    max={30}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useTmarAsDiscountRate"
                  checked={useTmarAsDiscountRate}
                  onCheckedChange={(checked) => setUseTmarAsDiscountRate(checked as boolean)}
                />
                <Label
                  htmlFor="useTmarAsDiscountRate"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("financial.useTmarAsDiscountRate")}
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("financial.useTmarAsDiscountRateHelp")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>{t("tmarConfig.title")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("tmarConfig.description")}
                  </p>
                </div>

                <Tabs
                  value={tmarMethod}
                  onValueChange={(value) => setTmarMethod(value as TmarMethod)}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="simple">{t("tmarConfig.simpleTab")}</TabsTrigger>
                    <TabsTrigger value="mixta">{t("tmarConfig.mixtaTab")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="simple" className="mt-4 space-y-4">
                    <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-mono text-sm">
                      {t("tmarConfig.simpleFormula")}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inflation">{t("financial.inflation")}</Label>
                        <Input
                          id="inflation"
                          type="number"
                          step="0.1"
                          value={inflation}
                          onChange={(e) => setInflation(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="riskPremium">{t("financial.riskPremium")}</Label>
                        <Input
                          id="riskPremium"
                          type="number"
                          step="0.1"
                          value={riskPremium}
                          onChange={(e) => setRiskPremium(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mixta" className="mt-4 space-y-4">
                    <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 font-mono text-sm">
                      {t("tmarConfig.mixtaFormula")}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t("tmarConfig.fundingDescription")}
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={addFundingSource}>
                        <Plus className="mr-1 h-4 w-4" />
                        {t("tmarConfig.addSource")}
                      </Button>
                    </div>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("tmarConfig.sourceName")}</TableHead>
                            <TableHead className="w-28">{t("tmarConfig.share")}</TableHead>
                            <TableHead className="w-28">{t("tmarConfig.cost")}</TableHead>
                            <TableHead className="w-28">{t("tmarConfig.weighted")}</TableHead>
                            <TableHead className="w-12" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fundingSources.map((source) => {
                            const weighted =
                              (Number(source.share) * Number(source.cost)) / 100
                            return (
                              <TableRow key={source.id}>
                                <TableCell>
                                  <Input
                                    value={source.name}
                                    onChange={(e) =>
                                      updateFundingSource(source.id, "name", e.target.value)
                                    }
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={source.share}
                                    onChange={(e) =>
                                      updateFundingSource(
                                        source.id,
                                        "share",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="h-8 font-mono"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={source.cost}
                                    onChange={(e) =>
                                      updateFundingSource(
                                        source.id,
                                        "cost",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="h-8 font-mono"
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {weighted.toFixed(2)}%
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeFundingSource(source.id)}
                                    disabled={fundingSources.length <= 1}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("tmarConfig.shareTotal")}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          fundingShareValid
                            ? "border-success/50 text-success"
                            : "border-amber-500/50 bg-amber-500/10 text-amber-100/90"
                        }
                      >
                        {calculations.fundingShareTotal.toFixed(1)}%
                      </Badge>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

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
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                        <span className="font-mono font-medium text-destructive">
                          -{initialInvestment.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    {cashFlows.map((cf, index) => (
                      <TableRow key={cf.period}>
                        <TableCell className="font-medium">
                          {t("cashFlows.year", { period: cf.period })}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={cf.inflow}
                            onChange={(e) =>
                              updateCashFlow(index, "inflow", Number(e.target.value))
                            }
                            className="h-8 w-28 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={cf.outflow}
                            onChange={(e) =>
                              updateCashFlow(index, "outflow", Number(e.target.value))
                            }
                            className="h-8 w-28 font-mono"
                          />
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-mono font-medium ${
                              cf.inflow - cf.outflow >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {cf.inflow - cf.outflow >= 0 ? "+" : ""}$
                            {(cf.inflow - cf.outflow).toLocaleString()}
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

              <div className="mt-4 flex items-center justify-end gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("cashFlows.totalInflows")}</span>
                  <span className="font-mono font-medium text-success">
                    ${calculations.totalInflows.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("cashFlows.totalOutflows")}</span>
                  <span className="font-mono font-medium text-destructive">
                    ${calculations.totalOutflows.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          <ProjectSaveControls
            isSaving={isSaving}
            onSaveDraft={onSaveDraft}
            onCalculate={onCalculate}
          />
        </div>

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
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t("preview.npv")}</span>
                </div>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    calculations.npv >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  ${calculations.npv.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {calculations.npv >= 0
                    ? t("preview.addsValue")
                    : t("preview.destroysValue")}
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.irr")}</span>
                  <p className="text-lg font-semibold">{calculations.irr}%</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    Number(calculations.irr) > calculations.effectiveDiscountRate
                      ? "border-success/50 text-success"
                      : "border-destructive/50 text-destructive"
                  }
                >
                  {Number(calculations.irr) > calculations.effectiveDiscountRate
                    ? t("preview.aboveTmar")
                    : t("preview.belowTmar")}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.tmar")}</span>
                  <p className="text-lg font-semibold">{calculations.tmar}%</p>
                  <p className="text-xs text-muted-foreground">
                    {calculations.tmarMethod === "mixta"
                      ? t("tmarConfig.mixtaTab")
                      : t("tmarConfig.simpleTab")}
                  </p>
                </div>
                <span className="max-w-32 text-right text-xs text-muted-foreground">
                  {t(previewFormulaKey)}
                </span>
              </div>

              {calculations.useTmarAsDiscountRate && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {t("preview.usingTmarAsRate")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("preview.usingTmarAsRateDesc", {
                      rate: calculations.effectiveDiscountRate.toFixed(2),
                    })}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">{t("preview.bcRatio")}</span>
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
                  {Number(calculations.bcRatio) >= 1
                    ? t("preview.bcFeasible")
                    : t("preview.bcNotFeasible")}
                </Badge>
              </div>

              <Separator />

              <div className="rounded-lg border border-border/50 bg-background p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("preview.formulaTitle")}
                </p>
                <p className="mt-1 font-mono text-xs">{t("preview.formula")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
