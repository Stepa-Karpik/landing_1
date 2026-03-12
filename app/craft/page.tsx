"use client"

import { motion, useInView } from "framer-motion"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface SequenceStep {
  id: string
  index: string
  title: string
  description: string
}

interface ProtocolLine {
  id: string
  statement: string
  mark: string
}

const sequenceSteps: SequenceStep[] = [
  {
    id: "brief",
    index: "01",
    title: "Фиксируем рамку",
    description: "Собираем контекст кейса, критерии жюри и список ограничений до начала спринта.",
  },
  {
    id: "decision-map",
    index: "02",
    title: "Строим карту решений",
    description: "Сравниваем варианты по рискам, скорости и влиянию, затем выбираем рабочий вектор.",
  },
  {
    id: "tech-frame",
    index: "03",
    title: "Собираем технический каркас",
    description: "Проектируем архитектуру и контракты, чтобы разработка шла параллельно без блокеров.",
  },
  {
    id: "sprint-split",
    index: "04",
    title: "Запускаем спринт 48h",
    description: "Делим задачи по зонам ответственности и синхронизируемся короткими контрольными срезами.",
  },
  {
    id: "core-build",
    index: "05",
    title: "Доставляем ядро",
    description: "Реализуем критический пользовательский путь и поднимаем демонстрируемый MVP.",
  },
  {
    id: "hardening",
    index: "06",
    title: "Доводим до стабильности",
    description: "Проверяем продукт на баги, интеграционные сбои и UX-разрывы перед защитой.",
  },
  {
    id: "defense-story",
    index: "07",
    title: "Упаковываем защиту",
    description: "Собираем чёткий сторителлинг: проблема, решение, эффект и roadmap развития.",
  },
]

const protocolLines: ProtocolLine[] = [
  { id: "clarity", statement: "Сначала прояснить задачу. Потом писать код.", mark: "Signal" },
  { id: "scope", statement: "Держать реальный scope. Не обещать лишнее.", mark: "Scope" },
  { id: "ownership", statement: "У каждой части продукта есть владелец.", mark: "Ownership" },
  { id: "sync", statement: "Синхронизироваться часто. Решать отклонения сразу.", mark: "Rhythm" },
  { id: "quality", statement: "Полировать критические места до уверенного состояния.", mark: "Quality" },
  { id: "result", statement: "Финишировать только тем, что можно защитить и запустить.", mark: "Result" },
]

const craftAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "craft-rose",
    color: "#bd99d8",
    size: "clamp(760px,72vw,1180px)",
    top: "2%",
    left: "42%",
    maxShift: 100,
  },
  {
    id: "craft-blue",
    color: "#97b4e4",
    size: "clamp(620px,58vw,920px)",
    top: "52%",
    left: "-10%",
    opacity: 0.22,
    maxShift: 96,
  },
  {
    id: "craft-lavender",
    color: "#c7a1de",
    size: "clamp(560px,52vw,840px)",
    top: "-10%",
    left: "74%",
    opacity: 0.24,
    maxShift: 88,
  },
]

function RevealBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-90px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.68, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function CraftPage() {
  const [introVisible, setIntroVisible] = useState(false)
  const sequenceRef = useRef<HTMLOListElement | null>(null)
  const protocolRef = useRef<HTMLUListElement | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)

  const sequenceVisible = useInView(sequenceRef, { once: true, margin: "-90px" })
  const protocolVisible = useInView(protocolRef, { once: true, margin: "-90px" })
  const finalVisible = useInView(finalRef, { once: true, margin: "-110px" })

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

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f6f4ef] text-[#111111]">
      <RouteAtmosphere blobs={craftAtmosphereBlobs} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-[clamp(90px,10vh,120px)] pt-[clamp(82px,9vh,116px)]">
        <section className="relative pb-[clamp(88px,10vh,120px)]">
          <div className="group grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div className="relative">
              <h1
                className="text-[clamp(46px,8vw,126px)] leading-[0.86] tracking-[-0.05em]"
                style={{
                  opacity: introVisible ? 1 : 0,
                  transform: introVisible ? "translateY(0px)" : "translateY(32px)",
                  transition:
                    "opacity 760ms cubic-bezier(0.22,1,0.36,1) 60ms, transform 760ms cubic-bezier(0.22,1,0.36,1) 60ms",
                }}
              >
                ПОДХОД
              </h1>
              <div className="pointer-events-none mt-7 h-[2px] w-[clamp(96px,18vw,180px)] origin-left scale-x-0 bg-gradient-to-r from-[#4a8fe4]/75 via-[#7a4fd8]/70 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
            </div>

            <div
              className="lg:justify-self-end"
              style={{
                opacity: introVisible ? 1 : 0,
                transform: introVisible ? "translateY(0px)" : "translateY(32px)",
                transition:
                  "opacity 760ms cubic-bezier(0.22,1,0.36,1) 140ms, transform 760ms cubic-bezier(0.22,1,0.36,1) 140ms",
              }}
            >
              <p className="max-w-[36ch] text-[clamp(20px,2.6vw,38px)] leading-[1.14] tracking-[-0.03em] text-[#111]/86">
                Мы не «успеваем за дедлайн». Мы проектируем темп так, чтобы дедлайн работал на нас.
              </p>
              <p className="mt-7 max-w-[56ch] text-[clamp(15px,1.3vw,20px)] leading-[1.45] text-[#111]/72">
                Эта страница описывает наш рабочий протокол для хакатона: как за 48 часов пройти путь от задачи до
                уверенной защиты без хаоса, лишних итераций и случайных решений.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-black/12 py-[clamp(88px,10vh,120px)]">
          <div className="grid gap-10 lg:grid-cols-[minmax(190px,0.27fr)_minmax(0,0.73fr)] lg:gap-14">
            <RevealBlock className="lg:sticky lg:top-12 lg:h-fit">
              <h2 className="text-[clamp(34px,5.2vw,78px)] leading-[0.92] tracking-[-0.04em]">Как мы идём к решению</h2>
              </RevealBlock>

            <motion.ol
              ref={sequenceRef}
              initial="hidden"
              animate={sequenceVisible ? "visible" : "hidden"}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    delayChildren: 0.06,
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="relative"
            >
              {sequenceSteps.map((step, index) => (
                <motion.li
                  key={step.id}
                  variants={{
                    hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: { duration: 0.56, ease: EASE },
                    },
                  }}
                  className="group relative py-8 md:py-10"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(74,143,228,0.06),rgba(122,79,216,0.05),transparent)] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100" />
                  <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-[clamp(92px,14vw,150px)] origin-left scale-x-0 opacity-0 bg-gradient-to-r from-[#4a8fe4]/88 via-[#7a4fd8]/80 to-transparent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute right-0 top-0 h-full w-px origin-top scale-y-0 opacity-0 bg-gradient-to-b from-[#7a4fd8]/74 via-[#4a8fe4]/62 to-transparent transition-all delay-75 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-hover:opacity-100" />
                  <span
                    className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 opacity-0 bg-gradient-to-r from-transparent via-[#7a4fd8]/50 to-transparent transition-all delay-150 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-hover:opacity-100 ${
                      index === sequenceSteps.length - 1 ? "hidden" : ""
                    }`}
                  />
                  <div className="relative grid gap-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[2px] md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-8">
                    <div className="max-w-[58ch]">
                      <h3 className="text-[clamp(24px,3.7vw,54px)] leading-[0.98] tracking-[-0.03em] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#111]/96">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-[58ch] text-[clamp(15px,1.22vw,20px)] leading-[1.38] text-[#111]/72 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#111]/82">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        <section className="border-t border-black/12 py-[clamp(88px,10vh,120px)]">
          <RevealBlock>
            <h2 className="max-w-[13ch] text-[clamp(34px,5vw,74px)] leading-[0.94] tracking-[-0.04em]">
              Принципы, которые держат темп
            </h2>
          </RevealBlock>

          <motion.ul
            ref={protocolRef}
            initial="hidden"
            animate={protocolVisible ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 0.07,
                  staggerChildren: 0.08,
                },
              },
            }}
            className="mt-10 border-y border-black/12"
          >
            {protocolLines.map((line, index) => (
              <motion.li
                key={line.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.54, ease: EASE },
                  },
                }}
                className="group relative grid gap-5 border-b border-black/12 py-6 last:border-b-0 md:grid-cols-[76px_minmax(0,1fr)] md:gap-8 md:items-start pl-5 pr-5"
              >
                <span className="absolute left-0 inset-y-0 w-[2px] origin-bottom scale-y-0 rounded-full bg-gradient-to-b from-[#7a4fd8] to-[#4a8fe4] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="absolute right-0 inset-y-0 w-[2px] origin-top scale-y-0 rounded-full bg-gradient-to-b from-[#7a4fd8] to-[#4a8fe4] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="pointer-events-none mt-1 block select-none text-[clamp(40px,4.8vw,62px)] leading-none tracking-[-0.06em] text-black/12">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[clamp(23px,3vw,44px)] leading-[1.08] tracking-[-0.03em]">{line.statement}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section ref={finalRef} className="border-t border-black/12 pt-[clamp(88px,10vh,120px)]">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={finalVisible ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.68, ease: EASE }}
            className="group relative overflow-hidden py-6"
          >
            <div className="pointer-events-none mb-6 h-[2px] w-[clamp(120px,24vw,220px)] origin-left scale-x-0 bg-gradient-to-r from-[#4a8fe4]/82 via-[#7a4fd8]/78 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
            <h2 className="max-w-[12ch] text-[clamp(44px,8vw,126px)] leading-[0.86] tracking-[-0.05em]">
              48 часов это достаточный горизонт для сильного продукта.
            </h2>
            <p className="mt-7 max-w-[38ch] text-[clamp(18px,2.4vw,34px)] leading-[1.14] tracking-[-0.02em] text-[#111]/84">
              Когда команда действует как единая инженерная система.
            </p>
          </motion.article>
        </section>
      </div>
    </main>
  )
}
