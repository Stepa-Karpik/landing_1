"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

const LINES_COUNT = 20
const LINE_WIDTH = 1
const LINE_GAP = 9
const TRACKER_WIDTH = 30
const MIN_FRAME_SCALE = 1 / 1.5
const LAST_FRAME_INDEX = 8
const WORD_FRAME_INDEXES = [1, 2, 3, 4, 5, 6]
const TEXT_PROGRESS_POWER = 1.45
const WHEEL_SCROLL_MULTIPLIER = 0.5
const WHEEL_MAX_INPUT = 240
const WHEEL_MAX_VELOCITY = 260
const WHEEL_FRICTION = 0.72
const WHEEL_STOP_THRESHOLD = 0.35
const WHEEL_LINE_HEIGHT = 16

const manifestoLines = [
  "Делать системно.",
  "Делать спокойно.",
  "Делать осознанно.",
  "Делать масштабируемо.",
  "Делать надолго.",
  "Делать чисто.",
  "Делать.",
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function Minimap({ progress }: { progress: number }) {
  const linesWidth = LINES_COUNT * LINE_WIDTH + (LINES_COUNT - 1) * LINE_GAP
  const trackerX = Math.max(0, Math.min(1, progress)) * (linesWidth - TRACKER_WIDTH)

  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2">
      <div className="relative flex items-end gap-[9px]">
        {Array.from({ length: LINES_COUNT }).map((_, index) => (
          <div key={`line-${index}`} className="h-[18px] w-px bg-[#969696]" />
        ))}
        <div
          aria-hidden
          className="absolute top-0 h-[18px] w-[30px] border border-[#969696] bg-[#b8b8b8]"
          style={{ transform: `translateX(${trackerX}px)` }}
        />
      </div>
    </div>
  )
}

