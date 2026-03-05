"use client"

import { type CSSProperties, useEffect, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const BASE_STROKE = "#d6d2ca"
const PROGRESS_STROKE = "#111111"
const STROKE_WIDTH = 0.9
const FORK_START_PROGRESS = 0.92

const vectorAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "vector-blue",
    color: "#9bb6e3",
    size: "clamp(740px,70vw,1160px)",
    top: "4%",
    left: "56%",
    maxShift: 96,
  },
  {
    id: "vector-violet",
    color: "#b6a9df",
    size: "clamp(620px,58vw,940px)",
    top: "-14%",
    left: "8%",
    opacity: 0.23,
    maxShift: 86,
  },
  {
    id: "vector-rose",
    color: "#cba3da",
    size: "clamp(560px,52vw,840px)",
    top: "62%",
    left: "-8%",
    opacity: 0.2,
    maxShift: 82,
  },
]

const desktopMainPath =
  "M 55 2 C 53 8 40 10 34 14 C 28 18 63 21 66 25 C 69 30 45 33 40 37 C 35 41 58 44 62 48 C 66 53 36 56 33 60 C 30 64 56 68 60 72 C 64 76 44 80 42 84 C 40 88 52 90 54 93"
const desktopLeftBranchPath = "M 54 93 C 49 95 43 97 34 99"
const desktopRightBranchPath = "M 54 93 C 58 95 65 97 73 99"

const mobileMainPath =
  "M 50 2 C 43 10 58 18 50 27 C 42 36 56 46 49 56 C 43 66 56 76 49 86 C 46 91 48 94 50 96"
const mobileLeftBranchPath = "M 50 96 C 44 97.5 39 98.5 33 99"
const mobileRightBranchPath = "M 50 96 C 56 97.5 61 98.5 67 99"

type DesktopSide = "left" | "right"

interface Stage {
  id: string
  time: string
  title: string
  points: string[]
  desktop: {
    x: number
    y: number
    side: DesktopSide
  }
  mobile: {
    x: number
    y: number
  }
}

