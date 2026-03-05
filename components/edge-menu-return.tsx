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
  const [isEdgeHovered, setIsEdgeHovered] = useState(false)
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

  const isArrowVisible = isEdgeHovered || isHintVisible

  return (
    <div
      className="fixed inset-y-0 left-0 z-[120] w-[40px]"
      onMouseEnter={() => setIsEdgeHovered(true)}
      onMouseLeave={() => setIsEdgeHovered(false)}
    >
      <Link
        href="/"
        aria-label="Return to main menu"
        className="absolute left-4 top-1/2 text-[13px] leading-none text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/30"
        style={{
          opacity: isArrowVisible ? 1 : 0,
          transform: `translate3d(${isArrowVisible ? 0 : -10}px, -50%, 0)`,
          transition: `opacity 280ms ${EASE}, transform 280ms ${EASE}`,
          pointerEvents: isArrowVisible ? "auto" : "none",
        }}
      >
        {LEFT_ARROW}
      </Link>
    </div>
  )
}
