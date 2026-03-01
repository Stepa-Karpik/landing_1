"use client"

import { motion } from "framer-motion"

export function HeroOrb() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/[0.08]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* Middle glow ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-white/[0.05]"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {/* Node dots on ring */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/10" />
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-white/15" />
        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10" />
      </motion.div>

      {/* Inner orb - breathing */}
      <motion.div
        className="absolute inset-12 md:inset-16 rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(160,230,200,0.15), rgba(100,160,220,0.08), transparent 70%)",
          boxShadow: "0 0 80px rgba(160,230,200,0.08), inset 0 0 60px rgba(100,160,220,0.05)",
        }}
        animate={{
          scale: [1, 1.06, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Core bright center */}
      <motion.div
        className="absolute inset-[35%] md:inset-[30%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.12), rgba(160,230,200,0.06), transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Bridge-like crossing lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <motion.line
          x1="30" y1="100" x2="170" y2="100"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.line
          x1="60" y1="50" x2="140" y2="150"
          stroke="rgba(160,230,200,0.05)"
          strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.line
          x1="60" y1="150" x2="140" y2="50"
          stroke="rgba(160,230,200,0.05)"
          strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Arc bridge */}
        <motion.path
          d="M 40 120 Q 100 50 160 120"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -10 - Math.random() * 20, 0],
            x: [0, Math.random() * 10 - 5, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  )
}
