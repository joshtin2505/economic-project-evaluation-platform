"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Info } from "lucide-react"
import type { FundingSource, TmarMethod } from "@/lib/utils/tmar"

interface FinancialConfigCardProps {
  t: any
  discountRate: number
  setDiscountRate: (v: number) => void
  periods: number
  setPeriods: (v: number) => void
  useTmarAsDiscountRate: boolean
  setUseTmarAsDiscountRate: (v: boolean) => void
  tmarMethod: TmarMethod
  setTmarMethod: (v: TmarMethod) => void
  inflation: number
  setInflation: (v: number) => void
  riskPremium: number
  setRiskPremium: (v: number) => void
  fundingSources: FundingSource[]
  updateFundingSource: (
    id: string,
    field: keyof Pick<FundingSource, "name" | "share" | "cost">,
    value: string | number,
  ) => void
  addFundingSource: () => void
  removeFundingSource: (id: string) => void
  calculations: {
    fundingShareTotal: number
  }
  fundingShareValid: boolean
}

export function FinancialConfigCard({
  t,
  discountRate,
  setDiscountRate,
  periods,
  setPeriods,
  useTmarAsDiscountRate,
  setUseTmarAsDiscountRate,
  tmarMethod,
  setTmarMethod,
  inflation,
  setInflation,
  riskPremium,
  setRiskPremium,
  fundingSources,
  updateFundingSource,
  addFundingSource,
  removeFundingSource,
  calculations,
  fundingShareValid,
}: FinancialConfigCardProps) {
  return (
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
  )
}
