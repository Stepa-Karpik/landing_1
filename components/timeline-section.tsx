"use client"

import { motion } from "framer-motion"
import { timelineEvents } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function TimelineSection() {
  return (
    <section id="timeline" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px]">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Хакатонный таймлайн</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-white md:text-5xl">Линия прогресса</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/68 md:text-base">
              От финалов до побед и коммерческих запусков. Одна непрерывная линия роста команды.
            </p>
          </div>
        </SectionReveal>

        <div className="relative mt-16 pl-3 md:pl-4">
          <div className="absolute bottom-0 left-[11px] top-0 w-px bg-white/10 md:left-[15px]" />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-0 left-[11px] top-0 w-px origin-top bg-gradient-to-b from-cyan-100/80 via-cyan-100/30 to-transparent md:left-[15px]"
          />

          <div className="space-y-12 md:space-y-14">
            {timelineEvents.map((event, index) => (
              <SectionReveal key={`${event.period}-${event.title}`} delay={index * 0.1}>
                <article className="relative ml-6 min-h-[200px] rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur md:ml-10 md:p-7">
                  <div className="absolute -left-[29px] top-8 h-3 w-3 rounded-full border border-cyan-100/55 bg-black md:-left-[33px]">
                    <div className="absolute inset-[3px] rounded-full bg-cyan-100/75" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.14em] text-white/55 uppercase">
                    <span>{event.period}</span>
                    <span className="h-px w-8 bg-white/18" />
                    <span>{event.result}</span>
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{event.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/68 md:text-base">{event.description}</p>
                </article>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
