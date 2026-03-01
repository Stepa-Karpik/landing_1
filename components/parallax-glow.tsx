"use client"

import { motion, useScroll, useTransform } from "framer-motion"

export function ParallaxGlow() {
  const { scrollY } = useScroll()

  const yFirst = useTransform(scrollY, [0, 2600], [0, -180])
  const ySecond = useTransform(scrollY, [0, 2600], [0, -120])
  const yThird = useTransform(scrollY, [0, 2600], [0, -240])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ y: yFirst }}
        className="absolute -left-[14%] top-[8%] h-[620px] w-[620px] rounded-full opacity-20"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(120,220,255,0.24),rgba(120,220,255,0)_70%)]" />
      </motion.div>

      <motion.div
        style={{ y: ySecond }}
        className="absolute right-[-10%] top-[42%] h-[520px] w-[520px] rounded-full opacity-20"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.13),rgba(255,255,255,0)_72%)]" />
      </motion.div>

      <motion.div
        style={{ y: yThird }}
        className="absolute left-[24%] top-[78%] h-[740px] w-[740px] rounded-full opacity-20"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(120,220,255,0.18),rgba(120,220,255,0)_72%)]" />
      </motion.div>
    </div>
  )
}