const stages: Stage[] = [
  {
    id: "case",
    time: "0:00",
    title: "КЕЙС",
    points: ["получаем задачу", "фиксируем критерии оценки", "определяем ограничения"],
    desktop: { x: 56, y: 6, side: "right" },
    mobile: { x: 50, y: 7 },
  },
  {
    id: "idea",
    time: "первые 1–2 часа",
    title: "ИДЕЯ",
    points: ["перебор вариантов", "выбор одного решения", "формулировка ценности"],
    desktop: { x: 34, y: 16, side: "left" },
    mobile: { x: 47, y: 17 },
  },
  {
    id: "analysis",
    time: "2–4 час",
    title: "АНАЛИЗ",
    points: ["что важно жюри", "данные / риски", "план MVP"],
    desktop: { x: 66, y: 27, side: "right" },
    mobile: { x: 53, y: 27 },
  },
  {
    id: "architecture",
    time: "4–6 час",
    title: "АРХИТЕКТУРА",
    points: ["схема модулей", "контракты API", "роли и ответственность"],
    desktop: { x: 40, y: 38, side: "left" },
    mobile: { x: 48, y: 38 },
  },
  {
    id: "ux",
    time: "8 час",
    title: "UX / ДИЗАЙН",
    points: ["ключевые сценарии", "каркас интерфейса", "прототип"],
    desktop: { x: 62, y: 48, side: "right" },
    mobile: { x: 52, y: 48 },
  },
  {
    id: "mvp",
    time: "6–20 час",
    title: "MVP",
    points: ["ядро продукта", "первый рабочий контур", "сборка демо-сценария"],
    desktop: { x: 33, y: 60, side: "left" },
    mobile: { x: 47, y: 60 },
  },
  {
    id: "integrations",
    time: "20–30 час",
    title: "ИНТЕГРАЦИИ",
    points: ["фронт ↔ бек", "база / кэш", "стабильность данных"],
    desktop: { x: 60, y: 71, side: "right" },
    mobile: { x: 53, y: 71 },
  },
  {
    id: "polish",
    time: "30–40 час",
    title: "ПОЛИРОВКА",
    points: ["фиксы", "UX доводка", "подготовка к показу"],
    desktop: { x: 42, y: 82, side: "left" },
    mobile: { x: 49, y: 83 },
  },
  {
    id: "defense",
    time: "40–48 час",
    title: "ЗАЩИТА",
    points: ["сторителлинг", "финальная демонстрация", "презентация"],
    desktop: { x: 54, y: 91, side: "right" },
    mobile: { x: 50, y: 92 },
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function RoadLayer({
  mainPath,
  leftBranchPath,
  rightBranchPath,
  progress,
}: {
  mainPath: string
  leftBranchPath: string
  rightBranchPath: string
  progress: number
}) {
  const clipBottom = clamp(100 - progress * 100, 0, 100).toFixed(3)
  const forkFill = progress >= FORK_START_PROGRESS ? 1 : 0

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={mainPath} fill="none" stroke={BASE_STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        <path d={leftBranchPath} fill="none" stroke={BASE_STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        <path d={rightBranchPath} fill="none" stroke={BASE_STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      </svg>

      <div
        className="absolute inset-0 overflow-hidden transition-[clip-path] duration-75 ease-linear"
        style={{ clipPath: `inset(0 0 ${clipBottom}% 0)` }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d={mainPath} fill="none" stroke={PROGRESS_STROKE} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
        </svg>
      </div>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full transition-opacity duration-200 ease-out"
        style={{ opacity: forkFill }}
      >
        <path
          d={leftBranchPath}
          fill="none"
          stroke={PROGRESS_STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d={rightBranchPath}
          fill="none"
          stroke={PROGRESS_STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function DesktopStage({
  stage,
  reached,
  reducedMotion,
}: {
  stage: Stage
  reached: boolean
  reducedMotion: boolean
}) {
  const isLeftStage = stage.desktop.side === "left"
  const sideClass =
    isLeftStage
      ? "right-[calc(100%+clamp(28px,3vw,56px))] items-end"
      : "left-[calc(100%+clamp(28px,3vw,56px))] items-start text-left"
  const markerOffset = isLeftStage ? -14 : 14
  const leadLineStyle: CSSProperties = {
    left: `calc(50% + ${markerOffset}px)`,
    width: "clamp(168px,18vw,336px)",
    height: reached ? 2 : 1,
    opacity: reached ? 0.78 : 0.34,
    transform: `${isLeftStage ? "translate(-100%, -50%)" : "translate(0, -50%)"} scaleX(${reached ? 1 : 0.5})`,
    transformOrigin: isLeftStage ? "right center" : "left center",
    transition: reducedMotion
      ? "none"
      : `transform 320ms ${EASE}, opacity 320ms ${EASE}, height 320ms ${EASE}`,
  }
  const contentAnchorStyle: CSSProperties = {
    top: "50%",
  }
  const textBlockClass = isLeftStage ? "ml-auto w-fit max-w-[36ch] text-left" : "w-fit max-w-[36ch] text-left"

  const contentStyle: CSSProperties = {
    opacity: reached ? 1 : 0,
    transform: `translateY(${reducedMotion || reached ? 0 : 10}px)`,
    maxHeight: reached ? 320 : 0,
    pointerEvents: reached ? "auto" : "none",
    transition: reducedMotion
      ? "opacity 100ms linear, max-height 100ms linear"
      : `opacity 420ms ${EASE}, transform 420ms ${EASE}, max-height 420ms ${EASE}`,
  }

  return (
    <article
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${stage.desktop.x}%`, top: `${stage.desktop.y}%` }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-px w-[11px] -translate-y-1/2 bg-black/20"
        style={{
          transform: `translateX(${markerOffset > 0 ? 0 : -11}px)`,
        }}
      />
      <span
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-300"
        style={{
          left: `calc(50% + ${markerOffset}px)`,
          borderColor: reached ? "rgba(17,17,17,0.52)" : "rgba(17,17,17,0.24)",
          backgroundColor: reached ? "rgba(17,17,17,0.96)" : "#f6f4ef",
        }}
      />
      <span className="absolute top-1/2 z-0 bg-black" style={leadLineStyle} />

      <div
        className={`absolute z-10 flex w-[min(34vw,420px)] -translate-y-1/2 flex-col gap-3 ${sideClass}`}
        style={contentAnchorStyle}
      >
        <p
          className={`text-[13px] font-medium tracking-[0.14em] text-black uppercase ${
            isLeftStage ? "ml-auto w-fit pb-1 text-left" : "pb-1 text-left"
          }`}
        >
          {stage.time}
        </p>

        <div aria-hidden={!reached} className="w-full overflow-hidden pt-1" style={contentStyle}>
          <div className={textBlockClass}>
            <h3
              className="text-[clamp(22px,2.4vw,36px)] leading-[0.95] tracking-[-0.03em] text-left uppercase"
              style={{
                opacity: reached ? 1 : 0,
                transform: `translateY(${reducedMotion || reached ? 0 : 8}px)`,
                transition: reducedMotion
                  ? "opacity 100ms linear"
                  : `opacity 340ms ${EASE} 70ms, transform 340ms ${EASE} 70ms`,
              }}
            >
              {stage.title}
            </h3>

            <ul className="mt-3 space-y-2.5">
              {stage.points.map((point, pointIndex) => (
                <li key={point} className="flex items-start gap-2.5 text-[14px] leading-[1.34] text-black/80">
                  <span className="mt-[0.48rem] h-px w-3 shrink-0 bg-black/52" />
                  <span
                    className="text-left"
                    style={{
                      opacity: reached ? 1 : 0,
                      transform: `translateY(${reducedMotion || reached ? 0 : 10}px)`,
                      transition: reducedMotion
                        ? "opacity 100ms linear"
                        : `opacity 340ms ${EASE} ${140 + pointIndex * 75}ms, transform 340ms ${EASE} ${
                            140 + pointIndex * 75
                          }ms`,
                    }}
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}

function MobileStage({
  stage,
  reached,
  reducedMotion,
}: {
  stage: Stage
  reached: boolean
  reducedMotion: boolean
}) {
  const markerOffset = 12
  const mobileLeadLineStyle: CSSProperties = {
    left: "calc(50% + 16px)",
    width: "108px",
    height: reached ? 2 : 1,
    opacity: reached ? 0.78 : 0.34,
    transform: `translateY(-50%) scaleX(${reached ? 1 : 0.5})`,
    transformOrigin: "left center",
    transition: reducedMotion
      ? "none"
      : `transform 300ms ${EASE}, opacity 300ms ${EASE}, height 300ms ${EASE}`,
  }
  const contentStyle: CSSProperties = {
    opacity: reached ? 1 : 0,
    transform: `translateY(${reducedMotion || reached ? 0 : 10}px)`,
    maxHeight: reached ? 230 : 0,
    pointerEvents: reached ? "auto" : "none",
    transition: reducedMotion
      ? "opacity 100ms linear, max-height 100ms linear"
      : `opacity 380ms ${EASE}, transform 380ms ${EASE}, max-height 380ms ${EASE}`,
  }

  return (
    <article
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${stage.mobile.x}%`, top: `${stage.mobile.y}%` }}
    >
      <span
        className="absolute left-1/2 top-1/2 h-px w-[9px] -translate-y-1/2 bg-black/20"
      />
      <span
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-300"
        style={{
          left: `calc(50% + ${markerOffset}px)`,
          borderColor: reached ? "rgba(17,17,17,0.52)" : "rgba(17,17,17,0.24)",
          backgroundColor: reached ? "rgba(17,17,17,0.96)" : "#f6f4ef",
        }}
      />
      <span className="absolute top-1/2 z-0 bg-black" style={mobileLeadLineStyle} />

      <p
        className="absolute left-1/2 top-[-24px] -translate-x-1/2 whitespace-nowrap pb-1 text-[11px] font-medium tracking-[0.13em] text-black uppercase"
      >
        {stage.time}
      </p>

      <div
        aria-hidden={!reached}
        className="absolute left-[calc(50%+30px)] top-[20px] z-10 w-[min(72vw,320px)] overflow-hidden pt-1"
        style={contentStyle}
      >
        <div className="w-full">
          <h3
            className="text-[24px] leading-[0.96] tracking-[-0.03em] uppercase"
            style={{
              opacity: reached ? 1 : 0,
              transform: `translateY(${reducedMotion || reached ? 0 : 8}px)`,
              transition: reducedMotion
                ? "opacity 100ms linear"
                : `opacity 320ms ${EASE} 60ms, transform 320ms ${EASE} 60ms`,
            }}
          >
            {stage.title}
          </h3>

          <ul className="mt-2.5 space-y-2">
            {stage.points.map((point, pointIndex) => (
              <li key={point} className="flex items-start gap-2 text-[12px] leading-[1.34] text-black/80">
                <span className="mt-[0.42rem] h-px w-2.5 shrink-0 bg-black/50" />
                <span
                  style={{
                    opacity: reached ? 1 : 0,
                    transform: `translateY(${reducedMotion || reached ? 0 : 10}px)`,
                    transition: reducedMotion
                      ? "opacity 100ms linear"
                      : `opacity 320ms ${EASE} ${130 + pointIndex * 70}ms, transform 320ms ${EASE} ${
                          130 + pointIndex * 70
                        }ms`,
                  }}
                >
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function DesktopFork({ reached, reducedMotion }: { reached: boolean; reducedMotion: boolean }) {
  const branchStyle: CSSProperties = {
    opacity: reached ? 1 : 0.56,
    transform: `translateY(${reducedMotion || reached ? 0 : 9}px)`,
    transition: reducedMotion ? "none" : `opacity 420ms ${EASE}, transform 420ms ${EASE}`,
  }

  return (
    <>
      <article className="absolute left-[8%] top-[99.1%] w-[min(20vw,300px)] -translate-y-1/2 text-left" style={branchStyle}>
        <h4 className="text-[13px] tracking-[0.16em] text-black/90 uppercase">ГОТОВЫЙ ПРОДУКТ</h4>
        <p className="mt-2 text-[14px] leading-[1.35] text-black/66">Мы не бросаем свои труды после хакатона.</p>
      </article>

      <article
        className="absolute left-[80%] top-[99.1%] w-[min(18vw,260px)] -translate-y-1/2 text-left"
        style={branchStyle}
      >
        <h4 className="text-[13px] tracking-[0.16em] text-black/90 uppercase">ПОРТФОЛИО</h4>
        <p className="mt-2 text-[14px] leading-[1.35] text-black/66">
          Каждая деталь показывает наш уровень и навыки.
        </p>
      </article>
    </>
  )
}

function MobileFork({ reached, reducedMotion }: { reached: boolean; reducedMotion: boolean }) {
  const branchStyle: CSSProperties = {
    opacity: reached ? 1 : 0.56,
    transform: `translateY(${reducedMotion || reached ? 0 : 8}px)`,
    transition: reducedMotion ? "none" : `opacity 380ms ${EASE}, transform 380ms ${EASE}`,
  }

  return (
    <div className="absolute inset-x-3 top-[97.9%] flex -translate-y-1/2 gap-2.5">
      <article className="w-1/2 border border-black/10 bg-[#f8f5f0]/85 px-3 py-3" style={branchStyle}>
        <h4 className="text-[10px] tracking-[0.16em] text-black/90 uppercase">ГОТОВЫЙ ПРОДУКТ</h4>
        <p className="mt-1.5 text-[11px] leading-[1.3] text-black/66">Мы не бросаем свои труды после хакатона.</p>
      </article>

      <article className="w-1/2 border border-black/10 bg-[#f8f5f0]/85 px-3 py-3" style={branchStyle}>
        <h4 className="text-[10px] tracking-[0.16em] text-black/90 uppercase">ПОРТФОЛИО</h4>
        <p className="mt-1.5 text-[11px] leading-[1.3] text-black/66">Каждая деталь показывает наш уровень и навыки.</p>
      </article>
    </div>
  )
}

export default function WorksPage() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncReducedMotion = () => setReducedMotion(mediaQuery.matches)

    syncReducedMotion()
    mediaQuery.addEventListener("change", syncReducedMotion)

    return () => {
      mediaQuery.removeEventListener("change", syncReducedMotion)
    }
  }, [])

  useEffect(() => {
    let frameId: number | null = null

    const measureProgress = () => {
      frameId = null
      const sectionElement = sectionRef.current
      if (!sectionElement) return

      const rect = sectionElement.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const anchorY = viewportHeight * 0.5
      const rawProgress = clamp((anchorY - rect.top) / Math.max(rect.height, 1), 0, 1)
      const nextProgress = rawProgress >= FORK_START_PROGRESS ? 1 : rawProgress

      setProgress((previous) => (Math.abs(previous - nextProgress) > 0.001 ? nextProgress : previous))
    }

    const requestMeasure = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(measureProgress)
    }

    measureProgress()

    window.addEventListener("scroll", requestMeasure, { passive: true })
    window.addEventListener("resize", requestMeasure)

    return () => {
      window.removeEventListener("scroll", requestMeasure)
      window.removeEventListener("resize", requestMeasure)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  const finalReached = progress >= FORK_START_PROGRESS

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#f6f4ef] text-[#111111]">
      <RouteAtmosphere blobs={vectorAtmosphereBlobs} />

      <section className="relative z-10 mx-auto max-w-[1320px] px-5 pb-10 pt-[clamp(76px,9vh,114px)] md:px-10 md:pb-14">
        <p className="text-[11px] tracking-[0.24em] text-black/54 uppercase">ВЕКТОР / 48 ЧАСОВ</p>
        <h1 className="mt-4 max-w-[11ch] text-[clamp(46px,8vw,126px)] leading-[0.84] tracking-[-0.05em] uppercase">
          ПУТЬ ОТ КЕЙСА К ЗАЩИТЕ
        </h1>
      </section>

      <section ref={sectionRef} className="relative z-10 mx-auto max-w-[1500px] px-4 pb-20 md:px-8">
        <div className="relative hidden h-[5200px] md:block">
          <RoadLayer
            mainPath={desktopMainPath}
            leftBranchPath={desktopLeftBranchPath}
            rightBranchPath={desktopRightBranchPath}
            progress={progress}
          />

          {stages.map((stage) => (
            <DesktopStage
              key={stage.id}
              stage={stage}
              reached={progress >= stage.desktop.y / 100}
              reducedMotion={reducedMotion}
            />
          ))}

          <DesktopFork reached={finalReached} reducedMotion={reducedMotion} />
        </div>

        <div className="relative h-[4300px] md:hidden">
          <RoadLayer
            mainPath={mobileMainPath}
            leftBranchPath={mobileLeftBranchPath}
            rightBranchPath={mobileRightBranchPath}
            progress={progress}
          />

          {stages.map((stage) => (
            <MobileStage
              key={stage.id}
              stage={stage}
              reached={progress >= stage.mobile.y / 100}
              reducedMotion={reducedMotion}
            />
          ))}

          <MobileFork reached={finalReached} reducedMotion={reducedMotion} />
        </div>
      </section>
      <div aria-hidden className="h-[34vh] md:h-[46vh]" />
    </main>
  )
}
