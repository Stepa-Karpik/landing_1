"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

type IntroPhase = "idle" | "playing" | "exiting" | "done"

interface IntroGateProps {
  onTitleReveal?: () => void
  onComplete: () => void
}

const EXIT_DURATION_MS = 420

export function IntroGate({ onTitleReveal, onComplete }: IntroGateProps) {
  const [phase, setPhase] = useState<IntroPhase>("idle")
  const [videoVisible, setVideoVisible] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const titleRevealedRef = useRef(false)

  useEffect(() => {
    if (phase !== "done") {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current)
      }
    }
  }, [phase])

  const finishIntro = () => {
    if (phase === "done" || phase === "exiting") return

    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    setPhase("exiting")

    window.setTimeout(() => {
      setPhase("done")
      onComplete()
    }, EXIT_DURATION_MS)
  }

  const startVideo = async () => {
    setPhase("playing")
    setVideoVisible(true)
    titleRevealedRef.current = false
    fallbackTimerRef.current = window.setTimeout(finishIntro, 15000)

    const video = videoRef.current
    if (!video) {
      finishIntro()
      return
    }

    video.currentTime = 0
    try {
      await video.play()
    } catch {
      fallbackTimerRef.current = window.setTimeout(finishIntro, 2500)
    }
  }

  const handleTimeUpdate = () => {
    const currentTime = videoRef.current?.currentTime ?? 0
    if (!titleRevealedRef.current && currentTime >= 1.8) {
      titleRevealedRef.current = true
      onTitleReveal?.()
    }
  }

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={phase === "exiting" ? { opacity: 0, filter: "blur(6px)" } : { opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "exiting" ? 0.42 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[120] overflow-hidden bg-black"
        >
          <motion.img
            src="/media/intro-start.jpg"
            alt="Стартовый кадр"
            className="absolute inset-0 h-full w-full object-cover"
            initial={false}
            animate={
              phase === "exiting"
                ? { opacity: 0, scale: 1.03, filter: "blur(8px)" }
                : { opacity: phase === "playing" ? 0.18 : 1, scale: phase === "playing" ? 1.03 : 1, filter: "blur(0px)" }
            }
            transition={{ duration: phase === "exiting" ? 0.4 : 1.05, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.video
            ref={videoRef}
            src="/media/intro-video.mov"
            playsInline
            muted
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={finishIntro}
            onError={finishIntro}
            className="absolute inset-0 h-full w-full object-cover"
            initial={false}
            animate={
              phase === "exiting"
                ? { opacity: 0, scale: 1.05, filter: "blur(10px)" }
                : { opacity: videoVisible ? 1 : 0, scale: videoVisible ? 1 : 1.01, filter: "blur(0px)" }
            }
            transition={{ duration: phase === "exiting" ? 0.4 : 0.95, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.35)_66%,rgba(0,0,0,0.75)_100%)]"
            initial={false}
            animate={phase === "exiting" ? { opacity: 0.1 } : { opacity: 1 }}
            transition={{ duration: phase === "exiting" ? 0.4 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black via-black/40 to-transparent"
            animate={phase === "exiting" ? { opacity: 0.06 } : { opacity: phase === "playing" ? 0.95 : 0.75 }}
            transition={{ duration: phase === "exiting" ? 0.35 : 0.8 }}
          />

          <motion.div
            initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-6 top-6 z-20"
          >
            <span className="liquid-badge inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white uppercase">
              Nerior
            </span>
          </motion.div>

          <div className="relative z-10 flex h-full items-end justify-center px-6 pb-10 md:pb-14">
            {phase === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center justify-center gap-3"
              >
                <a
                  href="https://nerior.ru"
                  className="liquid-button inline-flex items-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase"
                >
                  Сайт
                </a>
                <button
                  onClick={startVideo}
                  className="liquid-button inline-flex items-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.14em] text-white uppercase"
                >
                  Подробнее
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
