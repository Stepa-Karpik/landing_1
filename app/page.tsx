"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

const LINES_COUNT = 20
const LINE_WIDTH = 1
const LINE_GAP = 9
const TRACKER_WIDTH = 30

const manifestoLines = [
  "Make it fast.",
  "Make it beautiful.",
  "Make it consistent.",
  "Make it carefully.",
  "Make it timeless.",
  "Make it soulful.",
  "Make it.",
]

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
          className="absolute top-0 h-[18px] w-[30px] border border-[#969696] bg-transparent"
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
  return (
    <article className="relative h-full w-full overflow-hidden bg-[#f4f4f4]">
      <div className="absolute right-0 top-0 h-full aspect-square rounded-full bg-[#ffff02]" />
      <div className="relative flex h-full items-center gap-16 p-16 text-[#141519]">
        <div className="relative">
          <p className="text-[clamp(44px,6vw,85px)] leading-[0.98]">Rauno Freiberg</p>
          <p className="ml-16 text-[clamp(44px,6vw,85px)] leading-[0.98]">is an Estonian</p>
          <p className="text-[clamp(44px,6vw,85px)] leading-[0.98]">interaction</p>
          <p className="ml-16 text-[clamp(44px,6vw,85px)] leading-[0.98]">designer</p>
          <p className="text-[clamp(44px,6vw,85px)] leading-[0.98]">working with Vercel</p>
          <p className="ml-16 text-[clamp(44px,6vw,85px)] leading-[0.98]">and Devouring Details</p>
        </div>
      </div>
    </article>
  )
}

function WordFrame({
  label,
  word,
  href,
  withOrangeCircle = false,
}: {
  label: string
  word: string
  href: string
  withOrangeCircle?: boolean
}) {
  const external = href.startsWith("http")

  const frameBody = (
    <>
      <FrameLabel>{label}</FrameLabel>
      <article className="relative h-full w-full overflow-hidden bg-[#f4f4f4] transition-transform duration-150 group-hover:scale-[1.004]">
        <div className="flex h-full items-center">
          <h2
            aria-hidden
            className="w-full select-none text-[clamp(240px,36vw,720px)] leading-[0.88] tracking-[-0.05em] text-black"
          >
            {word}
          </h2>
        </div>
        {withOrangeCircle && (
          <div className="pointer-events-none absolute right-[-32%] top-0 h-full aspect-square rounded-full bg-[#ff6100]" />
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
      <p className="text-[clamp(38px,5.25vw,75px)] leading-[1.08]">
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
  return (
    <article className="relative h-full w-full bg-[#f4f4f4]">
      <a
        href="https://twitter.com/raunofreiberg"
        target="_blank"
        rel="noreferrer"
        className="absolute left-[50px] top-[50px] text-[clamp(34px,4vw,85px)] leading-none text-[#191a1e]"
      >
        Twitter
      </a>
      <a
        href="https://2023.rauno.me/"
        target="_blank"
        rel="noreferrer"
        className="absolute right-[50px] top-[50px] text-[clamp(34px,4vw,85px)] leading-none text-[#191a1e]"
      >
        2023
      </a>
      <a
        href="https://2022.rauno.me/"
        target="_blank"
        rel="noreferrer"
        className="absolute left-[50px] bottom-[50px] text-[clamp(34px,4vw,85px)] leading-none text-[#191a1e]"
      >
        2022
      </a>
      <a
        href="https://github.com/raunofreiberg"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-[50px] right-[50px] text-[clamp(34px,4vw,85px)] leading-none text-[#191a1e]"
      >
        GitHub
      </a>
      <a
        href="mailto:hello@rauno.me"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(34px,4vw,85px)] leading-none text-[#191a1e]"
      >
        Email
      </a>
    </article>
  )
}

export default function Page() {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)

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

    const onWheel = (event: WheelEvent) => {
      const dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (dominantDelta === 0) return
      event.preventDefault()
      scroller.scrollLeft += dominantDelta * 2.8
    }

    const onScroll = () => {
      const max = Math.max(scroller.scrollWidth - scroller.clientWidth, 1)
      setProgress(scroller.scrollLeft / max)
    }

    onScroll()
    scroller.addEventListener("wheel", onWheel, { passive: false })
    scroller.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      scroller.removeEventListener("wheel", onWheel)
      scroller.removeEventListener("scroll", onScroll)
    }
  }, [])

  const railPadding = useMemo(() => "max(30px, calc((100vw - clamp(920px, 78vw, 1200px)) / 2))", [])

  return (
    <main className="relative h-screen overflow-hidden bg-[#ededed]">
      <Minimap progress={progress} />
      <CenterCross />

      <div
        ref={scrollerRef}
        className="flex h-full w-full touch-pan-x items-center gap-10 overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: railPadding }}
      >
        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <MainIntroFrame />
        </div>

        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <WordFrame label="Devouring Details" word="DD" href="https://www.devouringdetails.com/" withOrangeCircle />
        </div>

        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <WordFrame label="Craft" word="Craft" href="/craft" />
        </div>

        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <WordFrame label="Projects" word="Projects" href="/projects" />
        </div>

        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <ManifestoFrame />
        </div>

        <div className="relative h-[clamp(560px,72vh,720px)] w-[clamp(920px,78vw,1200px)] shrink-0">
          <ContactsFrame />
        </div>
      </div>
    </main>
  )
}
