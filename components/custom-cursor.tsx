"use client"

import { useEffect, useRef } from "react"

const TRIANGLE_ROTATION_DEG = 0
const ORB_IDLE_SIZE = 27
const TRIANGLE_CLIP_PATH = "polygon(0% 0%, 86.6% 50%, 0% 100%)"

function isInteractiveElement(startElement: Element | null) {
  let element = startElement as HTMLElement | null

  while (element) {
    if (element.tagName === "A" || element.tagName === "BUTTON") return true
    if (window.getComputedStyle(element).cursor === "pointer") return true
    element = element.parentElement
  }

  return false
}

export function CustomCursor() {
  const shapeRef = useRef<HTMLDivElement | null>(null)
  const orbRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canUseFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    if (!canUseFinePointer.matches) return

    const shape = shapeRef.current
    const orb = orbRef.current
    if (!shape || !orb) return

    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }

    const orbState = {
      x: pointer.x,
      y: pointer.y,
      size: ORB_IDLE_SIZE,
    }

    let scale = 1
    let isVisible = false
    let isHoveringInteractive = false
    let isPressing = false
    let rafId = 0

    const render = () => {
      const targetScale = (isHoveringInteractive ? 1.4 : 1) * (isPressing ? 0.85 : 1)
      const scaleFollow = isPressing ? 0.38 : 0.22
      scale += (targetScale - scale) * scaleFollow

      const shapeSize = Math.max(shape.offsetWidth, 1)
      const orbTargetX = pointer.x + shapeSize * 0.5
      const orbTargetY = pointer.y + shapeSize * 0.5
      const orbFollow = 0.04
      orbState.x += (orbTargetX - orbState.x) * orbFollow
      orbState.y += (orbTargetY - orbState.y) * orbFollow
      orbState.size += (ORB_IDLE_SIZE - orbState.size) * 0.28

      shape.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) rotate(${TRIANGLE_ROTATION_DEG}deg) scale(${scale})`
      shape.style.opacity = isVisible ? "1" : "0"
      shape.style.boxShadow = isHoveringInteractive
        ? "0 0 0 1px rgba(255, 102, 182, 0.95), 0 0 10px rgba(255, 61, 156, 0.82), 0 0 18px rgba(255, 0, 128, 0.62)"
        : "none"

      orb.style.transform = `translate3d(${orbState.x}px, ${orbState.y}px, 0) translate(-50%, -50%)`
      orb.style.width = `${orbState.size}px`
      orb.style.height = `${orbState.size}px`
      orb.style.opacity = isVisible ? "1" : "0"

      rafId = window.requestAnimationFrame(render)
    }

    const onMouseMove = (event: MouseEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      isVisible = true
      isHoveringInteractive = isInteractiveElement(event.target as Element | null)
    }

    const onMouseDown = () => {
      isPressing = true
    }

    const onMouseUp = () => {
      isPressing = false
    }

    const onWindowBlur = () => {
      isPressing = false
      isHoveringInteractive = false
    }

    const onWindowMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        isVisible = false
      }
    }

    rafId = window.requestAnimationFrame(render)
    window.addEventListener("mousemove", onMouseMove, { passive: true })
    window.addEventListener("mousedown", onMouseDown, { passive: true })
    window.addEventListener("mouseup", onMouseUp, { passive: true })
    window.addEventListener("blur", onWindowBlur)
    window.addEventListener("mouseout", onWindowMouseOut)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("blur", onWindowBlur)
      window.removeEventListener("mouseout", onWindowMouseOut)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] select-none">
      <div
        ref={orbRef}
        className="fixed left-0 top-0 rounded-full"
        style={{
          width: `${ORB_IDLE_SIZE}px`,
          height: `${ORB_IDLE_SIZE}px`,
          background: "#6B0F1A",
          opacity: 0,
          transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
          willChange: "transform, width, height, opacity",
          transition: "opacity 120ms ease-out",
        }}
      />

      <div
        ref={shapeRef}
        className="fixed left-0 top-0 aspect-square bg-black"
        style={{
          width: "clamp(20px, 1.35vw, 24px)",
          transform: `translate3d(-100px, -100px, 0) rotate(${TRIANGLE_ROTATION_DEG}deg) scale(1)`,
          transformOrigin: "0 0",
          opacity: 0,
          clipPath: TRIANGLE_CLIP_PATH,
          willChange: "transform, opacity, box-shadow",
          transition: "opacity 120ms ease-out",
        }}
      />
    </div>
  )
}
