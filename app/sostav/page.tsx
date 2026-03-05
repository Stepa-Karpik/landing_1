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
    title: "Business",
    competencies: ["Business", "Management", "Backend", "Product", "Marketing", "Delivery", "Pitch"],
  },
  {
    id: "backend",
    index: "03",
    title: "Backend",
    competencies: ["Backend", "Web", "Security", "Delivery"],
  },
  {
    id: "ios",
    index: "04",
    title: "iOS",
    competencies: ["Mobile iOS", "UI/UX", "Delivery"],
  },
  {
    id: "android-kotlin",
    index: "05",
    title: "Android",
    competencies: ["Mobile Android", "Security", "Delivery"],
  },
  {
    id: "frontend",
    index: "06",
    title: "Frontend",
    competencies: ["Frontend", "Web", "UI/UX", "Marketing", "Pitch", "Delivery"],
  },
]

const competencyTags = [
  "Architecture",
  "Business",
  "Management",
  "Product",
  "Backend",
  "Frontend",
  "Web",
  "Mobile iOS",
  "Mobile Android",
  "UI/UX",
  "Security",
  "Marketing",
  "Pitch",
  "Delivery",
]

const principles = [
  "Работать — системно.",
  "Работать — быстро.",
  "Работать — строго.",
  "Работать — в единой логике продукта.",
  "Работать — без хаотичных передач.",
  "Работать — до уверенной защиты.",
]

const winHighlights = [
  { title: "Студенческий стартап", year: "2020" },
  { title: "Кейс чемпионат от Т2", year: "2024" },
  { title: "UMIRhack", year: "2025" },
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
                <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">6 человек как система</p>
                <h1 className="mt-3 text-[clamp(52px,9.8vw,142px)] leading-[0.82] tracking-[-0.05em]">СОСТАВ</h1>
              </div>
            </FadeInBlock>

            <FadeInBlock delay={0.08}>
              <p className="max-w-[42ch] text-[clamp(18px,2.2vw,30px)] leading-[1.24] text-[#111]/82">
                1 ИП + 5 разработчиков-студентов. Закрываем продукт целиком: от архитектуры до упаковки. Работаем
                быстро, чисто и системно.
              </p>
            </FadeInBlock>
          </div>

          <FadeInBlock delay={0.15} className="mt-7 border-t border-black/12 pt-4 md:mt-10">
            <p className="text-[11px] tracking-[0.12em] text-[#111]/56">
              В составе есть опыт побед в стартапах, хакатонах и конкурсах.
            </p>
            <div className="mt-3 w-full max-w-[560px] border-y border-black/12">
              {winHighlights.map((item, index) => (
                <p
                  key={`${item.title}-${item.year}`}
                  className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 border-b border-black/10 py-2.5 last:border-b-0"
                >
                  <span className="text-[10px] tracking-[0.2em] text-[#111]/42">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[11px] tracking-[0.12em] text-[#111]/78 uppercase">{item.title}</span>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[#111]/52">{item.year}</span>
                </p>
              ))}
            </div>
          </FadeInBlock>
        </section>

        <section className="border-t border-black/12 py-[clamp(88px,10vh,120px)]">
        
          <FadeInBlock>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div>
                <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">Ролевой каркас</p>
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
                        className="w-full border-b border-black/12 bg-transparent py-4 text-left transition-[opacity,transform,border-color] duration-[220ms] ease-out hover:border-black/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                        style={{
                          opacity: highlighted ? 1 : 0.36,
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
                <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">Покрытие компетенций</p>
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
                        className="rounded-full border bg-transparent px-3.5 py-1.5 text-[11px] tracking-[0.11em] uppercase transition-[opacity,transform,border-color] duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
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

        <section className="border-t border-black/12 py-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <p className="text-[11px] tracking-[0.22em] text-[#111]/56 uppercase">Принципы внутри команды</p>
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
                  staggerChildren: 0.11,
                },
              },
            }}
            className="mt-8 space-y-6 md:space-y-8"
          >
            {principles.map((line) => (
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
                className="text-[clamp(28px,4.1vw,62px)] leading-[1.04] tracking-[-0.03em]"
              >
                {line}
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section className="border-t border-black/12 pt-[clamp(88px,10vh,120px)]">
          <FadeInBlock>
            <p className="max-w-[44ch] text-[clamp(22px,2.8vw,40px)] leading-[1.18] tracking-[-0.02em] text-[#111]/88">
              48 часов — это не марафон идей. Это дисциплина решений: быстро понять кейс, собрать архитектуру,
              разделить ответственность и довести MVP до уверенной защиты.
            </p>
          </FadeInBlock>

          <FadeInBlock delay={0.08} className="mt-7 border-t border-black/12 pt-4">
            <p className="text-[11px] tracking-[0.11em] text-[#111]/56">
              Команда собрана так, чтобы не было узких мест: каждый слой продукта закрыт.
            </p>
          </FadeInBlock>
        </section>
      </div>
    </main>
  )
}
