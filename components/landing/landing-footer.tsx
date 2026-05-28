"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { TrendingUp } from "lucide-react"

export function LandingFooter() {
  const t = useTranslations("landing.footer")
  const tNav = useTranslations("landing.nav")
  const locale = useLocale()

  return (
    <footer className="border-t border-border/50 bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">EconoLab</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {tNav("features")}
            </Link>
            <Link href="#indicators" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {tNav("indicators")}
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {tNav("howItWorks")}
            </Link>
            <Link href={`/${locale}/dashboard`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {t("dashboard")}
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} EconoLab. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
