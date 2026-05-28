"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Percent, Info, TrendingUp, Shield, Flame } from "lucide-react"
import { useState } from "react"

export default function TMARPage() {
  const [riskFreeRate, setRiskFreeRate] = useState(4)
  const [inflation, setInflation] = useState(3)
  const [riskPremium, setRiskPremium] = useState(5)
  const t = useTranslations("dashboard.tmar")

  const tmar = riskFreeRate + inflation + riskPremium

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Formula Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
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

        {/* TMAR Result */}
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-muted-foreground">{t("calculated")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-6xl font-bold text-primary">{tmar.toFixed(1)}%</p>
            <p className="mt-4 text-sm text-muted-foreground">{t("rule")}</p>
            <Badge className="mt-4">
              {tmar < 10 ? t("thresholds.low") : tmar < 15 ? t("thresholds.medium") : t("thresholds.high")}
            </Badge>
          </CardContent>
        </Card>

        {/* Component Sliders */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Risk-Free Rate */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-chart-2" />
                  {t("components.riskFree.title")}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t("components.riskFree.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>{t("components.riskFree.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="riskFreeRate">{t("components.rate")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="riskFreeRate"
                    type="number"
                    value={riskFreeRate}
                    onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                    className="w-20 text-right"
                    step={0.5}
                    min={0}
                    max={20}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[riskFreeRate]}
                onValueChange={(value) => setRiskFreeRate(value[0])}
                max={20}
                step={0.5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("components.riskFree.tip")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inflation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-chart-3" />
                  {t("components.inflation.title")}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t("components.inflation.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>{t("components.inflation.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="inflation">{t("components.rate")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="inflation"
                    type="number"
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-20 text-right"
                    step={0.5}
                    min={0}
                    max={20}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[inflation]}
                onValueChange={(value) => setInflation(value[0])}
                max={20}
                step={0.5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("components.inflation.tip")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Premium */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  {t("components.riskPremium.title")}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t("components.riskPremium.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>{t("components.riskPremium.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="riskPremium">{t("components.rate")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="riskPremium"
                    type="number"
                    value={riskPremium}
                    onChange={(e) => setRiskPremium(Number(e.target.value))}
                    className="w-20 text-right"
                    step={0.5}
                    min={0}
                    max={30}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                value={[riskPremium]}
                onValueChange={(value) => setRiskPremium(value[0])}
                max={30}
                step={0.5}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{t("components.riskPremium.tip")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TMAR Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t("breakdown.title")}</CardTitle>
            <CardDescription>{t("breakdown.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{t("breakdown.riskFree")}</div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded bg-chart-2"
                    style={{ width: `${(riskFreeRate / tmar) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-mono">{riskFreeRate}%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{t("breakdown.inflation")}</div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded bg-chart-3"
                    style={{ width: `${(inflation / tmar) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-mono">{inflation}%</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{t("breakdown.riskPremium")}</div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded bg-chart-1"
                    style={{ width: `${(riskPremium / tmar) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-mono">{riskPremium}%</div>
              </div>
              <div className="flex items-center gap-4 border-t pt-4">
                <div className="w-32 text-sm font-bold">{t("breakdown.total")}</div>
                <div className="flex-1">
                  <div className="h-8 rounded bg-primary" style={{ width: "100%" }} />
                </div>
                <div className="w-16 text-right font-mono font-bold">{tmar}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>{t("rules.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <h4 className="font-semibold text-success">{t("rules.accept.title")}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{t("rules.accept.irr", { tmar })}</li>
                  <li>{t("rules.accept.npv")}</li>
                  <li>{t("rules.accept.bc")}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h4 className="font-semibold text-destructive">{t("rules.reject.title")}</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>{t("rules.reject.irr", { tmar })}</li>
                  <li>{t("rules.reject.npv")}</li>
                  <li>{t("rules.reject.bc")}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
