"use client"

import { motion } from "framer-motion"

const particles = [
  { x: "16%", y: "28%", delay: 0.2, duration: 5.8 },
  { x: "34%", y: "18%", delay: 1, duration: 6.8 },
  { x: "70%", y: "23%", delay: 1.8, duration: 6.2 },
  { x: "82%", y: "48%", delay: 0.7, duration: 5.6 },
  { x: "64%", y: "72%", delay: 1.6, duration: 6.6 },
  { x: "26%", y: "76%", delay: 2.1, duration: 6.4 },
]

export function HeroOrb() {
  return (
    <div className="relative h-[280px] w-[280px] md:h-[380px] md:w-[380px] lg:h-[460px] lg:w-[460px]">
      <motion.div
        className="absolute inset-0 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute inset-[8%] rounded-full border border-cyan-200/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 95, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute inset-[16%] rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute inset-[21%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 28% 24%, rgba(255,255,255,0.28), rgba(132,225,255,0.16) 42%, rgba(47,108,140,0.22) 72%, rgba(10,18,28,0.65) 100%)",
          boxShadow:
            "0 0 80px rgba(120, 220, 255, 0.32), inset 0 -25px 50px rgba(0, 0, 0, 0.4), inset 0 18px 48px rgba(255, 255, 255, 0.14)",
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-[35%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.68), rgba(180,241,255,0.5), rgba(180,241,255,0) 75%)",
          filter: "blur(0.5px)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.95, 0.7] }}
        transition={{ duration: 4.7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none" aria-hidden>
        <motion.path
          d="M16 56 Q50 22 84 56"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.35"
          animate={{ opacity: [0.18, 0.46, 0.18] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M22 38 L78 62"
          stroke="rgba(120,220,255,0.3)"
          strokeWidth="0.3"
          animate={{ opacity: [0.15, 0.42, 0.15] }}
          transition={{ duration: 7.3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
        <motion.path
          d="M22 62 L78 38"
          stroke="rgba(120,220,255,0.3)"
          strokeWidth="0.3"
          animate={{ opacity: [0.12, 0.36, 0.12] }}
          transition={{ duration: 7.6, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        />
      </svg>

      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-100/80"
          style={{ left: particle.x, top: particle.y }}
          animate={{ y: [0, -10, 0], x: [0, 4, 0], opacity: [0.12, 0.9, 0.12], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}
