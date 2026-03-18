"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { RouteAtmosphere, type AtmosphereBlob } from "@/components/route-atmosphere"

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const PANEL_SIZE_CLASS = "h-[clamp(500px,80vh,860px)] w-[clamp(320px,92vw,1320px)]"

const WHEEL_SCROLL_MULTIPLIER = 0.5
const WHEEL_MAX_INPUT = 240
const WHEEL_MAX_VELOCITY = 260
const WHEEL_FRICTION = 0.72
const WHEEL_STOP_THRESHOLD = 0.35
const WHEEL_LINE_HEIGHT = 16

interface PersonCard {
  id: string
  number: string
  status: "TEAM" | "BUSINESS" | "BACKEND" | "DESIGN" | "ANDROID" | "FRONTEND"
  monogram: string
  name: string
  role: string
  focus: string
  stack: string
  quote: string
  photoSrc?: string
  githubUrl?: string
  telegramUrl?: string
  email?: string
}

const teamPeople: PersonCard[] = [
  {
    id: "stepan-karpov",
    number: "01",
    status: "TEAM",
    monogram: "КС",
    name: "Карпов Степан",
    role: "Team Lead",
    focus: "Собирает системную архитектуру, держит темп команды и доводит MVP до цельного продукта с чистым UI.",
    stack: "Python · React · JavaScript · Node.js · TypeScript · C++ · aiogram · UI/UX · Figma ·",
    quote: "Сначала структура, потом скорость.",
    photoSrc: "/media/Karpov.jpg",
    githubUrl: "https://github.com/Stepa-Karpik",
    telegramUrl: "https://t.me/Karpov_Stepan",
    email: "i@KarpovStepan.ru",
  },
  {
    id: "vladislav-bogdan",
    number: "02",
    status: "BUSINESS",
    monogram: "БВ",
    name: "Богдан Владислав",
    role: "Backend разработчик / менеджмент и управление бизнесом",
    focus: "Связывает бизнес-задачи с технической реализацией: выстраивает приоритеты, контролирует сроки и отвечает за бэкенд-контур продукта.",
    stack: "Python · FastAPI · Product Delivery · Management ·",
    quote: "Решение должно выдерживать и рынок, и дедлайн.",
    photoSrc: "/media/Bogdan.jpg",
    telegramUrl: "https://t.me/VlBogdan",
    email: "Vladislav.mirono2015@yandex.ru",
  },
  {
    id: "Melihova-Anastasiya",
    number: "03",
    status: "DESIGN",
    monogram: "МА",
    name: "Мелихова Анастасия",
    role: "Дизайнер",
    focus: "Создание интуитивно понятного и красивого интерфейса для всех вариантов приложения.",
    stack: "Figma, Photoshop, Illustrator, Motion, OpenAI",
    quote: "Надежность начинается с ясных интерфейсов.",
    photoSrc: "/media/Melihova.jpg",
    telegramUrl: "https://t.me/wwhat123",
  },
  {
    id: "tatyana-popova",
    number: "04",
    status: "BACKEND",
    monogram: "ПТ",
    name: "Попова Татьяна",
    role: "Backend разработчик",
    focus: "Качество API, надежность сервисов и оптимизация производительности.",
    stack: "Python · FastAPI · PostgreSQL · Docker · REST ·",
    quote: "Надежный backend не видно. И именно поэтому он нужен.",
    photoSrc: "/media/Popova.jpg",
    telegramUrl: "https://t.me/angrybiirds",
  },
  {
    id: "roman-mikhailov",
    number: "05",
    status: "ANDROID",
    monogram: "МР",
    name: "Михайлов Роман",
    role: "Мобильный разработчик Kotlin (Android)",
    focus: "Держит производительность Android-части, выстраивает чистую архитектуру и снижает риски на релизе.",
    stack: "Kotlin · Android · Jetpack Compose · Coroutines · Retrofit ·",
    quote: "Стабильность важнее случайной скорости.",
    photoSrc: "/media/Mihajlov.png",
    telegramUrl: "https://t.me/rimmtyr",
  },
  {
    id: "egor-linevich",
    number: "06",
    status: "FRONTEND",
    monogram: "ЛЕ",
    name: "Линевич Егор",
    role: "Frontend разработчик",
    focus: "Собирает выразительный UI, аккуратную анимацию и интеграции без визуального шума и версточных компромиссов.",
    stack: "React · Next.js · TypeScript · UI Systems · Motion ·",
    quote: "Деталь видна даже в темпе.",
    photoSrc: "/media/Linevich.jpg",
    telegramUrl: "https://t.me/wxstmoon",
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getTextReveal(focus: number) {
  const linear = clamp((focus - 0.32) / 0.68, 0, 1)
  return 1 - Math.pow(1 - linear, 1.35)
}

const lyudiAtmosphereBlobs: AtmosphereBlob[] = [
  {
    id: "lyudi-rose",
    color: "#c79ad7",
    size: "clamp(820px,76vw,1260px)",
    top: "-4%",
    left: "42%",
    maxShift: 100,
  },
  {
    id: "lyudi-blue",
    color: "#98b4e4",
    size: "clamp(620px,58vw,920px)",
    top: "52%",
    left: "8%",
    opacity: 0.24,
    maxShift: 92,
  },
  {
    id: "lyudi-lavender",
    color: "#baa8e2",
    size: "clamp(560px,52vw,840px)",
    top: "-14%",
    left: "74%",
    opacity: 0.22,
    maxShift: 86,
  },
]

export default function PeoplePage() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const finalRef = useRef<HTMLElement | null>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const copyResetTimerRef = useRef<number | null>(null)

  const [introVisible, setIntroVisible] = useState(false)
  const [finalVisible, setFinalVisible] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [focusByCard, setFocusByCard] = useState<number[]>(() => teamPeople.map(() => 0))
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null)

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

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflowY
    const previousHtmlOverflow = document.documentElement.style.overflowY
    document.body.style.overflowY = "hidden"
    document.documentElement.style.overflowY = "hidden"

    return () => {
      document.body.style.overflowY = previousBodyOverflow
      document.documentElement.style.overflowY = previousHtmlOverflow
    }
  }, [])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  const handleCopyEmail = async (personId: string, email?: string) => {
    if (!email) return

    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmailId(personId)
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedEmailId((previous) => (previous === personId ? null : previous))
      }, 1200)
    } catch {
      setCopiedEmailId(null)
    }
  }

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    let wheelVelocity = 0
    let maxScrollLeft = 0
    let wheelRafId: number | null = null
    let lastFrameTimestamp = 0
    let hasUserWheelInput = false
    let focusRafId: number | null = null

    const syncCardFocus = () => {
      const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2
      const maxDistance = scroller.clientWidth * 0.92
      let nextActiveIndex = 0
      let strongestFocus = -1

      const nextFocusByCard = teamPeople.map((_, index) => {
        const card = cardRefs.current[index]
        if (!card) return 0

        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(cardCenter - viewportCenter)
        const normalized = clamp(1 - distance / maxDistance, 0, 1)
        const focusValue = 1 - Math.pow(1 - normalized, 1.28)

        if (focusValue > strongestFocus) {
          strongestFocus = focusValue
          nextActiveIndex = index
        }

        return focusValue
      })

      setActiveCardIndex((previous) => (previous === nextActiveIndex ? previous : nextActiveIndex))
      setFocusByCard((previous) => {
        let changed = false
        const updated = previous.slice()

        for (let index = 0; index < nextFocusByCard.length; index += 1) {
          const nextValue = nextFocusByCard[index]
          const previousValue = previous[index] ?? 0
          if (Math.abs(nextValue - previousValue) > 0.008) {
            updated[index] = nextValue
            changed = true
          }
        }

        return changed ? updated : previous
      })
    }

    const requestFocusSync = () => {
      if (focusRafId !== null) return
      focusRafId = window.requestAnimationFrame(() => {
        focusRafId = null
        syncCardFocus()
      })
    }

    const animateWheel = (timestamp: number) => {
      const deltaTime = lastFrameTimestamp === 0 ? 16.67 : Math.min(timestamp - lastFrameTimestamp, 64)
      lastFrameTimestamp = timestamp
      const frameRatio = deltaTime / 16.67

      const nextScrollLeft = clamp(scroller.scrollLeft + wheelVelocity * frameRatio, 0, maxScrollLeft)
      scroller.scrollLeft = nextScrollLeft

      const friction = Math.pow(WHEEL_FRICTION, frameRatio)
      wheelVelocity *= friction

      if (Math.abs(wheelVelocity) < WHEEL_STOP_THRESHOLD) {
        wheelVelocity = 0
        wheelRafId = null
        return
      }

      wheelRafId = window.requestAnimationFrame(animateWheel)
    }

    const startWheelAnimation = () => {
      if (wheelRafId !== null) return
      lastFrameTimestamp = 0
      wheelRafId = window.requestAnimationFrame(animateWheel)
    }

    const onWheel = (event: WheelEvent) => {
      let dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (event.deltaMode === 1) {
        dominantDelta *= WHEEL_LINE_HEIGHT
      } else if (event.deltaMode === 2) {
        dominantDelta *= scroller.clientWidth
      }
      if (dominantDelta === 0) return

      event.preventDefault()

      const limitedInput = clamp(dominantDelta, -WHEEL_MAX_INPUT, WHEEL_MAX_INPUT)
      wheelVelocity = clamp(
        wheelVelocity + limitedInput * WHEEL_SCROLL_MULTIPLIER,
        -WHEEL_MAX_VELOCITY,
        WHEEL_MAX_VELOCITY,
      )
      hasUserWheelInput = true
      startWheelAnimation()
    }

    const onScroll = () => {
      let nextScrollLeft = scroller.scrollLeft
      maxScrollLeft = Math.max(scroller.scrollWidth - scroller.clientWidth, 0)
      const clampedScrollLeft = Math.min(nextScrollLeft, maxScrollLeft)
      if (Math.abs(clampedScrollLeft - scroller.scrollLeft) > 0.5) {
        scroller.scrollLeft = clampedScrollLeft
      }
      nextScrollLeft = clampedScrollLeft

      const atStart = nextScrollLeft <= 0.5
      const atEnd = nextScrollLeft >= maxScrollLeft - 0.5
      if ((atStart && wheelVelocity < 0) || (atEnd && wheelVelocity > 0)) {
        wheelVelocity = 0
      }

      if (!hasUserWheelInput && wheelRafId === null) {
        wheelVelocity = 0
      }
      hasUserWheelInput = false

      requestFocusSync()
    }

    onScroll()
    scroller.addEventListener("wheel", onWheel, { passive: false })
    scroller.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      scroller.removeEventListener("wheel", onWheel)
      scroller.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)

      if (wheelRafId !== null) {
        window.cancelAnimationFrame(wheelRafId)
      }
      if (focusRafId !== null) {
        window.cancelAnimationFrame(focusRafId)
      }
    }
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    const finalSection = finalRef.current
    if (!scroller || !finalSection) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setFinalVisible(entry.isIntersecting && entry.intersectionRatio > 0.45)
      },
      {
        root: scroller,
        threshold: [0.25, 0.45, 0.65],
      },
    )

    observer.observe(finalSection)
    return () => observer.disconnect()
  }, [])

  const railPadding = useMemo(() => "max(20px, calc((100vw - clamp(320px, 92vw, 1320px)) / 2))", [])

  return (
    <main className="relative isolate h-screen overflow-hidden bg-[#f6f4ef] text-[#111111]">
      <RouteAtmosphere blobs={lyudiAtmosphereBlobs} scrollContainer={scrollerRef} />
      <div
        ref={scrollerRef}
        className="relative z-10 flex h-full w-full touch-pan-x items-center gap-[clamp(64px,6vw,108px)] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: railPadding }}
      >
        <section
          className={`soft-gradient-card soft-gradient-rails relative flex shrink-0 items-end border border-black/0 bg-[linear-gradient(145deg,rgba(255,255,255,0.46),rgba(248,245,240,0.82))] px-[clamp(30px,5vw,82px)] py-[clamp(30px,6vh,72px)] shadow-[0_26px_70px_rgba(17,17,17,0.06)] ${PANEL_SIZE_CLASS}`}
        >
          <div className="grid w-full gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.96fr)] md:items-end md:gap-14">
            <div>
              <h1
                className="text-[clamp(52px,13vw,196px)] leading-[0.82] tracking-[-0.055em]"
                style={{
                  opacity: introVisible ? 1 : 0,
                  transform: introVisible ? "translateY(0px)" : "translateY(24px)",
                  transition: `opacity 450ms ${EASE}, transform 450ms ${EASE}`,
                }}
              >
                ЛЮДИ
              </h1>
              <div className="pointer-events-none mt-7 h-[2px] w-[clamp(96px,18vw,180px)] bg-gradient-to-r from-[#4a8fe4]/75 via-[#7a4fd8]/70 to-transparent" />
            </div>

            <p
              className="max-w-[32ch] text-[clamp(20px,2.5vw,34px)] leading-[1.14] tracking-[-0.02em] text-[#111]/82"
              style={{
                opacity: introVisible ? 1 : 0,
                transform: introVisible ? "translateY(0px)" : "translateY(24px)",
                transition: `opacity 450ms ${EASE} 90ms, transform 450ms ${EASE} 90ms`,
              }}
            >
              <span className="block">6 ролей. Один ритм.</span>
              <span className="block">Каждый слой продукта закрыт вовремя и без суеты.</span>
            </p>
          </div>
        </section>

        {teamPeople.map((person, index) => {
          const focus = focusByCard[index] ?? 0
          const reveal = getTextReveal(focus)
          const isFocused = index === activeCardIndex && focus > 0.58
          const baseOpacity = 0.74 + focus * 0.26
          const baseScale = 0.985 + focus * 0.015

          const contentMotionStyle = (delay: number) => ({
            opacity: isFocused ? 1 : 0.66 + reveal * 0.3,
            transform: `translateY(${isFocused ? 0 : Math.round((1 - reveal) * 14)}px)`,
            transition: `opacity 340ms ${EASE} ${delay}ms, transform 340ms ${EASE} ${delay}ms`,
          })

          return (
            <article
              key={person.id}
              ref={(element) => {
                cardRefs.current[index] = element
              }}
              className={`soft-gradient-card soft-gradient-rails relative shrink-0 border border-black/0 bg-[linear-gradient(145deg,rgba(255,255,255,0.4),rgba(248,245,240,0.8))] p-[clamp(22px,2.9vw,38px)] transition-[opacity,transform,border-color,box-shadow] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${PANEL_SIZE_CLASS}`}
              style={{
                opacity: baseOpacity,
                transform: `scale(${baseScale})`,
                boxShadow: `0 14px 32px rgba(0,0,0,${0.014 + focus * 0.03})`,
              }}
            >
              <span className="pointer-events-none absolute right-[clamp(22px,2.9vw,38px)] top-[clamp(18px,2.4vw,30px)] text-[11px] tracking-[0.2em] text-[#111]/56 uppercase">
                {person.status}
              </span>
              <div className="grid h-full gap-[clamp(18px,2.3vw,34px)] md:grid-cols-[minmax(260px,0.36fr)_minmax(0,0.64fr)]">
                <figure className="soft-gradient-card relative h-full min-h-[220px] overflow-hidden rounded-[26px] border border-black/0 bg-[#eceae5]">
                  {person.photoSrc ? (
                    <>
                      <Image
                        src={person.photoSrc}
                        alt={person.name}
                        fill
                        sizes="(max-width: 768px) 86vw, 34vw"
                        className="object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-black/2 to-black/10" />
                      <span className="absolute left-5 bottom-4 text-[13px] tracking-[0.16em] text-white/76 uppercase">{person.monogram}</span>
                    </>
                  ) : (
                    <>
                      <span className="absolute left-5 bottom-5 text-[clamp(42px,5.8vw,94px)] leading-[0.86] tracking-[-0.04em] text-[#111]/82">
                        {person.monogram}
                      </span>
                    </>
                  )}
                </figure>

                <div className="flex min-h-0 flex-col">

                  <h2
                    className="mt-6 text-[clamp(34px,4.2vw,62px)] leading-[0.92] tracking-[-0.04em]"
                    style={contentMotionStyle(20)}
                  >
                    {person.name}
                  </h2>

                  <p className="mt-4 max-w-[42ch] text-[clamp(17px,1.52vw,24px)] leading-[1.2] text-[#111]/82" style={contentMotionStyle(70)}>
                    {person.role}
                  </p>

                  <p className="mt-6 max-w-[44ch] text-[clamp(15px,1.15vw,19px)] leading-[1.42] text-[#111]/74" style={contentMotionStyle(120)}>
                    {person.focus}
                  </p>

                  <p className="mt-5 max-w-[44ch] text-[13px] leading-[1.48] tracking-[0.04em] text-[#111]/58 uppercase" style={contentMotionStyle(170)}>
                    {person.stack}
                  </p>

                  <p className="mt-6 max-w-[40ch] font-playfair text-[clamp(17px,1.44vw,22px)] leading-[1.22] text-[#111]/78 italic" style={contentMotionStyle(220)}>
                    {person.quote}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-8 text-[11px] tracking-[0.12em] text-[#111]/62 uppercase">
                    {person.githubUrl ? (
                      <a
                        href={person.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.4),rgba(122,79,216,0.34),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                      >
                        GitHub
                      </a>
                    ) : (
                      <span className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.22),rgba(122,79,216,0.18),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] text-[#111]/46">GitHub — placeholder</span>
                    )}

                    {person.telegramUrl ? (
                      <a
                        href={person.telegramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.4),rgba(122,79,216,0.34),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                      >
                        Telegram
                      </a>
                    ) : (
                      <span className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.22),rgba(122,79,216,0.18),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] text-[#111]/46">Telegram — placeholder</span>
                    )}

                    {person.email ? (
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyEmail(person.id, person.email)
                        }}
                        className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.4),rgba(122,79,216,0.34),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
                      >
                        {copiedEmailId === person.id ? "Email — copied" : "Email — copy"}
                      </button>
                    ) : (
                      <span className="inline-block bg-[linear-gradient(90deg,rgba(74,143,228,0.22),rgba(122,79,216,0.18),rgba(17,17,17,0))] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-[2px] text-[#111]/46">Email — placeholder</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        <section
          ref={finalRef}
          className={`soft-gradient-card soft-gradient-rails relative flex shrink-0 items-end border border-black/0 bg-[linear-gradient(145deg,rgba(255,255,255,0.42),rgba(248,245,240,0.82))] px-[clamp(30px,5vw,82px)] py-[clamp(30px,6vh,72px)] shadow-[0_26px_70px_rgba(17,17,17,0.06)] ${PANEL_SIZE_CLASS}`}
        >
          <div className="max-w-[70ch]">
            <div className="mb-6 h-[2px] w-[clamp(120px,24vw,220px)] bg-gradient-to-r from-[#4a8fe4]/82 via-[#7a4fd8]/78 to-transparent" />
            <h2
              className="text-[clamp(44px,8vw,122px)] leading-[0.88] tracking-[-0.05em]"
              style={{
                opacity: finalVisible ? 1 : 0,
                transform: finalVisible ? "translateY(0px)" : "translateY(24px)",
                transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}`,
              }}
            >
              СОБРАНЫ КАК СИСТЕМА
            </h2>

            <p
              className="mt-6 max-w-[40ch] text-[clamp(18px,2.1vw,30px)] leading-[1.2] tracking-[-0.02em] text-[#111]/82"
              style={{
                opacity: finalVisible ? 1 : 0,
                transform: finalVisible ? "translateY(0px)" : "translateY(24px)",
                transition: `opacity 420ms ${EASE} 80ms, transform 420ms ${EASE} 80ms`,
              }}
            >
              <span className="block">В решающие 48 часов работает не шум.</span>
              <span className="block">Работают роли, темп и доверие внутри команды.</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
