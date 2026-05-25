"use client"

import { useTranslations } from "next-intl"
import { 
  Calculator, 
  LineChart, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Layers 
} from "lucide-react"

export function FeaturesSection() {
  const t = useTranslations("landing.features")

  const features = [
    {
      icon: Calculator,
      titleKey: "vpn.title",
      descriptionKey: "vpn.description",
    },
    {
      icon: TrendingUp,
      titleKey: "tir.title",
      descriptionKey: "tir.description",
    },
    {
      icon: BarChart3,
      titleKey: "bc.title",
      descriptionKey: "bc.description",
    },
    {
      icon: LineChart,
      titleKey: "cashFlow.title",
      descriptionKey: "cashFlow.description",
    },
    {
      icon: Layers,
      titleKey: "tmar.title",
      descriptionKey: "tmar.description",
    },
    {
      icon: FileText,
      titleKey: "reports.title",
      descriptionKey: "reports.description",
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32">
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

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t(feature.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
