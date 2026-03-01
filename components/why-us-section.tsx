"use client"

import { whyUsItems } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function WhyUsSection() {
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px]">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Почему мы</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-white md:text-5xl">Наше преимущество</h2>
          </div>
        </SectionReveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {whyUsItems.map((item, index) => (
            <SectionReveal key={item.title} delay={index * 0.08}>
              <article className="glass glass-hover rounded-2xl p-6 min-h-[220px] h-full md:p-7">
                <span className="text-xs tracking-[0.14em] text-cyan-100/74 uppercase">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/68 md:text-base">{item.description}</p>
              </article>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
