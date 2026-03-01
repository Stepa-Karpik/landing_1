"use client"

import { Brain, Rocket, ServerCog, Sparkles } from "lucide-react"
import { systemPillars } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

const icons = {
  brain: Brain,
  backend: ServerCog,
  ux: Sparkles,
  rocket: Rocket,
}

export function AboutSection() {
  return (
    <section id="about" className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        <SectionReveal>
          <aside className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px] lg:sticky lg:top-24">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">О команде как о системе</p>
            <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight text-white md:text-5xl">
              Созданы, чтобы запускать
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/68 md:text-base">
              Мы работаем как единая технологическая система: продуктовый контекст, архитектура, интерфейс и запуск двигаются в одном цикле.
            </p>
          </aside>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {systemPillars.map((pillar, index) => {
            const Icon = icons[pillar.icon]

            return (
              <SectionReveal key={pillar.title} delay={index * 0.1}>
                <article className="glass glass-hover rounded-2xl p-7 min-h-[220px] h-full md:p-8">
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100/30 bg-cyan-100/10">
                    <Icon className="h-5 w-5 text-cyan-100" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/68 md:text-base">{pillar.description}</p>
                </article>
              </SectionReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
