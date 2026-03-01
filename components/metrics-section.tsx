"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"
import { metrics } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

function CountUp({ value, suffix, duration = 1600 }: { value: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const markerRef = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)
  const isInView = useInView(markerRef, { once: true, margin: "-80px" })

  useEffect(() => {
    if (!isInView || startedRef.current) return
    startedRef.current = true

    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [duration, isInView, value])

  return (
    <span ref={markerRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export function MetricsSection() {
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass rounded-3xl px-6 py-10 md:px-10 md:py-12">
            <p className="text-center text-xs tracking-[0.2em] text-cyan-100/74 uppercase">Метрики команды</p>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {metrics.map((metric, index) => (
                <SectionReveal key={metric.label} delay={index * 0.08}>
                  <article className="text-center">
                    <p className="font-display text-5xl leading-none tracking-tight text-white md:text-6xl lg:text-7xl">
                      <CountUp value={metric.value} suffix={metric.suffix} />
                    </p>
                    <p className="mt-3 text-xs tracking-[0.12em] text-white/56 uppercase">{metric.label}</p>
                  </article>
                </SectionReveal>
              ))}
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
