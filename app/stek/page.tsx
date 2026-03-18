"use client"

import { motion, useInView } from "framer-motion"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface RoleRow {
  id: string
  index: string
  title: string
  competencies: string[]
}

interface StackDirection {
  id: string
  index: string
  title: string
  summary: string
  stack: string[]
}

const roleRows: RoleRow[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    competencies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Delivery"],
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    competencies: ["Python", "Node.js", "FastAPI", "REST API", "PostgreSQL", "Docker", "Security"],
  },
  {
    id: "design",
    index: "03",
    title: "Design",
    competencies: ["Figma", "Photoshop", "Illustrator", "Motion", "Prototype", "Design Systems", "OpenAI"],
  },
  {
    id: "mobile-android",
    index: "04",
    title: "Mobile Android",
    competencies: ["Kotlin", "Jetpack Compose", "Coroutines", "Retrofit", "API Integration", "Delivery"],
  },
]

const competencyTags = [
  "React",
  "Python",
  "Figma",
  "Kotlin",
  "Next.js",
  "Node.js",
  "Photoshop",
  "Jetpack Compose",
  "TypeScript",
  "FastAPI",
  "Illustrator",
  "Coroutines",
  "Tailwind CSS",
  "REST API",
  "Motion",
  "Retrofit",
  "Framer Motion",
  "PostgreSQL",
  "Prototype",
  "API Integration",
  "OpenAI",
  "Docker",
  "Design Systems",
  "Security",
  "Delivery",
]

const stackDirections: StackDirection[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    summary: "Интерфейсный слой, который ощущается цельным, быстрым и собранным даже в спринтовом темпе.",
    stack: [
      "React",
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Framer Motion",
      "Responsive UI",
      "Animation Systems",
      "UI Systems",
      "Performance",
      "Delivery",
    ],
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    summary: "Backend-контур без лишнего шума: надежные API, понятные данные и спокойная работа под нагрузкой.",
    stack: [
      "Python",
      "Node.js",
      "FastAPI",
      "REST API",
      "PostgreSQL",
      "Docker",
      "Security",
      "Service Contracts",
      "Data Modeling",
      "API Reliability",
    ],
  },
  {
    id: "design",
    index: "03",
    title: "Design",
    summary: "Визуальный и продуктовый дизайн, который помогает продукту выглядеть уверенно уже с первой демонстрации.",
    stack: [
      "Figma",
      "Photoshop",
      "Illustrator",
      "Motion",
      "Prototype",
      "Design Systems",
      "OpenAI",
      "Presentation Design",
      "Design QA",
      "Delivery-ready Assets",
    ],
  },
  {
    id: "mobile-android",
    index: "04",
    title: "Mobile Android",
    summary: "Android-реализация с чистым ритмом интерфейса, предсказуемой архитектурой и нормальной скоростью релиза.",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "Coroutines",
      "Retrofit",
      "API Integration",
      "Android SDK",
      "Performance",
      "Release Readiness",
      "Delivery",
    ],
  },
]

const sharedDataChips = ["Web Backend", "Mobile Android", "Web Frontend", "Contracts", "API Flow"]

const stekAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "stek-blue",
    color: "#95afe2",
    size: "clamp(760px,72vw,1180px)",
    top: "16%",
    left: "52%",
    maxShift: 100,
  },
  {
    id: "stek-violet",
    color: "#b6a4df",
    size: "clamp(640px,60vw,980px)",
    top: "-10%",
    left: "-8%",
    opacity: 0.24,
    maxShift: 90,
  },
  {
    id: "stek-pink",
    color: "#c99ad8",
    size: "clamp(560px,52vw,840px)",
    top: "58%",
    left: "4%",
    opacity: 0.22,
    maxShift: 84,
  },
]

function buildMarqueeLanes(items: string[]) {
  const base = Array.from(new Set(items))
  const pivot = Math.max(1, Math.floor(base.length / 3))
  const laneOne = base
  const laneTwo = [...base.slice(pivot), ...base.slice(0, pivot)].reverse()
  const evenItems = base.filter((_, index) => index % 2 === 0)
  const oddItems = base.filter((_, index) => index % 2 === 1)
  const laneThree = [...oddItems, ...evenItems]

  return [laneOne, laneTwo, laneThree] as const
}

function FadeInBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.82, delay, ease: REVEAL_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function TechLane({
  items,
  direction,
  duration,
}: {
  items: string[]
  direction: "left" | "right"
  duration: number
}) {
  const repeatedItems = [...items, ...items]

  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className="animate-marquee flex w-max items-center gap-3.5 py-3.5 md:py-4"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {repeatedItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="relative shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(74,143,228,0.34),rgba(122,79,216,0.28),rgba(255,255,255,0.42))] p-px"
          >
            <span className="block rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.32),rgba(255,255,255,0.12))] px-4 py-1.5 text-[12px] tracking-[0.1em] text-[#111]/74 uppercase backdrop-blur-[16px] [-webkit-backdrop-filter:blur(16px)] md:px-5 md:py-2 md:text-[13px]">
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function StackDirectionShowcase({ direction, index }: { direction: StackDirection; index: number }) {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-90px" })
  const lanes = useMemo(() => buildMarqueeLanes(direction.stack), [direction.stack])

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.56, delay: index * 0.08, ease: REVEAL_EASE }}
      className="px-[clamp(4px,0.7vw,8px)] py-[clamp(8px,1vw,12px)]"
    >
      <h2 className="text-[clamp(32px,3.9vw,58px)] leading-[0.9] tracking-[-0.03em] font-semibold text-[#111111]">
        {direction.title}
      </h2>

      <div className="mt-5 space-y-1">
        <TechLane items={lanes[0]} direction="right" duration={42 + index * 2} />
        <TechLane items={lanes[1]} direction="left" duration={36 + index * 2} />
        <TechLane items={lanes[2]} direction="right" duration={46 + index * 2} />
      </div>
    </motion.section>
  )
}

