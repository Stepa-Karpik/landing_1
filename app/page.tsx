"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { MENU_RESTORE_ON_NEXT_VISIT_KEY, MENU_SCROLL_LEFT_STORAGE_KEY } from "@/lib/menu-scroll-state"

const DESKTOP_LAYOUT_QUERY = "(min-width: 768px)"
const LINES_COUNT = 20
const LINE_WIDTH = 1
const LINE_GAP = 9
const TRACKER_WIDTH = 30
const MIN_FRAME_SCALE = 1 / 1.5
const TEXT_PROGRESS_POWER = 1.45
const WHEEL_SCROLL_MULTIPLIER = 0.5
const WHEEL_MAX_INPUT = 240
const WHEEL_MAX_VELOCITY = 260
const WHEEL_FRICTION = 0.72
const WHEEL_STOP_THRESHOLD = 0.35
const WHEEL_LINE_HEIGHT = 16

interface FrameAccent {
  color: string
  size: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  transform?: string
}

interface RouteFrame {
  label: string
  word: string
  href: string
  accent?: FrameAccent
}

const introLines = [
  { text: "Возьми" },
  { text: "Телефон,", offset: true },
  { text: "Детка!" },
  { text: "Мы знаем, что ты", offset: true },
  { text: "Хочешь позвонить" },
  { text: "Нам сегодня.", offset: true },
]

const manifestoLines = [
  "Делать системно.",
  "Делать спокойно.",
  "Делать осознанно.",
  "Делать масштабируемо.",
  "Делать надолго.",
  "Делать чисто.",
  "Делать.",
]

const routeFrames: RouteFrame[] = [
  {
    label: "Состав",
    word: "Состав",
    href: "/sostav",
    accent: {
      color: "#ff6100",
      size: "clamp(420px,56vh,760px)",
      right: "-28%",
      top: "50%",
      transform: "translateY(-50%)",
    },
  },
  {
    label: "Люди",
    word: "Люди",
    href: "/lyudi",
  },
  {
    label: "Стэк",
    word: "Стэк",
    href: "/stek",
    accent: {
      color: "#37c978",
      size: "clamp(340px,48vh,620px)",
      left: "-16%",
      top: "-16%",
    },
  },
  {
    label: "Подход",
    word: "Подход",
    href: "/craft",
  },
  {
    label: "Вектор",
    word: "Вектор",
    href: "/works",
  },
]

const FIRST_ROUTE_FRAME_INDEX = 1
const LAST_ROUTE_FRAME_INDEX = routeFrames.length
const WORD_FRAME_INDEXES = routeFrames.map((_, index) => index + FIRST_ROUTE_FRAME_INDEX)
const MANIFESTO_FRAME_INDEX = LAST_ROUTE_FRAME_INDEX + 1
const CONTACTS_FRAME_INDEX = MANIFESTO_FRAME_INDEX + 1
const LAST_FRAME_INDEX = CONTACTS_FRAME_INDEX

