"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const DESKTOP_POINTER_QUERY = "(hover: hover) and (pointer: fine)"
const LEFT_ARROW = "\u2190"

export function EdgeMenuReturn() {
  const pathname = usePathname()
  const [supportsDesktopHover, setSupportsDesktopHover] = useState<boolean | null>(null)
  const [isHintVisible, setIsHintVisible] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_POINTER_QUERY)
    const sync = () => setSupportsDesktopHover(media.matches)

    sync()
    media.addEventListener("change", sync)

    return () => {
      media.removeEventListener("change", sync)
    }
  }, [])

  useEffect(() => {
    if (pathname === "/" || !supportsDesktopHover) {
      setIsHintVisible(false)
      return
    }

    setIsHintVisible(true)
    const timer = window.setTimeout(() => {
      setIsHintVisible(false)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname, supportsDesktopHover])

  if (pathname === "/" || supportsDesktopHover === null) {
    return null
  }

  if (!supportsDesktopHover) {
    return (
      <Link
        href="/"
        aria-label="Return to main menu"
        className="fixed left-3 top-3 z-[120] text-[13px] leading-none text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
      >
        {LEFT_ARROW}
      </Link>
    )
  }

  return (
    <Link
      href="/"
      aria-label="Return to main menu"
      className="group fixed inset-y-0 left-0 z-[120] block w-[40px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30 hover:bg-[rgba(115,213,255,0.07)]"
      style={{
        backgroundColor: isHintVisible ? "rgba(115, 213, 255, 0.16)" : "transparent",
        transition: `background-color 280ms ${EASE}`,
      }}
    >
      <span
        aria-hidden
        className="absolute left-4 top-1/2 -translate-x-[10px] -translate-y-1/2 text-[13px] leading-none text-[#111111] opacity-0 transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100"
        style={isHintVisible ? { opacity: 1, transform: "translate3d(0, -50%, 0)" } : undefined}
      >
        {LEFT_ARROW}
      </span>
    </Link>
  )
}
