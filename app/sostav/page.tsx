"use client"

import { motion, useInView } from "framer-motion"
import { type ReactNode, useMemo, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface RoleRow {
  id: string
  index: string
  title: string
  competencies: string[]
}

interface WinHighlight {
  title: string
  year: string
  description: string
}

const roleRows: RoleRow[] = [
  {
    id: "lead-architecture",
    index: "01",
    title: "Team Lead",
    competencies: ["Architecture", "Product", "Web", "UI/UX", "Delivery", "Pitch"],
  },
  {
    id: "business-management-backend",
    index: "02",
    title: "Business & Backend",
    competencies: ["Business", "Management", "Backend", "Product", "Delivery"],
  },
  {
    id: "backend",
    index: "03",
    title: "Backend",
    competencies: ["Backend", "API", "Data", "Reliability"],
  },
  {
    id: "design",
    index: "04",
    title: "Design",
    competencies: ["Design Systems", "UI/UX", "Motion", "Presentation"],
  },
  {
    id: "android-kotlin",
    index: "05",
    title: "Android",
    competencies: ["Mobile Android", "Performance", "Delivery"],
  },
  {
    id: "frontend",
    index: "06",
    title: "Frontend",
    competencies: ["Frontend", "Web", "Motion", "UI/UX", "Delivery"],
  },
]

const competencyTags = [
  "Architecture",
  "Business",
  "Management",
  "Product",
  "Backend",
  "API",
  "Data",
  "Reliability",
  "Frontend",
  "Web",
  "Design Systems",
  "Mobile Android",
  "UI/UX",
  "Performance",
  "Motion",
  "Presentation",
  "Pitch",
  "Delivery",
]

const principles = [
  "Сначала услышать задачу и собрать фокус.",
  "Двигаться быстро, но без суеты между ролями.",
  "Держать одну продуктовую логику от первого экрана до API.",
  "Передавать работу без потерь, а не перекидывать её дальше.",
  "Оставлять в MVP только то, что усиливает демонстрацию.",
  "Выходить на защиту с ощущением уже собранного продукта.",
]

const winHighlights: WinHighlight[] = [
  {
    title: "Студенческий стартап",
    year: "2020",
    description: "Опыт, где идея быстро превращалась в защищаемый продуктовый сценарий.",
  },
  {
    title: "Кейс-чемпионат T2",
    year: "2024",
    description: "Реальная проверка темпа, структуры решений и командной синхронизации.",
  },
  {
    title: "UMIRhack",
    year: "2025",
    description: "Результат, в котором MVP уже ощущался как цельный рабочий продукт.",
  },
]

const sostavAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "sostav-blue",
    color: "#95b3e2",
    size: "clamp(760px,72vw,1180px)",
    top: "18%",
    left: "-10%",
    maxShift: 100,
  },
  {
    id: "sostav-rose",
    color: "#c999d8",
    size: "clamp(620px,58vw,920px)",
    top: "-8%",
    left: "58%",
    opacity: 0.25,
    maxShift: 92,
  },
  {
    id: "sostav-lavender",
    color: "#b5ace2",
    size: "clamp(560px,52vw,840px)",
    top: "56%",
    left: "62%",
    opacity: 0.22,
    maxShift: 84,
  },
]

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

