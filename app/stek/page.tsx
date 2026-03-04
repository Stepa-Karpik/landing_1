"use client"

import { motion, useInView } from "framer-motion"
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"

const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const HOVER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface RoleRow {
  id: string
  index: string
  title: string
  competencies: string[]
}

interface StackBlock {
  id: string
  index: string
  title: string
  summary: string
  description: string
  stack: string[]
  responsibilities: string[]
  delivery: string[]
  databaseScope: string
}

const roleRows: RoleRow[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    competencies: ["React", "TypeScript", "Next.js", "HTML5", "CSS3", "SASS", "Figma", "Motion", "PostgreSQL"],
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    competencies: [
      "Node.js",
      "Express",
      "Python",
      "FastAPI",
      "Flask",
      "GraphQL",
      "REST API",
      "Security",
      "PostgreSQL",
    ],
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
    competencies: ["Figma", "PowerPoint", "Photoshop", "Illustrator", "Nano Banana", "Motion", "UI/UX", "Pitch"],
  },
]

const competencyTags = [
  "React",
  "TypeScript",
  "Next.js",
  "HTML5",
  "CSS3",
  "SASS",
  "Node.js",
  "Express",
  "Python",
  "FastAPI",
  "Flask",
  "GraphQL",
  "REST API",
  "Swift",
  "SwiftUI",
  "Objective-C",
  "Kotlin",
  "Jetpack Compose",
  "Figma",
  "PowerPoint",
  "Photoshop",
  "Illustrator",
  "Nano Banana",
  "Motion",
  "PostgreSQL",
  "UI/UX",
  "Security",
  "Delivery",
  "Pitch",
]

