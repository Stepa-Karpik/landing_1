"use client"

import { whyUsItems } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function WhyUsSection() {
  return (
    <section className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Чем отличаемся
          </h2>
        </SectionReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {whyUsItems.map((item, i) => (
            <SectionReveal key={item.title} delay={0.08 * i}>
              <div className="glass glass-hover rounded-2xl p-6 md:p-8 transition-all duration-500 h-full">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
