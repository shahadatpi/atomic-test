// app/page.tsx — Landing page assembler
// All styles are now in app/animations.css (imported via root layout).
import Navbar          from "@/components/shared/landing/Navbar"
import HeroSection     from "@/components/shared/landing/HeroSection"
import TickerSection   from "@/components/shared/landing/TickerSection"
import DemoSection     from "@/components/shared/landing/DemoSection"
import FeaturesSection from "@/components/shared/landing/FeaturesSection"
import SubjectsSection from "@/components/shared/landing/SubjectsSection"
import PricingSection  from "@/components/shared/landing/PricingSection"
import CtaSection      from "@/components/shared/landing/CtaSection"
import Footer          from "@/components/shared/landing/Footer"

export default function LandingPage() {
  return (
    <div
      className="bg-zinc-950 text-zinc-100 overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <Navbar />
      <HeroSection />
      <TickerSection />
      <DemoSection />
      <FeaturesSection />
      <SubjectsSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
