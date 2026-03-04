"use client"

import { motion, useInView } from "framer-motion"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"

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
  databaseScope: string
  stack: string[]
}

const roleRows: RoleRow[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    competencies: ["React", "TypeScript", "Next.js", "Motion", "UI/UX", "PostgreSQL", "Delivery"],
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    competencies: ["Node.js", "Express", "Python", "FastAPI", "Flask", "GraphQL", "REST API", "Security", "PostgreSQL"],
  },
  {
    id: "mobile-ios",
    index: "03",
    title: "Mobile iOS",
    competencies: ["Swift", "SwiftUI", "Objective-C", "UIKit", "API Integration", "Delivery", "PostgreSQL"],
  },
  {
    id: "mobile-android",
    index: "04",
    title: "Mobile Android",
    competencies: ["Kotlin", "Jetpack Compose", "Coroutines", "Retrofit", "API Integration", "Delivery", "PostgreSQL"],
  },
  {
    id: "design",
    index: "05",
    title: "Design",
    competencies: ["Figma", "PowerPoint", "Photoshop", "Illustrator", "Nano Banana", "Motion", "UI/UX", "Pitch", "Delivery"],
  },
]

const competencyTags = [
  "React",
  "Python",
  "Figma",
  "Swift",
  "Kotlin",
  "TypeScript",
  "FastAPI",
  "PowerPoint",
  "SwiftUI",
  "Jetpack Compose",
  "Next.js",
  "Express",
  "Photoshop",
  "Objective-C",
  "GraphQL",
  "Nano Banana",
  "Coroutines",
  "HTML5",
  "Flask",
  "Illustrator",
  "Retrofit",
  "Node.js",
  "Motion",
  "REST API",
  "CSS3",
  "PostgreSQL",
  "SASS",
  "UI/UX",
  "Security",
  "Delivery",
  "Pitch",
]

