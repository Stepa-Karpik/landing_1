"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { timelineEvents } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

export function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="experience" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Опыт
          </h2>
        </SectionReveal>

        <div ref={ref} className="mt-16 relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-white/[0.06]">
            <motion.div
              className="w-full bg-gradient-to-b from-white/20 via-white/10 to-transparent"
              initial={{ height: 0 }}
              animate={isInView ? { height: "100%" } : { height: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="flex flex-col gap-12 md:gap-16">
            {timelineEvents.map((event, i) => (
              <SectionReveal key={i} delay={0.2 + i * 0.15}>
                <div className="flex gap-6 md:gap-10">
                  {/* Dot */}
                  <div className="relative flex-shrink-0 w-8 md:w-16 flex justify-center">
                    <motion.div
                      className="w-3 h-3 rounded-full border border-white/20 bg-background"
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : { scale: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="absolute inset-0.5 rounded-full bg-white/10" />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <span className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">{event.year}</span>
                    <h3 className="mt-1 text-lg md:text-xl font-semibold text-foreground">{event.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">{event.description}</p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
