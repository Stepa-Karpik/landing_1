"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export function ParallaxGlow() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300])

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.025]"
      >
        <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, rgba(160,230,200,0.5), transparent 70%)" }} />
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute top-[50%] -right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.02]"
      >
        <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, rgba(100,160,220,0.5), transparent 70%)" }} />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[80%] left-[30%] w-[600px] h-[600px] rounded-full opacity-[0.02]"
      >
        <div className="w-full h-full rounded-full" style={{ background: "radial-gradient(circle, rgba(160,230,200,0.4), transparent 70%)" }} />
      </motion.div>
    </div>
  )
}