const stackDirections: StackDirection[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    summary: "Системный frontend-контур с быстрым delivery и сильной визуальной подачей.",
    databaseScope: " ",
    stack: [
      "React",
      "TypeScript",
      "Next.js",
      "Vite",
      "HTML5",
      "CSS3",
      "SASS",
      "Tailwind CSS",
      "Framer Motion",
      "GSAP",
      "Zustand",
      "Redux Toolkit",
      "TanStack Query",
      "SWR",
      "React Hook Form",
      "Zod",
      "Storybook",
      "Radix UI",
      "shadcn/ui",
      "Web Vitals",
      "Lighthouse",
      "PWA",
      "SSR",
      "ISR",
      "SSG",
      "i18n",
      "Playwright",
      "Vitest",
      "Cypress",
      "Socket.IO Client",
      "WebSocket",
      "Figma Tokens",
      "Design QA",
    ],
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    summary: "Backend-слой с архитектурой под рост, стабильностью и безопасностью.",
    databaseScope: " ",
    stack: [
      "Node.js",
      "Express",
      "Fastify",
      "NestJS",
      "TypeScript",
      "Python",
      "FastAPI",
      "Flask",
      "Django REST",
      "GraphQL",
      "REST API",
      "gRPC",
      "WebSocket Gateway",
      "OpenAPI",
      "Swagger",
      "Pydantic",
      "SQLAlchemy",
      "Prisma",
      "Alembic",
      "PostgreSQL",
      "PostGIS",
      "Query Optimization",
      "Connection Pooling",
      "JWT/Auth",
      "OAuth2",
      "Rate Limiting",
      "Background Jobs",
      "RabbitMQ",
      "Celery",
      "Docker",
      "Nginx",
      "CI/CD",
      "Sentry",
      "Prometheus",
      "Grafana",
      "Pytest",
      "Jest",
    ],
  },
  {
    id: "mobile-ios",
    index: "03",
    title: "Mobile iOS",
    summary: "Нативный iOS-контур с фокусом на качество UX и стабильную доставку фич.",
    databaseScope: " ",
    stack: [
      "Swift",
      "SwiftUI",
      "Objective-C",
      "UIKit",
      "Combine",
      "Async/Await",
      "URLSession",
      "Alamofire",
      "MVVM",
      "Coordinator",
      "Dependency Injection",
      "Xcode",
      "Swift Package Manager",
      "CocoaPods",
      "TestFlight",
      "Fastlane",
      "Lottie",
      "MapKit",
      "CoreLocation",
      "Push Notifications",
      "Deep Links",
      "WidgetKit",
      "App Clips",
      "Accessibility",
      "Instruments",
      "Snapshot Testing",
      "UI Testing",
      "Unit Testing",
      "API Integration",
      "Delivery Build",
    ],
  },
  {
    id: "mobile-android",
    index: "04",
    title: "Mobile Android",
    summary: "Android-контур на Kotlin/Compose с современным UI и контролируемой архитектурой.",
    databaseScope: " ",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "Android SDK",
      "Coroutines",
      "Flow",
      "Retrofit",
      "OkHttp",
      "Ktor Client",
      "MVVM",
      "Clean Architecture",
      "Hilt",
      "Koin",
      "Navigation Component",
      "WorkManager",
      "Material 3",
      "Room",
      "Android Studio",
      "Gradle",
      "KSP",
      "Lottie",
      "Coil",
      "Firebase Crashlytics",
      "Push Notifications",
      "Deep Links",
      "Play Console",
      "Macrobenchmark",
      "Espresso",
      "Unit Testing",
      "UI Testing",
      "Room-ready Architecture",
      "API Integration",
    ],
  },
  {
    id: "design",
    index: "05",
    title: "Design",
    summary: "Визуальный контур для продукта и защиты: от UX-каркаса до pitch-материалов.",
    databaseScope: " ",
    stack: [
      "Figma",
      "FigJam",
      "Auto Layout",
      "Components",
      "Variants",
      "Design Tokens",
      "Prototype",
      "Interaction Design",
      "PowerPoint",
      "Pitch Deck",
      "Keynote",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe After Effects",
      "Nano Banana",
      "Runway",
      "Midjourney",
      "Rive",
      "Framer",
      "Motion Specs",
      "Icon Systems",
      "Typography Systems",
      "Grid Systems",
      "Wireframing",
      "User Flow",
      "Information Architecture",
      "Brand Systems",
      "Visual Storytelling",
      "Presentation Design",
      "Design QA",
      "UX Research",
    ],
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
    <div className="relative overflow-hidden border-b border-black/18 last:border-b-0">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#f8f6f1] to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#f8f6f1] to-transparent md:w-28" />

      <div
        className="flex w-max items-center gap-3.5 py-3.5 md:py-4 animate-marquee"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {repeatedItems.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="shrink-0 rounded-full border border-black/16 bg-[#f6f4ef] px-4 py-1.5 text-[12px] tracking-[0.1em] text-[#111]/74 uppercase md:px-5 md:py-2 md:text-[13px]"
          >
            {item}
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
    <div className="flex justify-center">
      <motion.section
        ref={ref}
        initial={{ opacity: 0, y: 22 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.56, delay: index * 0.08, ease: REVEAL_EASE }}
        className="w-full"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(260px,0.34fr)_minmax(0,0.66fr)] md:items-end md:gap-10">
          <h2 className="text-[clamp(32px,3.9vw,58px)] leading-[0.9] tracking-[-0.03em] font-semibold text-[#111111]">
            {direction.title}
          </h2>
          <p className="max-w-[62ch] text-[clamp(16px,1.35vw,22px)] leading-[1.32] text-[#111]/78">{direction.summary}</p>
        </div>

        <div className="mt-5 border-y border-black/20">
          <TechLane items={lanes[0]} direction="right" duration={42 + index * 2} />
          <TechLane items={lanes[1]} direction="left" duration={36 + index * 2} />
          <TechLane items={lanes[2]} direction="right" duration={46 + index * 2} />
        </div>

        {direction.databaseScope.trim().length > 0 && (
          <p className="mt-4 text-[11px] leading-[1.5] tracking-[0.12em] text-[#111]/56 uppercase">{direction.databaseScope}</p>
        )}
      </motion.section>
    </div>
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
    <main className="min-h-screen bg-[#f6f4ef] text-[#111111]">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-14 md:pb-24 md:pt-20">
        <section className="pb-16 md:pb-24">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] xl:items-end xl:gap-12">
            <h1
              className="min-w-0 max-w-[11ch] text-[clamp(42px,6.2vw,92px)] leading-[0.86] tracking-[-0.045em]"
              style={{
                opacity: introVisible ? 1 : 0,
                transform: introVisible ? "translateY(0px)" : "translateY(40px)",
                transition: `opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)`,
              }}
            >
              СТЭК ТЕХНОЛОГИЙ
            </h1>

            <p
              className="min-w-0 max-w-[38ch] text-[clamp(18px,2.2vw,30px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82 xl:justify-self-end"
              style={{
                opacity: introVisible ? 1 : 0,
                transition: `opacity 420ms cubic-bezier(0.22,1,0.36,1) 140ms`,
              }}
            >
              Система под капотом. Мы используем лучшие решения для быстрого и качественного выполнения задач.
            </p>
          </div>
          <p className="mt-7 max-w-[78ch] text-[11px] tracking-[0.12em] text-[#111]/58 uppercase">
            5 направлений, единая инженерная логика. Web Frontend, Web Backend, Mobile iOS, Mobile Android, Design.
          </p>
        </section>

        <section className="border-t border-black/12 py-16 md:py-24">
          <FadeInBlock>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">Ролевой каркас стека</p>
                <div className="mt-7">
                  {roleRows.map((role) => {
                    const highlighted = isRoleHighlighted(role)

                    return (
                      <button
                        key={role.id}
                        type="button"
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
                        className="w-full border-b border-black/12 bg-transparent py-4 text-left transition-[opacity,transform,border-color] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-black/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.34,
                          transform: `translateY(${highlighted ? 0 : 6}px)`,
                        }}
                      >
                        <div className="flex gap-4 md:items-baseline md:gap-7">
                          <span className="shrink-0 text-[11px] tracking-[0.22em] text-[#111]/56">{role.index}</span>
                          <span className="text-[clamp(20px,2.7vw,34px)] leading-[1.08] tracking-[-0.02em]">
                            {role.title}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">Покрытие технологий</p>
                <div className="mt-7 flex flex-wrap gap-2.5">
                  {competencyTags.map((competency) => {
                    const highlighted = isCompetencyHighlighted(competency)

                    return (
                      <button
                        key={competency}
                        type="button"
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
                        className="rounded-full border bg-transparent px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase transition-[opacity,transform,border-color] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.32,
                          transform: `translateY(${highlighted ? 0 : 6}px)`,
                          borderColor: highlighted ? "rgba(17,17,17,0.24)" : "rgba(17,17,17,0.14)",
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

        <section className="border-t border-black/12 py-16 md:py-24">
          <div className="space-y-4 md:space-y-6">
            {stackDirections.map((direction, index) => (
              <StackDirectionShowcase key={direction.id} direction={direction} index={index} />
            ))}
          </div>
        </section>

        <section className="border-t border-black/12 py-16 md:py-24">
          <FadeInBlock>
            <article className="rounded-[24px] border border-black/12 bg-[#f8f6f1] p-[clamp(18px,3vw,34px)]">
              <p className="text-[11px] tracking-[0.2em] text-[#111]/56 uppercase">Data Layer</p>
              <h2 className="mt-3 text-[clamp(30px,4.2vw,64px)] leading-[0.9] tracking-[-0.03em]">PostgreSQL</h2>
              <p className="mt-4 max-w-[58ch] text-[clamp(16px,1.45vw,22px)] leading-[1.28] text-[#111]/82">
                PostgreSQL используется как единая база данных для web и mobile-контуров. Design-направление не работает
                с базой напрямую, но учитывает data-flow в интерфейсных и презентационных сценариях.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-black/18 px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase">
                  Web Frontend
                </span>
                <span className="rounded-full border border-black/18 px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase">
                  Web Backend
                </span>
                <span className="rounded-full border border-black/18 px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase">
                  Mobile iOS
                </span>
                <span className="rounded-full border border-black/18 px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase">
                  Mobile Android
                </span>
                <span className="rounded-full border border-black/10 px-3.5 py-1.5 text-[11px] tracking-[0.11em] text-[#111]/48 uppercase">
                  Design (без прямого доступа)
                </span>
              </div>
            </article>
          </FadeInBlock>
        </section>

        <section ref={finalRef} className="border-t border-black/12 pt-16 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={finalInView ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.56, ease: REVEAL_EASE }}
            className="max-w-[66ch]"
          >
            <h2 className="text-[clamp(38px,7.3vw,108px)] leading-[0.88] tracking-[-0.045em]">
              НАШ ТЕХНОЛОГИЧЕСКИЙ ПОТЕНЦИАЛ
            </h2>
            <p className="mt-6 max-w-[44ch] text-[clamp(17px,2vw,28px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82">
              Каждая из технологий решает свою задачу в рамках общего подхода. Результат: быстро, эффективно и с
              высоким качеством.
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
