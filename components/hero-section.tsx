"use client"

import { motion } from "framer-motion"
import { HeroOrb } from "./hero-orb"

export function HeroSection() {
  const handleScroll = (id: string) => {
    const el = document.querySelector(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background glow spots */}
      <div
        className="glow-spot w-[600px] h-[600px] -top-40 -left-40 opacity-[0.04]"
        style={{ background: "radial-gradient(circle, rgba(160,230,200,0.4), transparent 70%)" }}
      />
      <div
        className="glow-spot w-[500px] h-[500px] -bottom-20 -right-20 opacity-[0.03]"
        style={{ background: "radial-gradient(circle, rgba(100,160,220,0.4), transparent 70%)" }}
      />

      <div className="mx-auto max-w-7xl px-6 w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 pt-24 pb-16">
        {/* Left: Text */}
        <div className="flex-1 max-w-2xl">
          <motion.h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance leading-[1.1]"
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Изи бриджи
          </motion.h1>

          <motion.p
            className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Команда, которая быстро превращает идеи в работающие продукты.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => handleScroll("#projects")}
              className="px-7 py-3 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 cursor-pointer"
            >
              Проекты
            </button>
            <button
              onClick={() => handleScroll("#team")}
              className="px-7 py-3 text-sm font-medium rounded-full border border-white/10 text-foreground bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              Команда
            </button>
          </motion.div>
        </div>

        {/* Right: Orb */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroOrb />
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1.5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 rounded-full bg-white/40"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