export default function SostavPage() {
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [activeCompetency, setActiveCompetency] = useState<string | null>(null)
  const principlesRef = useRef<HTMLUListElement | null>(null)
  const principlesInView = useInView(principlesRef, { once: true, margin: "-90px" })

  const rolesById = useMemo(() => new Map(roleRows.map((role) => [role.id, role])), [])
  const activeRole = activeRoleId ? rolesById.get(activeRoleId) : null

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
      <RouteAtmosphere blobs={sostavAtmosphereBlobs} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[clamp(90px,10vh,120px)] pt-[clamp(82px,9vh,116px)]">
        <section className="pb-[clamp(88px,10vh,120px)]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-12">
            <FadeInBlock>
              <div>
                <h1 className="text-[clamp(52px,9.8vw,142px)] leading-[0.82] tracking-[-0.05em]">СОСТАВ</h1>
                <div className="mt-7 h-[2px] w-[clamp(102px,18vw,184px)] bg-gradient-to-r from-[#4a8fe4]/76 via-[#7a4fd8]/72 to-transparent" />
              </div>
            </FadeInBlock>

            <FadeInBlock delay={0.08}>
              <p className="max-w-[42ch] text-[clamp(18px,2.2vw,30px)] leading-[1.24] text-[#111]/82">
                Команда собрана так, чтобы идея не зависала между ролями. От архитектуры и backend до интерфейса, Android и финальной подачи всё движется в одном темпе.
              </p>
            </FadeInBlock>
          </div>

          <FadeInBlock delay={0.15} className="mt-10">
            <div className="grid gap-4 md:grid-cols-3">
              {winHighlights.map((item, index) => (
                <article
                  key={`${item.title}-${item.year}`}
                  className="soft-gradient-card soft-gradient-rails rounded-[24px] bg-[linear-gradient(145deg,rgba(255,255,255,0.36),rgba(248,245,240,0.86))] px-5 py-5 shadow-[0_18px_40px_rgba(17,17,17,0.04)]"
                  style={{
                    transitionDelay: `${index * 80}ms`,
                  }}
                >
                  <span className="soft-gradient-chip inline-flex rounded-full px-3 py-1 text-[11px] tracking-[0.18em] text-[#111]/58 uppercase">
                    {item.year}
                  </span>
                  <h2 className="mt-5 text-[clamp(20px,2.2vw,30px)] leading-[1.02] tracking-[-0.03em]">{item.title}</h2>
                  <p className="mt-3 text-[15px] leading-[1.42] text-[#111]/68">{item.description}</p>
                </article>
              ))}
            </div>
          </FadeInBlock>
        </section>

        <section className="soft-gradient-section py-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-[#111]/46 uppercase">Роли</p>
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
                        className="soft-gradient-divider group relative w-full bg-transparent py-4 text-left transition-[opacity,transform] duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.36,
                          transform: `translateY(${highlighted ? 0 : 6}px)`,
                        }}
                      >
                        <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-[clamp(84px,14vw,130px)] origin-left scale-x-0 bg-gradient-to-r from-[#4a8fe4]/78 via-[#7a4fd8]/70 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
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
                <p className="text-[11px] tracking-[0.22em] text-[#111]/46 uppercase">Компетенции</p>
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
                        className="soft-gradient-chip rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase transition-[opacity,transform,border-color,box-shadow] duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
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
          <FadeInBlock>
            <h2 className="max-w-[14ch] text-[clamp(34px,5vw,74px)] leading-[0.94] tracking-[-0.04em]">
              Принципы, которые держат команду собранной
            </h2>
          </FadeInBlock>

          <motion.ul
            ref={principlesRef}
            initial="hidden"
            animate={principlesInView ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 0.08,
                  staggerChildren: 0.09,
                },
              },
            }}
            className="mt-10"
          >
            {principles.map((line, index) => (
              <motion.li
                key={line}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.64,
                      ease: REVEAL_EASE,
                    },
                  },
                }}
                className="group soft-gradient-divider relative grid gap-5 py-6 pl-5 pr-5 md:grid-cols-[76px_minmax(0,1fr)] md:items-start md:gap-8"
              >
                <span className="absolute left-0 inset-y-0 w-[2px] origin-bottom scale-y-0 rounded-full bg-gradient-to-b from-[#7a4fd8] to-[#4a8fe4] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="absolute right-0 inset-y-0 w-[2px] origin-top scale-y-0 rounded-full bg-gradient-to-b from-[#7a4fd8] to-[#4a8fe4] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="pointer-events-none mt-1 block select-none text-[clamp(40px,4.8vw,62px)] leading-none tracking-[-0.06em] text-black/12">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[clamp(23px,3vw,44px)] leading-[1.08] tracking-[-0.03em]">{line}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section className="soft-gradient-section pt-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <div className="max-w-[48ch] pb-6">
              <div className="mb-6 h-[2px] w-[clamp(120px,24vw,220px)] bg-gradient-to-r from-[#4a8fe4]/82 via-[#7a4fd8]/78 to-transparent" />
              <p className="text-[clamp(22px,2.8vw,40px)] leading-[1.18] tracking-[-0.02em] text-[#111]/88">
                48 часов для нас не про героизм. Это короткий маршрут от смысла к собранному MVP, где каждое решение успевает дойти до рабочего состояния.
              </p>
              <p className="mt-6 text-[15px] leading-[1.5] text-[#111]/62">
                Здесь нет узких мест: когда один слой ускоряется, следующий уже готов его подхватить без хаоса и лишних передач.
              </p>
            </div>
          </FadeInBlock>
        </section>
      </div>
    </main>
  )
}
