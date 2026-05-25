import { LandingNav } from "@/components/landing/landing-nav"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { IndicatorsSection } from "@/components/landing/indicators-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { CTASection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function RootPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <IndicatorsSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
