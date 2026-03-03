"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
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
import { IntroGate } from "@/components/intro-gate"

export default function Page() {
  const [introDone, setIntroDone] = useState(false)
  const [brandVisible, setBrandVisible] = useState(false)

  useEffect(() => {
    const resetToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    resetToTop()
    requestAnimationFrame(resetToTop)
    const timer = window.setTimeout(resetToTop, 120)

    return () => {
      window.clearTimeout(timer)
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto"
      }
    }
  }, [])

  return (
    <main className="relative min-h-screen bg-background">
      {!introDone && <IntroGate onTitleReveal={() => setBrandVisible(true)} onComplete={() => setIntroDone(true)} />}

      {brandVisible && (
        <div className="pointer-events-none absolute left-[clamp(16px,6vw,110px)] top-[clamp(130px,34vh,390px)] z-[170] flex flex-col gap-1 sm:gap-2">
          <motion.span
            initial={{ opacity: 0, y: 30, filter: "blur(22px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-brand text-[clamp(44px,11vw,170px)] leading-[0.88] tracking-[0.01em] text-white"
            style={{ textShadow: "0 14px 34px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.9)" }}
          >
            TEAM
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 36, filter: "blur(24px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.18, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="font-brand text-[clamp(44px,11vw,170px)] leading-[0.88] tracking-[0.01em] text-white"
            style={{ textShadow: "0 14px 34px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.9)" }}
          >
            NERIOR
          </motion.span>
        </div>
      )}

      <ParallaxGlow />
      {introDone && <Navigation />}

      <motion.div
        initial={false}
        animate={introDone ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0.08, y: 36, filter: "blur(14px)" }}
        transition={{ duration: introDone ? 1.35 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 ${introDone ? "" : "pointer-events-none"}`}
      >
        <HeroSection />
        <AboutSection />
        <TeamSection />
        <CompetenciesSection />
        <ProjectsSection />
        <TimelineSection />
        <WhyUsSection />
        <MetricsSection />
        <CultureSection />
        <ContactsSection />
        <Footer />
      </motion.div>
    </main>
  )
}
