"use client"

import { cultureValues } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function CultureSection() {
  return (
    <section className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-16">
            Культура
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="flex flex-wrap gap-4">
              {cultureValues.map((value, i) => (
                <SectionReveal key={value} delay={0.1 + i * 0.06}>
                  <div className="px-6 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500">
                    <span className="text-sm md:text-base text-foreground/80">{value}</span>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
