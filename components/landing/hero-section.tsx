"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, BarChart3, Calculator, LineChart } from "lucide-react"

export function HeroSection() {
  const t = useTranslations("landing.hero")
  const tCommon = useTranslations("common")

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-foreground animate-pulse" />
            <span className="text-sm font-medium text-primary">{t("badge")}</span>
          </div>

          {/* Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="group w-full sm:w-auto">
              <Link href={`/dashboard/projects/new`}>
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/dashboard`}>{t("demo")}</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { icon: TrendingUp, label: t("previewStats.npvLabel"), value: t("previewStats.npvValue") },
              { icon: Calculator, label: t("previewStats.irrLabel"), value: t("previewStats.irrValue") },
              { icon: BarChart3, label: t("previewStats.cashFlowLabel"), value: t("previewStats.cashFlowValue") },
              { icon: LineChart, label: t("previewStats.reportsLabel"), value: t("previewStats.reportsValue") },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mt-20">
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-warning/60" />
                <span className="h-3 w-3 rounded-full bg-success/60" />
              </div>
                <span className="ml-2 text-xs text-muted-foreground">{tCommon("appName")} {tCommon("dashboard")}</span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {/* Mock KPI Cards */}
              {[
                  { label: t("previewCards.npvLabel"), value: "$245,830", change: "+12.5%", positive: true },
                  { label: t("previewCards.irrLabel"), value: "18.7%", change: "+2.3%", positive: true },
                  { label: t("previewCards.tmarLabel"), value: "12.0%", change: t("previewCards.tmarChange"), positive: true },
                  { label: t("previewCards.bcLabel"), value: "1.54", change: t("previewCards.bcChange"), positive: true },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border/50 bg-background p-4">
                  <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <span className={`text-xs font-medium ${kpi.positive ? "text-success" : "text-destructive"}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Mock Chart Area */}
            <div className="border-t border-border/50 p-4">
              <div className="flex h-48 items-end justify-around gap-2 rounded-lg bg-muted/30 p-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                  <div
                    key={i}
                    className="w-full max-w-8 rounded-t bg-primary/60 transition-all hover:bg-primary"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
