"use client"

import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { introPhraseLines, routeBlocks } from "@/lib/data"

interface HorizontalRouteScrollProps {
  titleVisible: boolean
}

const LARGE_CARD_WIDTH = "clamp(320px, 74vw, 1400px)"
const SMALL_CARD_WIDTH = "clamp(280px, 48vw, 920px)"
const LARGE_CARD_HEIGHT = "clamp(320px, 74vh, 860px)"
const SMALL_CARD_HEIGHT = "clamp(260px, 48vh, 620px)"

function getCardTitle(slug: string, title: string) {
  if (slug === "hero") return introPhraseLines.join("\n")
  return title
}

export function HorizontalRouteScroll({ titleVisible }: HorizontalRouteScrollProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  const cardWidth = compact ? SMALL_CARD_WIDTH : LARGE_CARD_WIDTH
  const cardHeight = compact ? SMALL_CARD_HEIGHT : LARGE_CARD_HEIGHT
  const sideSpacer = `max(16px, calc((100vw - ${cardWidth}) / 2))`

  const handleScroll = () => {
    const container = scrollerRef.current
    if (!container) return
    setCompact(container.scrollLeft > container.clientWidth * 0.12)
  }

  useEffect(() => {
    const container = scrollerRef.current
    if (!container) return

    const onWheel = (event: WheelEvent) => {
      if (container.scrollWidth <= container.clientWidth) return
      const rect = container.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return
      event.preventDefault()
      const dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      container.scrollLeft += dominantDelta * 1.35
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <section className="relative z-10 h-screen overflow-hidden">
      <AnimatePresence>
        {titleVisible && !compact && (
          <motion.div
            initial={{ opacity: 0, y: 26, filter: "blur(18px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(12px)" }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-[clamp(16px,6vw,110px)] top-[clamp(130px,34vh,390px)] z-20"
          >
            <div className="flex flex-col gap-1 sm:gap-2 leading-[0.88]">
              {introPhraseLines.map((line, index) => (
                <motion.span
                  key={`overlay-${line}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.08 }}
                  className="font-brand text-[clamp(44px,11vw,170px)] tracking-[0.01em] text-white"
                  style={{ textShadow: "0 14px 34px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.9)" }}
                >
                  {line}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full w-full items-center gap-4 overflow-x-auto overflow-y-hidden snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden className="h-px shrink-0" style={{ width: sideSpacer }} />

        {routeBlocks.map((block, index) => {
          const isFirst = index === 0

          return (
            <motion.article
              key={block.slug}
              initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 snap-center transition-[width,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: cardWidth, height: cardHeight }}
            >
              <Link
                href={`/${block.slug}`}
                className="glass block h-full w-full rounded-[32px] border border-white/15 p-4 transition-transform duration-300 hover:scale-[1.01] md:p-6"
              >
                <div className="flex h-full items-center justify-center overflow-y-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <motion.h2
                    initial={false}
                    animate={
                      isFirst
                        ? titleVisible && !compact
                          ? { opacity: 0, y: 8, filter: "blur(6px)" }
                          : titleVisible
                          ? { opacity: 1, y: 0, filter: "blur(0px)" }
                          : { opacity: 0.08, y: 24, filter: "blur(14px)" }
                        : { opacity: 1, y: 0, filter: "blur(0px)" }
                    }
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-center text-[clamp(34px,7vw,104px)] leading-[0.95] tracking-tight text-white whitespace-pre-line"
                  >
                    {getCardTitle(block.slug, block.title)}
                  </motion.h2>
                </div>
              </Link>
            </motion.article>
          )
        })}

        <div aria-hidden className="h-px shrink-0" style={{ width: sideSpacer }} />
      </div>
    </section>
  )
}
