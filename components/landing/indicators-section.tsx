"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function IndicatorsSection() {
  const t = useTranslations("landing.indicators")

  const indicators = [
    {
      acronym: t("vpn.abbr"),
      fullName: t("vpn.name"),
      formula: "VPN = Σ FCₜ / (1 + r)ᵗ",
      description: t("vpn.description"),
      interpretation: t("vpn.interpretation"),
      example: "$245,830",
    },
    {
      acronym: t("tir.abbr"),
      fullName: t("tir.name"),
      formula: "VPN(TIR) = 0",
      description: t("tir.description"),
      interpretation: t("tir.interpretation"),
      example: "18.7%",
    },
    {
      acronym: t("bc.abbr"),
      fullName: t("bc.name"),
      formula: "B/C = VP(Beneficios) / VP(Costos)",
      description: t("bc.description"),
      interpretation: t("bc.interpretation"),
      example: "1.54",
    },
    {
      acronym: t("payback.abbr"),
      fullName: t("payback.name"),
      formula: "PR = t donde Σ FC = 0",
      description: t("payback.description"),
      interpretation: t("payback.interpretation"),
      example: "3.2 años",
    },
  ]

  return (
    <section id="indicators" className="border-y border-border/50 bg-muted/30 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("title")}
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <TooltipProvider>
            {indicators.map((indicator) => (
              <Card key={indicator.acronym} className="overflow-hidden border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {indicator.acronym}
                      </Badge>
                      <CardTitle className="text-lg">{indicator.fullName}</CardTitle>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{indicator.interpretation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription className="mt-2">{indicator.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Formula</span>
                      <p className="font-mono text-sm font-medium">{indicator.formula}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-muted-foreground">Ejemplo</span>
                      <p className="text-xl font-bold text-primary">{indicator.example}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </section>
  )
}
