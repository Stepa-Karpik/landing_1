"use client"

import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

interface MaterialPoint {
  id: string
  label: string
  description: string
  href: string
  position: {
    x: number
    y: number
  }
}

interface ActiveLine {
  x: number
  y: number
  length: number
  angle: number
}

const resultAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "result-blue",
    color: "#9bb6e3",
    size: "clamp(740px,70vw,1160px)",
    top: "6%",
    left: "54%",
    maxShift: 96,
  },
  {
    id: "result-violet",
    color: "#b6a9df",
    size: "clamp(620px,58vw,940px)",
    top: "-14%",
    left: "10%",
    opacity: 0.23,
    maxShift: 86,
  },
  {
    id: "result-rose",
    color: "#cba3da",
    size: "clamp(560px,52vw,840px)",
    top: "62%",
    left: "-8%",
    opacity: 0.2,
    maxShift: 82,
  },
]

const materialPoints: MaterialPoint[] = [
  {
    id: "github",
    label: "GITHUB",
    description: "Исходный код проекта.",
    href: "https://github.com/Nerior-team",
    position: { x: 25, y: 28 },
  },
  {
    id: "figma",
    label: "FIGMA",
    description: "Дизайн интерфейса.",
    href: "https://www.figma.com/",
    position: { x: 71, y: 26 },
  },
  {
    id: "live",
    label: "LIVE",
    description: "Рабочая версия продукта.",
    href: "https://nerior.ru",
    position: { x: 75, y: 48 },
  },
  {
    id: "docs",
    label: "DOCS",
    description: "Архитектура и документация.",
    href: "https://github.com/Nerior-team",
    position: { x: 28, y: 68 },
  },
  {
    id: "presentation",
    label: "VIDEO",
    description: "Видео демонстрации и питч.",
    href: "https://www.youtube.com/",
    position: { x: 66, y: 71 },
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function DemoPanel({
  introVisible,
  translateX = 0,
  translateY = 0,
  panelRef,
  transitionDelay = 80,
}: {
  introVisible: boolean
  translateX?: number
  translateY?: number
  panelRef?: RefObject<HTMLDivElement | null>
  transitionDelay?: number
}) {
  return (
    <div className="relative w-[min(72vw,980px)] max-w-full">
      <div
        ref={panelRef}
        className="relative aspect-video overflow-hidden border border-black/16 bg-[#f8f5f0]/95"
        style={{
          opacity: introVisible ? 1 : 0,
          transform: `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${introVisible ? 1 : 0.95})`,
          transition: `opacity 540ms ${EASE} ${transitionDelay}ms, transform 540ms ${EASE} ${transitionDelay}ms`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.5),rgba(255,255,255,0.14))]" />
        <div className="pointer-events-none absolute inset-[5%] border border-black/12" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.26]"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(17,17,17,0.14) 1px, transparent 1px)",
            backgroundSize: "100% 12px",
          }}
        />
        <div className="relative flex h-full items-center justify-center px-6 text-center">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-[#111]/50 uppercase">Product Window</p>
            <p className="mt-3 text-[clamp(22px,2.5vw,36px)] leading-[0.98] tracking-[-0.03em] text-[#111]/86 uppercase">
              Demo Placeholder
            </p>
            <p className="mt-4 text-[13px] leading-[1.4] text-[#111]/56">Видео или live-прототип добавляется перед защитой.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const demoRef = useRef<HTMLDivElement | null>(null)
  const pointRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const [introVisible, setIntroVisible] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [activeLine, setActiveLine] = useState<ActiveLine | null>(null)
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotionPreference = () => setPrefersReducedMotion(reducedMotionMedia.matches)

    syncMotionPreference()
    reducedMotionMedia.addEventListener("change", syncMotionPreference)

    const frameId = window.requestAnimationFrame(() => {
      setIntroVisible(true)
    })

    return () => {
      reducedMotionMedia.removeEventListener("change", syncMotionPreference)
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setPointerOffset({ x: 0, y: 0 })
      return
    }

    const pointerMedia = window.matchMedia("(hover: hover) and (pointer: fine)")
    if (!pointerMedia.matches) return

    let frameId: number | null = null
    let nextX = 0
    let nextY = 0

    const applyOffset = () => {
      frameId = null
      setPointerOffset((previous) => {
        if (Math.abs(previous.x - nextX) < 0.01 && Math.abs(previous.y - nextY) < 0.01) {
          return previous
        }
        return { x: nextX, y: nextY }
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      nextX = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1)
      nextY = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1)
      if (frameId === null) {
        frameId = window.requestAnimationFrame(applyOffset)
      }
    }

    const resetOffset = () => {
      nextX = 0
      nextY = 0
      if (frameId === null) {
        frameId = window.requestAnimationFrame(applyOffset)
      }
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("blur", resetOffset)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("blur", resetOffset)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [prefersReducedMotion])

  const recalculateLine = useCallback(() => {
    if (!activePointId) {
      setActiveLine(null)
      return
    }

    const sceneElement = sceneRef.current
    const demoElement = demoRef.current
    const pointElement = pointRefs.current[activePointId]

    if (!sceneElement || !demoElement || !pointElement) {
      setActiveLine(null)
      return
    }

    const sceneRect = sceneElement.getBoundingClientRect()
    const demoRect = demoElement.getBoundingClientRect()
    const pointRect = pointElement.getBoundingClientRect()

    const startGlobalX = pointRect.left + 6
    const startGlobalY = pointRect.top + pointRect.height * 0.5

    const endGlobalX = clamp(startGlobalX, demoRect.left, demoRect.right)
    const endGlobalY = clamp(startGlobalY, demoRect.top, demoRect.bottom)

    const startX = startGlobalX - sceneRect.left
    const startY = startGlobalY - sceneRect.top
    const endX = endGlobalX - sceneRect.left
    const endY = endGlobalY - sceneRect.top

    const deltaX = endX - startX
    const deltaY = endY - startY
    const length = Math.hypot(deltaX, deltaY)
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI

    setActiveLine(
      length > 1
        ? {
            x: startX,
            y: startY,
            length,
            angle,
          }
        : null,
    )
  }, [activePointId])

  useEffect(() => {
    if (!activePointId) {
      setActiveLine(null)
      return
    }

    const frameId = window.requestAnimationFrame(recalculateLine)
    return () => window.cancelAnimationFrame(frameId)
  }, [activePointId, pointerOffset, recalculateLine])

  useEffect(() => {
    if (!activePointId) return

    const onResize = () => recalculateLine()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [activePointId, recalculateLine])

  const demoParallaxX = prefersReducedMotion ? 0 : pointerOffset.x * 2.8
  const demoParallaxY = prefersReducedMotion ? 0 : pointerOffset.y * 2.3

  return (
    <main className="relative isolate min-h-screen bg-[#f6f4ef] text-[#111111] md:h-screen md:overflow-hidden">
      <RouteAtmosphere blobs={resultAtmosphereBlobs} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1380px] flex-col px-5 pb-7 pt-7 md:h-full md:min-h-0 md:px-10 md:pb-9 md:pt-9">
        <section ref={sceneRef} className="relative hidden flex-1 md:block">
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2">
              <DemoPanel
                introVisible={introVisible}
                translateX={demoParallaxX}
                translateY={demoParallaxY}
                panelRef={demoRef}
              />
            </div>

            {activeLine && (
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute h-px bg-black/36 transition-opacity duration-200"
                  style={{
                    left: `${activeLine.x}px`,
                    top: `${activeLine.y}px`,
                    width: `${activeLine.length}px`,
                    transform: `rotate(${activeLine.angle}deg)`,
                    transformOrigin: "0 50%",
                  }}
                />
              </div>
            )}

            {materialPoints.map((point, index) => {
              const isActive = activePointId === point.id
              const delay = prefersReducedMotion ? 0 : 220 + index * 120
              const depthX = prefersReducedMotion ? 0 : pointerOffset.x * (4.4 + (index % 2) * 1.1)
              const depthY = prefersReducedMotion ? 0 : pointerOffset.y * (4.4 + ((index + 1) % 2) * 1.1)
              const scale = (introVisible ? 1 : 0.84) * (isActive ? 1.025 : 1)
              const external = point.href.startsWith("http")

              return (
                <div
                  key={point.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${point.position.x}%`, top: `${point.position.y}%` }}
                >
                  <a
                    ref={(element) => {
                      pointRefs.current[point.id] = element
                    }}
                    href={point.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    onMouseEnter={() => setActivePointId(point.id)}
                    onMouseLeave={() => setActivePointId((previous) => (previous === point.id ? null : previous))}
                    onFocus={() => setActivePointId(point.id)}
                    onBlur={() => setActivePointId((previous) => (previous === point.id ? null : previous))}
                    className="group relative inline-flex flex-col items-start text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                    style={{
                      opacity: introVisible ? 1 : 0,
                      transform: `translate3d(${depthX.toFixed(2)}px, ${depthY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`,
                      transition: `opacity 500ms ${EASE} ${delay}ms, transform 500ms ${EASE} ${delay}ms, color 220ms ease`,
                    }}
                  >
                    <span
                      className="pointer-events-none absolute left-0 top-[0.6em] h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-black/58 transition-colors duration-200"
                      style={{ backgroundColor: isActive ? "rgba(17,17,17,0.8)" : "transparent" }}
                    />
                    <span className="pl-5 text-[11px] tracking-[0.2em] text-[#111]/76 uppercase">{point.label}</span>
                    <span
                      className="mt-1 max-w-[24ch] pl-5 text-[13px] leading-[1.36] text-[#111]/60 transition-[opacity,transform] duration-220"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: `translateY(${isActive ? 0 : 5}px)`,
                      }}
                    >
                      {point.description}
                    </span>
                  </a>
                </div>
              )
            })}
          </div>
        </section>

        <section className="md:hidden">
          <DemoPanel introVisible={introVisible} transitionDelay={0} />

          <ul className="mt-7 border-y border-black/12">
            {materialPoints.map((point, index) => {
              const delay = prefersReducedMotion ? 0 : 200 + index * 120
              const external = point.href.startsWith("http")

              return (
                <li key={point.id} className="border-b border-black/12 last:border-b-0">
                  <a
                    href={point.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                    className="relative block py-3.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                    style={{
                      opacity: introVisible ? 1 : 0,
                      transform: `scale(${introVisible ? 1 : 0.95})`,
                      transition: `opacity 500ms ${EASE} ${delay}ms, transform 500ms ${EASE} ${delay}ms`,
                    }}
                  >
                    <span className="absolute left-0 top-[1.13rem] h-2.5 w-2.5 rounded-full border border-black/58" />
                    <p className="pl-5 text-[11px] tracking-[0.2em] text-[#111]/76 uppercase">{point.label}</p>
                    <p className="mt-1 pl-5 text-[13px] leading-[1.38] text-[#111]/60">{point.description}</p>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>

      </div>
    </main>
  )
}
