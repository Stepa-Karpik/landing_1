"use client"

import { motion } from "framer-motion"
import { techStackTags } from "@/lib/data"
import { SectionReveal } from "./section-reveal"

interface OrbitRingProps {
  tags: string[]
  radius: number
  duration: number
  reverse?: boolean
}

function OrbitRing({ tags, radius, duration, reverse = false }: OrbitRingProps) {
  return (
    <motion.div
      className="absolute inset-0"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {tags.map((tag, index) => {
        const angle = (360 / tags.length) * index

        return (
          <div
            key={`${tag}-${index}`}
            className="absolute left-1/2 top-1/2"
            style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)` }}
          >
            <span
              className="block rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[10px] tracking-[0.1em] text-white/75 uppercase shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              style={{ transform: `rotate(${-angle}deg)` }}
            >
              {tag}
            </span>
          </div>
        )
      })}
    </motion.div>
  )
}

export function CompetenciesSection() {
  const innerTags = techStackTags.slice(0, 8)
  const outerTags = techStackTags.slice(8)

  return (
    <section id="stack" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionReveal>
          <div className="glass rounded-2xl p-7 max-w-[340px] min-h-[300px]">
            <p className="text-xs tracking-[0.2em] text-cyan-100/72 uppercase">Технологический стек</p>
            <h2 className="mt-4 font-display text-4xl tracking-tight text-white md:text-5xl">Ядро стека</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/68 md:text-base">
              Единый стек для AI, backend, frontend и деплоя. Минимум лишнего, максимум результата.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.12}>
          <div className="relative mt-16 hidden h-[620px] items-center justify-center overflow-hidden lg:flex">
            <div className="absolute inset-[10%] rounded-full border border-white/10" />
            <div className="absolute inset-[23%] rounded-full border border-white/10" />
            <div className="absolute inset-[36%] rounded-full border border-cyan-100/18" />

            <OrbitRing tags={outerTags} radius={260} duration={68} />
            <OrbitRing tags={innerTags} radius={178} duration={46} reverse />

            <motion.div
              className="glass relative z-10 rounded-3xl border border-cyan-100/18 px-10 py-9 text-center"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-[10px] tracking-[0.2em] text-cyan-100/78 uppercase">Ядро стека</p>
              <p className="mt-3 font-display text-3xl tracking-tight text-white">ЯДРО NERIOR</p>
              <p className="mt-3 text-sm text-white/60">Архитектура сначала. Продакшен по умолчанию.</p>
            </motion.div>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.18}>
          <div className="mt-12 flex flex-wrap gap-2 lg:hidden">
            {techStackTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[11px] tracking-[0.1em] text-white/75 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
