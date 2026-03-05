"use client"

import { type RefObject, useEffect, useMemo, useState } from "react"

export interface AtmosphereBlob {
  id: string
  color: string
  size: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  opacity?: number
  blur?: number
  maxShift?: number
  speed?: number
}

interface RouteAtmosphereProps {
  blobs: AtmosphereBlob[]
  scrollContainer?: RefObject<HTMLElement | null>
}

function fractional(value: number) {
  return value - Math.floor(value)
}

function hashSeed(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function randomFromSeed(seed: number, offset: number) {
  return fractional(Math.sin(seed * 0.00013 + offset * 12.9898) * 43758.5453)
}

export function RouteAtmosphere({ blobs, scrollContainer }: RouteAtmosphereProps) {
  const [scrollOffset, setScrollOffset] = useState(0)

  const motionProfiles = useMemo(() => {
    return blobs.map((blob, index) => {
      const seed = hashSeed(`${blob.id}-${index}`)
      const maxShift = blob.maxShift ?? 100
      const amplitudeX = 34 + randomFromSeed(seed, 1) * (maxShift - 34)
      const amplitudeY = 34 + randomFromSeed(seed, 2) * (maxShift - 34)
      const directionX = randomFromSeed(seed, 3) > 0.5 ? 1 : -1
      const directionY = randomFromSeed(seed, 4) > 0.5 ? 1 : -1
      const phaseX = randomFromSeed(seed, 5) * Math.PI * 2
      const phaseY = randomFromSeed(seed, 6) * Math.PI * 2
      const speed = blob.speed ?? 0.0015 + randomFromSeed(seed, 7) * 0.0012
      const secondarySpeed = speed * (0.72 + randomFromSeed(seed, 8) * 0.5)

      return {
        amplitudeX,
        amplitudeY,
        directionX,
        directionY,
        phaseX,
        phaseY,
        speed,
        secondarySpeed,
      }
    })
  }, [blobs])

  useEffect(() => {
    const target = scrollContainer?.current
    let frameId: number | null = null

    const readOffset = () => {
      const nextOffset = target ? target.scrollTop + target.scrollLeft : window.scrollY + window.scrollX
      setScrollOffset((previous) => (Math.abs(previous - nextOffset) > 0.25 ? nextOffset : previous))
    }

    const onScroll = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        readOffset()
      })
    }

    readOffset()

    if (target) {
      target.addEventListener("scroll", onScroll, { passive: true })
    } else {
      window.addEventListener("scroll", onScroll, { passive: true })
    }
    window.addEventListener("resize", onScroll)

    return () => {
      if (target) {
        target.removeEventListener("scroll", onScroll)
      } else {
        window.removeEventListener("scroll", onScroll)
      }
      window.removeEventListener("resize", onScroll)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [scrollContainer])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {blobs.map((blob, index) => {
        const motion = motionProfiles[index]
        const shiftX =
          Math.sin(scrollOffset * motion.speed + motion.phaseX) * motion.amplitudeX * motion.directionX
        const shiftY =
          Math.cos(scrollOffset * motion.secondarySpeed + motion.phaseY) * motion.amplitudeY * motion.directionY

        return (
          <div
            key={blob.id}
            className="pointer-events-none absolute"
            style={{
              top: blob.top,
              right: blob.right,
              bottom: blob.bottom,
              left: blob.left,
              transform: `translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0)`,
            }}
          >
            <div
              className="route-ambient"
              style={{
                backgroundColor: blob.color,
                width: blob.size,
                height: blob.size,
                opacity: blob.opacity,
                filter: blob.blur ? `blur(${blob.blur}px)` : undefined,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
