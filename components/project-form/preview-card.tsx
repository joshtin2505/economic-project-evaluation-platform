"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Check } from "lucide-react"
import type { TmarMethod } from "@/lib/utils/tmar"

interface PreviewCardProps {
  t: any
  calculations: {
    npv: number
    irr: string
    tmar: string
    tmarMethod: TmarMethod
    bcRatio: string
    effectiveDiscountRate: number
    useTmarAsDiscountRate: boolean
    isViable: boolean
  }
  previewFormulaKey: string
}

export function PreviewCard({ t, calculations, previewFormulaKey }: PreviewCardProps) {
  return (
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
            <span className="max-w-32 text-right text-xs text-muted-foreground text-wrap">
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
  )
}
