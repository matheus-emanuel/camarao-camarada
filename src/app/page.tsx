import { LandingNavbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { MethodologyBar } from '@/components/landing/methodology-bar'
import { ParametersPanel } from '@/components/landing/parameters-panel'
import { TrendsPreview } from '@/components/landing/trends-preview'
import { Features } from '@/components/landing/features'
import { Benefits } from '@/components/landing/benefits'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { FinalCta } from '@/components/landing/final-cta'
import { LandingFooter } from '@/components/landing/footer'

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <Hero />
        <MethodologyBar />
        <ParametersPanel />
        <TrendsPreview />
        <Features />
        <Benefits />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
