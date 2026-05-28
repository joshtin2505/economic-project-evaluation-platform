"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { TrendingUp, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations("landing.nav")

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">EconoLab</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("features")}
          </Link>
          <Link href="#indicators" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("indicators")}
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t("howItWorks")}
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth">{t("login")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth">{t("startFree")}</Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "absolute left-0 right-0 top-16 border-b border-border bg-background p-4 md:hidden",
          mobileMenuOpen ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-4">
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("features")}
          </Link>
          <Link
            href="#indicators"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("indicators")}
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t("howItWorks")}
          </Link>
          <div className="flex items-center justify-between pt-2">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href="/auth">{t("login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/auth">{t("startFree")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
