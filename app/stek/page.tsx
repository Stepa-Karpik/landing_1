"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const REVEAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface TechCategory {
  title: string
  stack: string[]
  description: string
}

const techCategories: TechCategory[] = [
  {
    title: "Web Frontend",
    stack: ["React", "TypeScript", "Next.js", "HTML5", "CSS3", "SASS"],
    description: "Веб-frontend на React с поддержкой серверного рендеринга через Next.js.",
  },
  {
    title: "Web Backend",
    stack: ["Node.js", "Express", "Python (FastAPI, Flask)", "GraphQL", "REST API"],
    description: "Backend на Node.js и Python для создания быстрых и масштабируемых решений.",
  },
  {
    title: "Mobile iOS",
    stack: ["Swift", "SwiftUI", "Objective-C"],
    description: "Мобильные приложения на iOS с использованием Swift и SwiftUI для нативного опыта.",
  },
  {
    title: "Mobile Android",
    stack: ["Kotlin", "Jetpack Compose"],
    description: "Нативные Android-приложения с Kotlin и Jetpack Compose для быстрого и современного UI.",
  },
  {
    title: "Databases",
    stack: ["PostgreSQL", "MySQL", "Redis", "PostGIS"],
    description: "Работаем с реляционными базами данных и PostGIS для геопространственных решений.",
  },
]

function TechCategoryCard({ category, index }: { category: TechCategory; index: number }) {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: true, margin: "-90px" })
  const hoverShift = index % 2 === 0 ? 6 : -6

  return (
    <div className="flex justify-center">
      <motion.article
        ref={ref}
        initial={{ opacity: 0, y: 22 }}
        animate={isInView ? { opacity: 0.75, y: 0 } : undefined}
        transition={{ duration: 0.58, delay: index * 0.08, ease: REVEAL_EASE }}
        whileHover={{
          opacity: 1,
          x: hoverShift,
          transition: { duration: 0.24, ease: REVEAL_EASE },
        }}
        className="w-full rounded-[22px] border border-black/12 bg-[#f8f6f1] px-[clamp(18px,2.9vw,34px)] py-[clamp(18px,3.1vw,30px)] md:w-[85%] lg:w-[78%]"
      >
        <div className="grid gap-7 md:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] md:gap-10">
          <div>
            <h2 className="text-[clamp(28px,3.1vw,46px)] leading-[0.94] tracking-[-0.03em] font-semibold text-[#111111]">
              {category.title}
            </h2>
            <p className="mt-4 max-w-[42ch] text-[clamp(15px,1.2vw,19px)] leading-[1.34] text-[#111]/78">
              {category.description}
            </p>
          </div>

          <div>
            <p className="hidden text-[11px] leading-[1.5] tracking-[0.12em] text-[#111]/58 uppercase md:block">
              {category.stack.join(", ")}
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] leading-[1.35] tracking-[0.12em] text-[#111]/64 uppercase md:hidden">
              {category.stack.map((item) => (
                <li key={item} className="border-b border-black/12 pb-1.5">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.article>
    </div>
  )
}

export default function StackPage() {
  const [introVisible, setIntroVisible] = useState(false)
  const finalRef = useRef<HTMLElement | null>(null)
  const finalInView = useInView(finalRef, { once: true, margin: "-90px" })

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
        </section>

        <section className="border-t border-black/12 py-16 md:py-24">
          <div className="space-y-4 md:space-y-6">
            {techCategories.map((category, index) => (
              <TechCategoryCard key={category.title} category={category} index={index} />
            ))}
          </div>
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
