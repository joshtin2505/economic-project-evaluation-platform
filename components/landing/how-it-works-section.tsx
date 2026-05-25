"use client"

import { useTranslations } from "next-intl"
import { FileInput, Settings, BarChart3 } from "lucide-react"

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks")

  const steps = [
    {
      icon: FileInput,
      number: "01",
      titleKey: "step1.title",
      descriptionKey: "step1.description",
    },
    {
      icon: Settings,
      number: "02",
      titleKey: "step2.title",
      descriptionKey: "step2.description",
    },
    {
      icon: BarChart3,
      number: "03",
      titleKey: "step3.title",
      descriptionKey: "step3.description",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-32">
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

        <div className="mt-16">
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-12 left-0 right-0 hidden h-0.5 bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Icon container */}
                    <div className="relative mb-6">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border/50 bg-card shadow-lg">
                        <step.icon className="h-10 w-10 text-primary" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold">{t(step.titleKey)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(step.descriptionKey)}
                    </p>
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="my-4 flex justify-center sm:hidden">
                      <svg className="h-6 w-6 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
