"use client"

import { cultureStatement, cultureValues } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function CultureSection() {
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <SectionReveal>
          <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Вайб команды</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-4xl leading-tight tracking-tight text-white md:text-6xl">
            {cultureStatement}
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {cultureValues.map((value) => (
              <span
                key={value}
                className="rounded-full border border-white/14 bg-white/[0.05] px-4 py-2 text-[11px] tracking-[0.11em] text-white/72 uppercase"
              >
                {value}
              </span>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
