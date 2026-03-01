"use client"

import { useRef, useEffect, useState } from "react"
import { useInView } from "framer-motion"
import { metrics } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

function CountUp({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isInView || startedRef.current) return
    startedRef.current = true

    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, target, duration])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

export function MetricsSection() {
  return (
    <section className="relative py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {metrics.map((metric, i) => (
            <SectionReveal key={metric.label} delay={0.1 * i}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  <CountUp target={metric.value} suffix={metric.suffix} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
