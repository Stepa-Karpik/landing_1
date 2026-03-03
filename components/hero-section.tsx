"use client"

import { motion } from "framer-motion"
import { heroContent, heroSignals } from "@/lib/data"
import { HeroOrb } from "./hero-orb"

function scrollToSection(id: string) {
  const section = document.querySelector(id)
  if (section) section.scrollIntoView({ behavior: "smooth" })
}

export function HeroSection() {
  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pb-16 pt-28 md:pt-36">
      <div className="glow-spot -left-44 -top-24 h-[620px] w-[620px] bg-[radial-gradient(circle,rgba(120,220,255,0.35),rgba(120,220,255,0)_70%)] opacity-60" />
      <div className="glow-spot -bottom-36 right-[-10%] h-[540px] w-[540px] bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0)_72%)] opacity-45" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <HeroOrb />
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center md:items-end md:text-right">
        <motion.span
          className="rounded-full border border-white/18 bg-white/[0.06] px-4 py-2 text-[10px] tracking-[0.2em] text-white/75 uppercase"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.95, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {heroContent.eyebrow}
        </motion.span>

        <motion.h1
          className="hidden"
          initial={{ opacity: 0, y: 34, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.25, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block text-white/95">{heroContent.titleTop}</span>
          <span className="mt-2 block bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(186,238,255,0.82))] bg-clip-text text-transparent">
            {heroContent.titleBottom}
          </span>
        </motion.h1>

        <motion.p
          className="mt-7 max-w-2xl text-balance text-base leading-relaxed text-white/72 md:text-lg"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {heroContent.subtitle}
        </motion.p>

        <motion.div
          className="mt-11 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={() => scrollToSection("#projects")}
            className="rounded-full border border-cyan-100/55 bg-white px-7 py-3 text-xs font-semibold tracking-[0.15em] text-black uppercase transition-all duration-300 hover:bg-cyan-100"
          >
            Смотреть проекты
          </button>
          <button
            onClick={() => scrollToSection("#contacts")}
            className="rounded-full border border-white/22 bg-white/[0.06] px-7 py-3 text-xs font-semibold tracking-[0.15em] text-white uppercase transition-all duration-300 hover:border-cyan-100/70 hover:bg-white/[0.14]"
          >
            Связаться
          </button>
        </motion.div>

        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
        >
          {heroSignals.map((signal) => (
            <span
              key={signal}
              className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[11px] tracking-[0.1em] text-white/68 uppercase"
            >
              {signal}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.35, duration: 0.9 }}
      >
        <motion.div
          className="flex h-9 w-6 items-start justify-center rounded-full border border-white/14 p-1.5"
          animate={{ opacity: [0.3, 0.62, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-cyan-100/90"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
