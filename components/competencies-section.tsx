"use client"

import { SectionReveal } from "./section-reveal"
import { competencies, techTags } from "@/lib/data"
import { Server, Monitor, Smartphone, Palette, ShieldCheck, Container } from "lucide-react"

const icons: Record<string, typeof Server> = {
  Backend: Server,
  Frontend: Monitor,
  Mobile: Smartphone,
  "UI/UX": Palette,
  Security: ShieldCheck,
  DevOps: Container,
}

export function CompetenciesSection() {
  return (
    <section id="competencies" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Компетенции
          </h2>
        </SectionReveal>

        {/* Competency cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competencies.map((comp, i) => {
            const Icon = icons[comp.title] || Server
            return (
              <SectionReveal key={comp.title} delay={0.08 * i}>
                <div className="glass glass-hover rounded-xl p-6 transition-all duration-500 h-full">
                  <Icon className="w-6 h-6 text-muted-foreground mb-4" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-foreground">{comp.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{comp.description}</p>
                </div>
              </SectionReveal>
            )
          })}
        </div>

        {/* Tech tags marquee */}
        <SectionReveal delay={0.3}>
          <div className="mt-16 relative overflow-hidden py-4">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex gap-3 w-max">
              {[...techTags, ...techTags].map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="px-4 py-2 rounded-full text-xs font-medium text-muted-foreground border border-white/[0.06] bg-white/[0.02] hover:text-foreground hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 whitespace-nowrap cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