const stackBlocks: StackBlock[] = [
  {
    id: "web-frontend",
    index: "01",
    title: "Web Frontend",
    summary: "Фронтенд на React с SSR/ISR через Next.js и единым UI-подходом.",
    description:
      "Собираем интерфейсный слой как систему: дизайн-токены, компонентная архитектура, предсказуемая адаптивность и аккуратная анимация без визуального шума.",
    stack: [
      "React",
      "TypeScript",
      "Next.js",
      "HTML5",
      "CSS3",
      "SASS",
      "Tailwind CSS",
      "Figma",
      "Motion",
      "Storybook",
      "TanStack Query",
    ],
    responsibilities: [
      "Проектирование UI-структуры и маршрутов",
      "Система компонентов и типобезопасные интерфейсы",
      "Интеграция с backend API и обработка состояний",
    ],
    delivery: ["Production-ready верстка", "Быстрые итерации UI", "Плавная адаптация под mobile/web"],
    databaseScope: "Работа с данными через backend-контракты на PostgreSQL.",
  },
  {
    id: "web-backend",
    index: "02",
    title: "Web Backend",
    summary: "Backend на Node.js и Python для масштабируемой сервисной логики.",
    description:
      "Пишем чистый backend-контур: API-дизайн, валидация, бизнес-правила и стабильная интеграция с клиентскими приложениями без лишней сложности.",
    stack: [
      "Node.js",
      "Express",
      "TypeScript",
      "Python",
      "FastAPI",
      "Flask",
      "GraphQL",
      "REST API",
      "OpenAPI",
      "PostgreSQL",
      "JWT/Auth",
    ],
    responsibilities: [
      "Проектирование API и схем данных",
      "Бизнес-логика и безопасность сервисов",
      "Надежные интеграции с web/mobile-клиентами",
    ],
    delivery: ["Стабильные endpoint-ы", "Предсказуемое время ответа", "Прозрачная архитектура под рост"],
    databaseScope: "Прямая работа с PostgreSQL: схема, запросы, миграции, оптимизация.",
  },
  {
    id: "mobile-ios",
    index: "03",
    title: "Mobile iOS",
    summary: "Нативный iOS-клиент на Swift/SwiftUI с фокусом на UX-качество.",
    description:
      "Формируем мобильный опыт без компромиссов: чистая навигация, устойчивый state management, и аккуратные сценарии взаимодействия под реальные задачи пользователя.",
    stack: ["Swift", "SwiftUI", "Objective-C", "UIKit", "Combine", "Xcode", "URLSession", "API Integration"],
    responsibilities: [
      "Сборка нативных экранов и пользовательских потоков",
      "Интеграция с backend API и обработка сетевых сценариев",
      "Подготовка стабильного сборочного контура под демонстрацию",
    ],
    delivery: ["Высокая отзывчивость UI", "Прозрачная архитектура экранов", "Уверенный demo-ready релиз"],
    databaseScope: "Получение данных из PostgreSQL через backend API.",
  },
  {
    id: "mobile-android",
    index: "04",
    title: "Mobile Android",
    summary: "Android-разработка на Kotlin и Jetpack Compose для современного UI.",
    description:
      "Делаем Android-часть быстрой и управляемой: composable-подход, чистая структура модулей и надежная интеграция с серверной логикой.",
    stack: [
      "Kotlin",
      "Jetpack Compose",
      "Android SDK",
      "Coroutines",
      "Retrofit",
      "Room-ready Architecture",
      "API Integration",
    ],
    responsibilities: [
      "Проектирование composable-интерфейсов",
      "Оптимизация клиентской производительности",
      "Подключение бизнес-логики через API-контракты",
    ],
    delivery: ["Стабильные Android-сборки", "Современный нативный UI", "Быстрый цикл правок под дедлайн"],
    databaseScope: "Получение данных из PostgreSQL через backend API.",
  },
  {
    id: "design",
    index: "05",
    title: "Design",
    summary: "Дизайн-контур для pitch и продукта: от структуры до финальной подачи.",
    description:
      "Закрываем визуальную часть продукта и презентации: формируем структуру экранов, подготавливаем материалы для защиты и усиливаем коммуникацию команды.",
    stack: [
      "Figma",
      "PowerPoint",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Nano Banana",
      "Motion (Framer Motion)",
      "Pitch Design",
      "UI/UX System",
    ],
    responsibilities: [
      "Каркас экранов, пользовательские флоу и визуальная иерархия",
      "Подготовка презентации и материалов к защите",
      "Синхронизация дизайн-решений с frontend-реализацией",
    ],
    delivery: ["Понятный UX-фундамент", "Сильная визуальная подача", "Консистентный стиль продукта и pitch"],
    databaseScope: "Без прямой работы с PostgreSQL: только через продуктовые и интерфейсные сценарии.",
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

function StackCard({ block, index }: { block: StackBlock; index: number }) {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-90px" })
  const hoverShift = index % 2 === 0 ? 6 : -6

  return (
    <div className="flex justify-center">
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 22 }}
        animate={isInView ? { opacity: 0.75, y: 0 } : undefined}
        transition={{ duration: 0.56, delay: index * 0.08, ease: REVEAL_EASE }}
        whileHover={{
          opacity: 1,
          x: hoverShift,
          transition: { duration: 0.24, ease: HOVER_EASE },
        }}
        className="w-full rounded-[24px] border border-black/12 bg-[#f8f6f1] px-[clamp(18px,2.9vw,34px)] py-[clamp(18px,3.1vw,30px)] md:w-[88%] lg:w-[84%]"
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] md:gap-10">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#111]/56 uppercase">
              #{block.index} · {block.title}
            </p>
            <h2 className="mt-3 text-[clamp(28px,3.1vw,46px)] leading-[0.94] tracking-[-0.03em] font-semibold text-[#111111]">
              {block.summary}
            </h2>
            <p className="mt-4 max-w-[42ch] text-[clamp(15px,1.2vw,19px)] leading-[1.34] text-[#111]/78">
              {block.description}
            </p>
            <p className="mt-5 text-[11px] leading-[1.5] tracking-[0.12em] text-[#111]/56 uppercase">{block.databaseScope}</p>
          </div>

          <div>
            <div className="border-t border-black/12 pt-4">
              <p className="text-[11px] tracking-[0.14em] text-[#111]/56 uppercase">Технологии</p>
              <p className="mt-2 hidden text-[12px] leading-[1.6] tracking-[0.1em] text-[#111]/72 uppercase md:block">
                {block.stack.join(", ")}
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-[1.35] tracking-[0.11em] text-[#111]/66 uppercase md:hidden">
                {block.stack.map((item) => (
                  <li key={item} className="border-b border-black/12 pb-1.5">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5 border-t border-black/12 pt-4">
              <p className="text-[11px] tracking-[0.14em] text-[#111]/56 uppercase">Что закрываем</p>
              <ul className="mt-2 space-y-2">
                {block.responsibilities.map((item) => (
                  <li key={item} className="text-[14px] leading-[1.35] text-[#111]/78">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5 border-t border-black/12 pt-4">
              <p className="text-[11px] tracking-[0.14em] text-[#111]/56 uppercase">Результат за спринт</p>
              <ul className="mt-2 space-y-2">
                {block.delivery.map((item) => (
                  <li key={item} className="text-[14px] leading-[1.35] text-[#111]/78">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.article>
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
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-end lg:gap-12">
            <h1
              className="text-[clamp(52px,10.4vw,150px)] leading-[0.82] tracking-[-0.05em]"
              style={{
                opacity: introVisible ? 1 : 0,
                transform: introVisible ? "translateY(0px)" : "translateY(40px)",
                transition: `opacity 520ms cubic-bezier(0.22,1,0.36,1), transform 520ms cubic-bezier(0.22,1,0.36,1)`,
              }}
            >
              СТЭК ТЕХНОЛОГИЙ
            </h1>

            <p
              className="max-w-[38ch] text-[clamp(18px,2.2vw,30px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82"
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
            {stackBlocks.map((block, index) => (
              <StackCard key={block.id} block={block} index={index} />
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