function CenterCross() {
  return (
    <svg
      className="pointer-events-none fixed left-1/2 top-1/2 z-50 h-5 w-5 -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden
    >
      <line x1="15" y1="0" x2="15" y2="30" stroke="white" strokeWidth="1.5" />
      <line x1="0" y1="14.25" x2="30" y2="14.25" stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

function FrameLabel({ children }: { children: string }) {
  return <div className="absolute -top-[30px] left-0 text-sm text-[#6f6f6f]">{children}</div>
}

function MainIntroFrame() {
  const [isIntroVisible, setIsIntroVisible] = useState(false)
  const lines = [
    { text: "Возьми" },
    { text: "Телефон,", offset: true },
    { text: "Детка!" },
    { text: "Мы знаем, что ты", offset: true },
    { text: "Хочешь позвонить" },
    { text: "Нам сегодня.", offset: true },
  ]

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reducedMotion.matches) {
      setIsIntroVisible(true)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsIntroVisible(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <article className="relative h-full w-full overflow-hidden">
      <div
        className="relative h-full w-full overflow-hidden bg-[#f4f4f4] transition-[transform,opacity] duration-[920ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: isIntroVisible ? "scale(1)" : "scale(0.82)",
          opacity: isIntroVisible ? 1 : 0,
          transformOrigin: "50% 50%",
          willChange: "transform, opacity",
        }}
      >
        <div
          className="absolute right-0 top-0 h-full aspect-square rounded-full bg-[#ffff02] transition-[transform,opacity] duration-[980ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: isIntroVisible ? "scale(1)" : "scale(0.62)",
            opacity: isIntroVisible ? 1 : 0,
            transformOrigin: "100% 0%",
            transitionDelay: "70ms",
            willChange: "transform, opacity",
          }}
        />
        <div className="relative flex h-full items-center gap-16 p-16 text-[#141519]">
          <div className="relative font-brand">
            {lines.map((line, index) => (
              <p
                key={line.text}
                className={
                  (line.offset ? "ml-16 " : "") + "overflow-hidden text-[clamp(44px,6vw,85px)] leading-[0.98] font-medium"
                }
              >
                <span
                  className="block transition-[transform,opacity] duration-[760ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform: isIntroVisible ? "translateY(0)" : "translateY(32px)",
                    opacity: isIntroVisible ? 1 : 0,
                    transitionDelay: (220 + index * 90) + "ms",
                    willChange: "transform, opacity",
                  }}
                >
                  {line.text}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function WordFrame({
  label,
  word,
  href,
  accent,
  textProgress = 0,
}: {
  label: string
  word: string
  href: string
  accent?: {
    color: string
    size: string
    top?: string
    right?: string
    bottom?: string
    left?: string
    transform?: string
  }
  textProgress?: number
}) {
  const external = href.startsWith("http")
  const textViewportRef = useRef<HTMLDivElement | null>(null)
  const textRef = useRef<HTMLHeadingElement | null>(null)
  const [maxTextShift, setMaxTextShift] = useState(0)

  useEffect(() => {
    const measure = () => {
      const viewport = textViewportRef.current
      const textNode = textRef.current
      if (!viewport || !textNode) return
      const nextShift = Math.max(textNode.scrollWidth - viewport.clientWidth, 0)
      setMaxTextShift((previous) => (Math.abs(previous - nextShift) > 0.5 ? nextShift : previous))
    }

    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [word])

  const safeTextProgress = clamp(textProgress, 0, 1)
  const textShift = maxTextShift * safeTextProgress

  const frameBody = (
    <>
      <FrameLabel>{label}</FrameLabel>
      <article className="relative h-full w-full overflow-hidden bg-[#f4f4f4] transition-transform duration-150 group-hover:scale-[1.004]">
        <div ref={textViewportRef} className="relative z-10 flex h-full items-center overflow-hidden px-5">
          <h2
            ref={textRef}
            aria-hidden
            className="inline-block whitespace-nowrap select-none px-2 text-[clamp(240px,36vw,720px)] leading-[0.88] tracking-[-0.05em] text-black"
            style={{ transform: `translateX(${-textShift}px)` }}
          >
            {word}
          </h2>
        </div>
        {accent && (
          <div
            className="pointer-events-none absolute z-0 rounded-full"
            style={{
              background: accent.color,
              width: accent.size,
              height: accent.size,
              top: accent.top,
              right: accent.right,
              bottom: accent.bottom,
              left: accent.left,
              transform: accent.transform,
            }}
          />
        )}
      </article>
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="group relative block h-full w-full outline-none">
        {frameBody}
      </a>
    )
  }

  return (
    <Link href={href} className="group relative block h-full w-full outline-none">
      {frameBody}
    </Link>
  )
}

function ManifestoFrame() {
  return (
    <article className="h-full w-full bg-[#ffff02] p-[50px] text-black">
      <p className="font-playfair text-[clamp(38px,5.25vw,75px)] leading-[1.08] font-medium">
        {manifestoLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </article>
  )
}

function ContactsFrame() {
  const emailToCopy = "i@karpovstepan.ru"
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailToCopy)
      setCopied(true)
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="relative h-full w-full bg-[#f4f4f4] font-montserrat">
      <a
        href="https://t.me/Vozmi_telefon_detka_rnd"
        target="_blank"
        rel="noreferrer"
        className="absolute left-[50px] top-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        Telegram
      </a>
      <a
        href="https://2023.rauno.me/"
        target="_blank"
        rel="noreferrer"
        className="absolute right-[50px] top-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        pipka
      </a>
      <a
        href="https://2022.rauno.me/"
        target="_blank"
        rel="noreferrer"
        className="absolute left-[50px] bottom-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        popa
      </a>
      <a
        href="https://github.com/Stepa-Karpik"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-[50px] right-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        GitHub
      </a>
      <button
        type="button"
        onClick={handleCopyEmail}
        aria-label={copied ? "Скопировано" : "Скопировать email"}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        <span className="grid place-items-center overflow-hidden">
          <span
            className={`col-start-1 row-start-1 transition-all duration-300 ${
              copied ? "-translate-y-[120%] opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            Email
          </span>
          <span
            className={`col-start-1 row-start-1 transition-all duration-300 ${
              copied ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0"
            }`}
          >
            Скопировано
          </span>
        </span>
      </button>
    </article>
  )
}

export default function Page() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const frameRefs = useRef<Array<HTMLDivElement | null>>([])
  const [progress, setProgress] = useState(0)
  const [frameScale, setFrameScale] = useState(1)
  const [frameWidth, setFrameWidth] = useState(0)
  const [secondFrameReveal, setSecondFrameReveal] = useState(0)
  const [textProgressByFrame, setTextProgressByFrame] = useState<Record<number, number>>({})

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
    const scroller = scrollerRef.current
    if (!scroller) return

    let wheelVelocity = 0
    let maxScrollLeft = 0
    let wheelRafId: number | null = null
    let lastFrameTimestamp = 0
    let hasUserWheelInput = false

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

      const firstFrame = frameRefs.current[0]
      const secondFrame = frameRefs.current[1]
      const currentFrameWidth = firstFrame?.offsetWidth ?? 0
      setFrameWidth((previous) => (Math.abs(previous - currentFrameWidth) > 0.5 ? currentFrameWidth : previous))
      const firstToSecondDistance =
        firstFrame && secondFrame
          ? Math.max(secondFrame.offsetLeft - firstFrame.offsetLeft, 1)
          : Math.max(scroller.clientWidth * 0.8, 1)
      const scalePhase = Math.min(scroller.scrollLeft / firstToSecondDistance, 1)
      const nextScale = 1 - (1 - MIN_FRAME_SCALE) * scalePhase
      setFrameScale(nextScale)

      const spacingCompensation = currentFrameWidth * (1 - nextScale)
      if (firstFrame && secondFrame) {
        const firstCenterScroll = firstFrame.offsetLeft + firstFrame.offsetWidth / 2 - scroller.clientWidth / 2
        const secondCenterScroll =
          secondFrame.offsetLeft + secondFrame.offsetWidth / 2 - spacingCompensation - scroller.clientWidth / 2
        const centerSpan = Math.max(secondCenterScroll - firstCenterScroll, 1)
        const revealStart = firstCenterScroll + centerSpan * 0.12
        const revealEnd = firstCenterScroll + centerSpan * 0.76
        const nextReveal = clamp((nextScrollLeft - revealStart) / Math.max(revealEnd - revealStart, 1), 0, 1)
        setSecondFrameReveal((previous) => (Math.abs(previous - nextReveal) > 0.003 ? nextReveal : previous))
      }

      const lastFrame = frameRefs.current[LAST_FRAME_INDEX]
      const maxCenteredScroll = lastFrame
        ? Math.max(
            lastFrame.offsetLeft + lastFrame.offsetWidth / 2 - LAST_FRAME_INDEX * spacingCompensation - scroller.clientWidth / 2,
            0,
          )
        : Math.max(scroller.scrollWidth - scroller.clientWidth, 0)
      maxScrollLeft = maxCenteredScroll

      const clampedScrollLeft = Math.min(nextScrollLeft, maxCenteredScroll)
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

      setProgress(nextScrollLeft / Math.max(maxCenteredScroll, 1))

      const nextTextProgress: Record<number, number> = {}
      for (const index of WORD_FRAME_INDEXES) {
        const currentFrame = frameRefs.current[index]
        const nextFrame = frameRefs.current[index + 1]
        if (!currentFrame || !nextFrame) continue

        const currentCenterScroll =
          currentFrame.offsetLeft + currentFrame.offsetWidth / 2 - index * spacingCompensation - scroller.clientWidth / 2
        const nextCenterScroll =
          nextFrame.offsetLeft + nextFrame.offsetWidth / 2 - (index + 1) * spacingCompensation - scroller.clientWidth / 2
        const centerSpan = Math.max(nextCenterScroll - currentCenterScroll, 1)
        const linearProgress = clamp((nextScrollLeft - currentCenterScroll) / centerSpan, 0, 1)
        const progressValue = 1 - Math.pow(1 - linearProgress, TEXT_PROGRESS_POWER)
        nextTextProgress[index] = progressValue
      }
      setTextProgressByFrame((previous) => {
        let changed = false
        const updated = { ...previous }
        for (const index of WORD_FRAME_INDEXES) {
          const nextValue = nextTextProgress[index] ?? 0
          const prevValue = previous[index] ?? 0
          if (Math.abs(nextValue - prevValue) > 0.002) {
            updated[index] = nextValue
            changed = true
          }
        }
        return changed ? updated : previous
      })
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
    }
  }, [])

  const railPadding = useMemo(() => "max(30px, calc((100vw - clamp(920px, 78vw, 1200px)) / 2))", [])
  const spacingCompensation = frameWidth * (1 - frameScale)
  const getFrameTransform = (index: number) => `translateX(${-index * spacingCompensation}px) scale(${frameScale})`

  return (
    <main className="relative h-screen overflow-hidden bg-[#ededed]">
      <Minimap progress={progress} />
      <CenterCross />

      <div
        ref={scrollerRef}
        className="flex h-full w-full touch-pan-x items-center gap-10 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: railPadding }}
      >
        <div
          ref={(element) => {
            frameRefs.current[0] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(0) }}
        >
          <MainIntroFrame />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[1] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center transition-[opacity,transform] duration-200 ease-out"
          style={{
            transform: `${getFrameTransform(1)} translateY(${(1 - secondFrameReveal) * 18}px)`,
            opacity: 0.12 + secondFrameReveal * 0.88,
            willChange: "transform, opacity",
          }}
        >
          <WordFrame
            label="Состав"
            word="Состав"
            href="/sostav"
            accent={{
              color: "#ff6100",
              size: "clamp(420px,56vh,760px)",
              right: "-28%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            textProgress={textProgressByFrame[1] ?? 0}
          />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[2] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(2) }}
        >
          <WordFrame label="Люди" word="Люди" href="/lyudi" textProgress={textProgressByFrame[2] ?? 0} />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[3] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(3) }}
        >
          <WordFrame
            label="Стэк"
            word="Стэк"
            href="/stek"
            accent={{
              color: "#37c978",
              size: "clamp(340px,48vh,620px)",
              left: "-16%",
              top: "-16%",
            }}
            textProgress={textProgressByFrame[3] ?? 0}
          />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[4] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(4) }}
        >
          <WordFrame label="Подход" word="Подход" href="/craft" textProgress={textProgressByFrame[4] ?? 0} />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[5] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(5) }}
        >
          <WordFrame
            label="Результат"
            word="Результат"
            href="/projects"
            accent={{
              color: "#4f7cff",
              size: "clamp(360px,52vh,680px)",
              right: "-20%",
              bottom: "-22%",
            }}
            textProgress={textProgressByFrame[5] ?? 0}
          />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[6] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(6) }}
        >
          <WordFrame label="Вектор" word="Вектор" href="/works" textProgress={textProgressByFrame[6] ?? 0} />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[7] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(7) }}
        >
          <ManifestoFrame />
        </div>

        <div
          ref={(element) => {
            frameRefs.current[8] = element
          }}
          className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
          style={{ transform: getFrameTransform(8) }}
        >
          <ContactsFrame />
        </div>
      </div>
    </main>
  )
}