export default function StackPage() {
  const [introVisible, setIntroVisible] = useState(false)
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [activeCompetency, setActiveCompetency] = useState<string | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)
  const finalInView = useInView(finalRef, { once: true, margin: "-90px" })
  const rolesById = useMemo(() => new Map(roleRows.map((role) => [role.id, role])), [])

  const activeRole = activeRoleId ? rolesById.get(activeRoleId) : null

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reducedMotion.matches) {
      setIntroVisible(true)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIntroVisible(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const isRoleHighlighted = (role: RoleRow) => {
    if (activeRole) return role.id === activeRole.id
    if (activeCompetency) return role.competencies.includes(activeCompetency)
    return true
  }

  const isCompetencyHighlighted = (competency: string) => {
    if (activeRole) return activeRole.competencies.includes(competency)
    if (activeCompetency) return activeCompetency === competency
    return true
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f6f4ef] text-[#111111]">
      <RouteAtmosphere blobs={stekAtmosphereBlobs} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[clamp(90px,10vh,120px)] pt-[clamp(82px,9vh,116px)]">
        <section className="pb-[clamp(88px,10vh,120px)]">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] xl:items-end xl:gap-12">
            <div>
              <h1
                className="min-w-0 max-w-[11ch] text-[clamp(42px,6.2vw,92px)] leading-[0.86] tracking-[-0.045em]"
                style={{
                  opacity: introVisible ? 1 : 0,
                  transform: introVisible ? "translateY(0px)" : "translateY(40px)",
                  transition: `opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)`,
                }}
              >
                СТЭК
              </h1>
              <div className="pointer-events-none mt-7 h-[2px] w-[clamp(104px,18vw,188px)] bg-gradient-to-r from-[#4a8fe4]/76 via-[#7a4fd8]/72 to-transparent" />
            </div>

            <p
              className="min-w-0 max-w-[40ch] text-[clamp(18px,2.2vw,30px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82 xl:justify-self-end"
              style={{
                opacity: introVisible ? 1 : 0,
                transition: `opacity 420ms cubic-bezier(0.22,1,0.36,1) 140ms`,
              }}
            >
              Мы не коллекционируем технологии. Берем только тот набор, который помогает быстрее собрать сильный продукт и спокойно довести его до релиза или защиты.
            </p>
          </div>
        </section>

        <section className="soft-gradient-section py-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <div>
                  {roleRows.map((role) => {
                    const highlighted = isRoleHighlighted(role)

                    return (
                      <button
                        key={role.id}
                        type="button"
                        data-stack-id={`role-${role.id}`}
                        onMouseEnter={() => {
                          setActiveRoleId(role.id)
                          setActiveCompetency(null)
                        }}
                        onMouseLeave={() => setActiveRoleId(null)}
                        onFocus={() => {
                          setActiveRoleId(role.id)
                          setActiveCompetency(null)
                        }}
                        onBlur={() => setActiveRoleId(null)}
                        onClick={() => {
                          setActiveCompetency(null)
                          setActiveRoleId((previous) => (previous === role.id ? null : role.id))
                        }}
                        className="soft-gradient-divider group relative w-full bg-transparent py-4 text-left transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.34,
                          transform: `translateY(${highlighted ? 0 : 6}px)`,
                        }}
                      >
                        <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-[clamp(86px,14vw,132px)] origin-left scale-x-0 bg-gradient-to-r from-[#4a8fe4]/78 via-[#7a4fd8]/70 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
                        <div className="grid gap-2 md:grid-cols-[76px_minmax(0,1fr)] md:items-baseline">
                          <span className="text-[11px] tracking-[0.22em] text-[#111]/42 uppercase">{role.index}</span>
                          <span className="text-[clamp(20px,2.7vw,34px)] leading-[1.08] tracking-[-0.02em]">{role.title}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-2.5">
                  {competencyTags.map((competency) => {
                    const highlighted = isCompetencyHighlighted(competency)

                    return (
                      <button
                        key={competency}
                        type="button"
                        data-stack-id={`tech-${competency.toLowerCase().replace(/\s+/g, "-").replace(/[/.]/g, "-")}`}
                        onMouseEnter={() => {
                          setActiveCompetency(competency)
                          setActiveRoleId(null)
                        }}
                        onMouseLeave={() => setActiveCompetency(null)}
                        onFocus={() => {
                          setActiveCompetency(competency)
                          setActiveRoleId(null)
                        }}
                        onBlur={() => setActiveCompetency(null)}
                        onClick={() => {
                          setActiveRoleId(null)
                          setActiveCompetency((previous) => (previous === competency ? null : competency))
                        }}
                        className="soft-gradient-chip rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase transition-[opacity,transform,border-color,box-shadow] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.32,
                          transform: `translateY(${highlighted ? 0 : 6}px)`,
                        }}
                      >
                        {competency}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </FadeInBlock>
        </section>

        <section className="soft-gradient-section py-[clamp(88px,10vh,120px)]">
          <div className="space-y-4 md:space-y-6">
            {stackDirections.map((direction, index) => (
              <StackDirectionShowcase key={direction.id} direction={direction} index={index} />
            ))}
          </div>
        </section>

        <section className="soft-gradient-section py-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <article className="soft-gradient-card soft-gradient-rails rounded-[28px] bg-[linear-gradient(145deg,rgba(255,255,255,0.38),rgba(248,246,241,0.9))] p-[clamp(18px,3vw,34px)] shadow-[0_24px_60px_rgba(17,17,17,0.05)]">
              <div className="mb-6 h-[2px] w-[clamp(116px,22vw,208px)] bg-gradient-to-r from-[#4a8fe4]/78 via-[#7a4fd8]/72 to-transparent" />
              <p className="text-[11px] tracking-[0.22em] text-[#111]/46 uppercase">Общая основа</p>
              <h2 className="mt-3 text-[clamp(30px,4.2vw,64px)] leading-[0.9] tracking-[-0.03em]">PostgreSQL</h2>
              <p className="mt-4 max-w-[58ch] text-[clamp(16px,1.45vw,22px)] leading-[1.28] text-[#111]/82">
                Данные держатся на одной спокойной основе: backend отвечает за модель и логику, Android и web работают через понятные контракты, а дизайн учитывает этот flow еще до разработки.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {sharedDataChips.map((item) => (
                  <span key={item} className="soft-gradient-chip rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </FadeInBlock>
        </section>

        <section ref={finalRef} className="soft-gradient-section pt-[clamp(88px,10vh,120px)]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={finalInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.56, ease: REVEAL_EASE }}
            className="max-w-[62ch] pb-6"
          >
            <div className="mb-6 h-[2px] w-[clamp(120px,24vw,220px)] bg-gradient-to-r from-[#4a8fe4]/82 via-[#7a4fd8]/78 to-transparent" />
            <h2 className="text-[clamp(38px,7.3vw,108px)] leading-[0.88] tracking-[-0.045em]">
              Технологии здесь работают вместе, а не спорят друг с другом.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[clamp(17px,2vw,28px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82">
              Поэтому продукт собирается быстрее, выглядит цельнее и ощущается уверенно уже в первом рабочем показе.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