const contactItems = [
  { label: "Telegram", href: "https://t.me/Vozmi_telefon_detka_rnd" },
  { label: "Website", href: "https://nerior.ru" },
  { label: "Contact", href: "/lyudi" },
  { label: "GitHub", href: "https://github.com/Nerior-team" },
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

function MainIntroFrame({ compact = false }: { compact?: boolean }) {
  const [isIntroVisible, setIsIntroVisible] = useState(false)

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

  const circleClass = compact
    ? "absolute right-[-18%] top-[-2%] h-[72%] aspect-square rounded-full bg-[#ffff02]"
    : "absolute right-0 top-0 h-full aspect-square rounded-full bg-[#ffff02]"
  const containerClass = compact ? "relative flex h-full items-center gap-8 p-6 text-[#141519]" : "relative flex h-full items-center gap-16 p-16 text-[#141519]"
  const offsetClass = compact ? "ml-8 sm:ml-12 " : "ml-16 "
  const lineClass = compact ? "overflow-hidden text-[clamp(38px,10vw,72px)] leading-[0.96] font-medium" : "overflow-hidden text-[clamp(44px,6vw,85px)] leading-[0.98] font-medium"

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
          className={circleClass}
          style={{
            transform: isIntroVisible ? "scale(1)" : "scale(0.62)",
            opacity: isIntroVisible ? 1 : 0,
            transformOrigin: "100% 0%",
            transitionDelay: "70ms",
            willChange: "transform, opacity",
          }}
        />

        <div className={containerClass}>
          <div className="relative font-brand">
            {introLines.map((line, index) => (
              <p key={line.text} className={(line.offset ? offsetClass : "") + lineClass}>
                <span
                  className="block transition-[transform,opacity] duration-[760ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform: isIntroVisible ? "translateY(0)" : "translateY(32px)",
                    opacity: isIntroVisible ? 1 : 0,
                    transitionDelay: `${220 + index * 90}ms`,
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
  accent?: FrameAccent
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
            className="inline-block whitespace-nowrap px-2 text-[clamp(240px,36vw,720px)] leading-[0.88] tracking-[-0.05em] text-black"
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

function MobileWordFrame({ label, word, href, accent }: RouteFrame) {
  const external = href.startsWith("http")
  const accentStyle = accent
    ? {
        background: accent.color,
        width: "clamp(180px,48vw,260px)",
        height: "clamp(180px,48vw,260px)",
        top: accent.top ? (accent.top === "50%" ? "54%" : accent.top) : undefined,
        right: accent.right ? "-18%" : undefined,
        bottom: accent.bottom ? "-28%" : undefined,
        left: accent.left ? "-16%" : undefined,
        transform: accent.transform,
      }
    : null

  const content = (
    <article className="relative overflow-hidden rounded-[28px] bg-[#f4f4f4] px-5 pb-5 pt-4 shadow-[0_20px_48px_rgba(12,12,12,0.08)]">
      <span className="text-[11px] tracking-[0.22em] text-[#6f6f6f] uppercase">{label}</span>
      <div className="relative mt-3 min-h-[170px] overflow-hidden rounded-[20px] bg-white/35 px-4 py-5">
        <h2 className="relative z-10 max-w-[5ch] text-[clamp(64px,20vw,132px)] leading-[0.9] tracking-[-0.06em] text-black">
          {word}
        </h2>
        {accentStyle && <div className="pointer-events-none absolute z-0 rounded-full" style={accentStyle} />}
      </div>
    </article>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block outline-none">
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className="block outline-none">
      {content}
    </Link>
  )
}

function ManifestoFrame({ compact = false }: { compact?: boolean }) {
  return (
    <article className={`h-full w-full bg-[#ffff02] text-black ${compact ? "p-6" : "p-[50px]"}`}>
      <p
        className={`font-playfair font-medium ${compact ? "text-[clamp(28px,8vw,52px)] leading-[1.04]" : "text-[clamp(38px,5.25vw,75px)] leading-[1.08]"}`}
      >
        {manifestoLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </article>
  )
}

function ContactsFrame({ compact = false }: { compact?: boolean }) {
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

  if (compact) {
    return (
      <article className="grid gap-4 rounded-[28px] bg-[#f4f4f4] p-5 font-montserrat shadow-[0_20px_48px_rgba(12,12,12,0.08)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {contactItems.map((item) => {
            const external = item.href.startsWith("http")
            const commonClass =
              "flex min-h-[72px] items-center rounded-[22px] border border-black/10 bg-white/45 px-4 text-[clamp(26px,7vw,44px)] leading-none text-[#191a1e] transition-colors hover:bg-white/65"

            if (item.label === "Contact") {
              return (
                <Link key={item.label} href={item.href} className={commonClass}>
                  {item.label}
                </Link>
              )
            }

            return (
              <a key={item.label} href={item.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={commonClass}>
                {item.label}
              </a>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleCopyEmail}
          aria-label={copied ? "Скопировано" : "Скопировать email"}
          className="flex min-h-[84px] items-center justify-center rounded-[24px] border border-black/12 bg-white/55 text-[clamp(28px,8vw,48px)] leading-none text-[#191a1e]"
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
        href="https://nerior.ru"
        target="_blank"
        rel="noreferrer"
        className="absolute right-[50px] top-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        Website
      </a>
      <Link
        href="/lyudi"
        className="absolute left-[50px] bottom-[50px] text-[clamp(34px,4vw,85px)] leading-none font-normal text-[#191a1e]"
      >
        Contact
      </Link>
      <a
        href="https://github.com/Nerior-team"
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
  const [desktopLayout, setDesktopLayout] = useState(false)
  const [progress, setProgress] = useState(0)
  const [frameScale, setFrameScale] = useState(1)
  const [frameWidth, setFrameWidth] = useState(0)
  const [secondFrameReveal, setSecondFrameReveal] = useState(0)
  const [textProgressByFrame, setTextProgressByFrame] = useState<Record<number, number>>({})

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY)
    const syncLayout = () => setDesktopLayout(mediaQuery.matches)

    syncLayout()
    mediaQuery.addEventListener("change", syncLayout)
    return () => mediaQuery.removeEventListener("change", syncLayout)
  }, [])

  useEffect(() => {
    if (!desktopLayout) return

    const previousBodyOverflow = document.body.style.overflowY
    const previousHtmlOverflow = document.documentElement.style.overflowY
    document.body.style.overflowY = "hidden"
    document.documentElement.style.overflowY = "hidden"

    return () => {
      document.body.style.overflowY = previousBodyOverflow
      document.documentElement.style.overflowY = previousHtmlOverflow
    }
  }, [desktopLayout])

  useEffect(() => {
    if (!desktopLayout) return

    const scroller = scrollerRef.current
    if (!scroller) return
    let initialRestoreScrollLeft = 0

    try {
      const shouldRestore = window.sessionStorage.getItem(MENU_RESTORE_ON_NEXT_VISIT_KEY) === "1"
      if (shouldRestore) {
        window.sessionStorage.removeItem(MENU_RESTORE_ON_NEXT_VISIT_KEY)
        const savedValue = Number(window.sessionStorage.getItem(MENU_SCROLL_LEFT_STORAGE_KEY) ?? "0")
        initialRestoreScrollLeft = Number.isFinite(savedValue) ? Math.max(savedValue, 0) : 0
      }
    } catch {
      initialRestoreScrollLeft = 0
    }

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
      try {
        window.sessionStorage.setItem(MENU_SCROLL_LEFT_STORAGE_KEY, String(nextScrollLeft))
      } catch {
        // Ignore storage access errors.
      }

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

    if (initialRestoreScrollLeft > 0) {
      scroller.scrollLeft = initialRestoreScrollLeft
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
  }, [desktopLayout])

  const railPadding = useMemo(() => "max(30px, calc((100vw - clamp(920px, 78vw, 1200px)) / 2))", [])
  const spacingCompensation = frameWidth * (1 - frameScale)
  const getFrameTransform = (index: number) => `translateX(${-index * spacingCompensation}px) scale(${frameScale})`

  return (
    <main className="relative min-h-screen bg-[#ededed] md:h-screen md:overflow-hidden">
      <section className="relative z-10 flex flex-col gap-5 px-4 pb-6 pt-6 md:hidden">
        <div className="h-[min(64vh,520px)] min-h-[360px] overflow-hidden rounded-[28px]">
          <MainIntroFrame compact />
        </div>

        {routeFrames.map((frame) => (
          <MobileWordFrame key={frame.href} {...frame} />
        ))}

        <div className="overflow-hidden rounded-[28px]">
          <ManifestoFrame compact />
        </div>

        <ContactsFrame compact />
      </section>

      <section className="hidden md:block h-screen overflow-hidden">
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

          {routeFrames.map((frame, routeIndex) => {
            const frameIndex = routeIndex + FIRST_ROUTE_FRAME_INDEX
            const isRevealedFrame = frameIndex === FIRST_ROUTE_FRAME_INDEX

            return (
              <div
                key={frame.href}
                ref={(element) => {
                  frameRefs.current[frameIndex] = element
                }}
                className={`relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center ${
                  isRevealedFrame ? "transition-[opacity,transform] duration-200 ease-out" : ""
                }`}
                style={
                  isRevealedFrame
                    ? {
                        transform: `${getFrameTransform(frameIndex)} translateY(${(1 - secondFrameReveal) * 18}px)`,
                        opacity: 0.12 + secondFrameReveal * 0.88,
                        willChange: "transform, opacity",
                      }
                    : { transform: getFrameTransform(frameIndex) }
                }
              >
                <WordFrame
                  label={frame.label}
                  word={frame.word}
                  href={frame.href}
                  accent={frame.accent}
                  textProgress={textProgressByFrame[frameIndex] ?? 0}
                />
              </div>
            )
          })}

          <div
            ref={(element) => {
              frameRefs.current[MANIFESTO_FRAME_INDEX] = element
            }}
            className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
            style={{ transform: getFrameTransform(MANIFESTO_FRAME_INDEX) }}
          >
            <ManifestoFrame />
          </div>

          <div
            ref={(element) => {
              frameRefs.current[CONTACTS_FRAME_INDEX] = element
            }}
            className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0 origin-center"
            style={{ transform: getFrameTransform(CONTACTS_FRAME_INDEX) }}
          >
            <ContactsFrame />
          </div>
        </div>
      </section>
    </main>
  )
}
