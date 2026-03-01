import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { CompetenciesSection } from "@/components/competencies-section"
import { TeamSection } from "@/components/team-section"
import { ProjectsSection } from "@/components/projects-section"
import { TimelineSection } from "@/components/timeline-section"
import { WhyUsSection } from "@/components/why-us-section"
import { MetricsSection } from "@/components/metrics-section"
import { CultureSection } from "@/components/culture-section"
import { ContactsSection, Footer } from "@/components/contacts-section"
import { ParallaxGlow } from "@/components/parallax-glow"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-background">
      <ParallaxGlow />
      <Navigation />
      <div className="relative z-10">
        <HeroSection />
        <AboutSection />
        <CompetenciesSection />
        <TeamSection />
        <ProjectsSection />
        <TimelineSection />
        <WhyUsSection />
        <MetricsSection />
        <CultureSection />
        <ContactsSection />
        <Footer />
      </div>
    </main>
  )
}
