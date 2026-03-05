"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

const WIDTH = 900
const HEIGHT = 220
const GROUND_Y = 180
const DINO_X = 80
const DINO_WIDTH = 34
const DINO_HEIGHT = 44

interface Obstacle {
  x: number
  width: number
  height: number
}

interface DinoGameState {
  running: boolean
  over: boolean
  score: number
  speed: number
  dinoY: number
  dinoVelocity: number
  obstacles: Obstacle[]
  lastSpawnMs: number
  lastFrameMs: number
}

function createInitialState(): DinoGameState {
  return {
    running: true,
    over: false,
    score: 0,
    speed: 290,
    dinoY: GROUND_Y - DINO_HEIGHT,
    dinoVelocity: 0,
    obstacles: [],
    lastSpawnMs: 0,
    lastFrameMs: 0,
  }
}

function intersects(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export default function DinoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const stateRef = useRef<DinoGameState>(createInitialState())
  const reportGuardRef = useRef(false)

  const { data, recordGameResult } = useProfileTracker()

  const [scoreView, setScoreView] = useState(0)
  const [isOver, setIsOver] = useState(false)

  const bestScore = data.gameStats.dino.bestScore

  const draw = (ctx: CanvasRenderingContext2D, state: DinoGameState) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = "#f9f7f2"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.strokeStyle = "rgba(17,17,17,0.25)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(WIDTH, GROUND_Y)
    ctx.stroke()

    ctx.fillStyle = "#111111"
    ctx.fillRect(DINO_X, state.dinoY, DINO_WIDTH, DINO_HEIGHT)

    for (const obstacle of state.obstacles) {
      ctx.fillRect(obstacle.x, GROUND_Y - obstacle.height, obstacle.width, obstacle.height)
    }

    ctx.fillStyle = "rgba(17,17,17,0.68)"
    ctx.font = "12px monospace"
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 16, 20)
  }

  const restart = () => {
    reportGuardRef.current = false
    stateRef.current = createInitialState()
    setScoreView(0)
    setIsOver(false)
  }

  const jump = () => {
    const state = stateRef.current
    if (state.over) {
      restart()
      return
    }
    if (state.dinoY >= GROUND_Y - DINO_HEIGHT - 0.5) {
      state.dinoVelocity = -560
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    let seed = Math.random() * 1000

    const loop = (timestamp: number) => {
      const state = stateRef.current
      if (!state.running) return

      if (state.lastFrameMs === 0) {
        state.lastFrameMs = timestamp
      }

      const delta = Math.min((timestamp - state.lastFrameMs) / 1000, 0.05)
      state.lastFrameMs = timestamp

      if (!state.over) {
        state.score += delta * 100
        state.speed = 290 + Math.min(220, state.score * 0.22)

        state.dinoVelocity += 1300 * delta
        state.dinoY = Math.min(GROUND_Y - DINO_HEIGHT, state.dinoY + state.dinoVelocity * delta)
        if (state.dinoY >= GROUND_Y - DINO_HEIGHT) {
          state.dinoY = GROUND_Y - DINO_HEIGHT
          state.dinoVelocity = 0
        }

        state.lastSpawnMs += delta * 1000
        const spawnEvery = 820 + (Math.sin(seed) + 1) * 260
        seed += delta * 0.8
        if (state.lastSpawnMs >= spawnEvery) {
          state.lastSpawnMs = 0
          state.obstacles.push({
            x: WIDTH + 8,
            width: 18 + Math.floor(Math.random() * 16),
            height: 28 + Math.floor(Math.random() * 38),
          })
        }

        state.obstacles = state.obstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - state.speed * delta }))
          .filter((obstacle) => obstacle.x + obstacle.width > -20)

        const dinoRect = {
          x: DINO_X + 4,
          y: state.dinoY + 4,
          w: DINO_WIDTH - 8,
          h: DINO_HEIGHT - 6,
        }
        for (const obstacle of state.obstacles) {
          const obstacleRect = {
            x: obstacle.x,
            y: GROUND_Y - obstacle.height,
            w: obstacle.width,
            h: obstacle.height,
          }
          if (intersects(dinoRect, obstacleRect)) {
            state.over = true
            setIsOver(true)
            break
          }
        }
      }

      draw(context, state)
      setScoreView(Math.floor(state.score))
      animationFrameRef.current = window.requestAnimationFrame(loop)
    }

    animationFrameRef.current = window.requestAnimationFrame(loop)

    return () => {
      stateRef.current.running = false
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault()
        jump()
      } else if (event.key === "Enter" && isOver) {
        event.preventDefault()
        restart()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOver])

  useEffect(() => {
    if (!isOver || reportGuardRef.current) return
    reportGuardRef.current = true
    recordGameResult("dino", {
      score: scoreView,
      win: scoreView >= 600,
    })
  }, [isOver, recordGameResult, scoreView])

  const statusText = useMemo(() => {
    if (isOver) return "Столкновение. Пробел или Enter для рестарта."
    return "Пробел, стрелка вверх или клик для прыжка."
  }, [isOver])

  return (
    <MinigameShell
      title="Динозаврик"
      subtitle="Классический бесконечный раннер. Цель достижения: 600 очков."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center text-[11px] tracking-[0.12em] uppercase md:grid-cols-4">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2 md:col-span-2">
            <p className="text-black/55">Текущий счет</p>
            <p className="mt-0.5 text-xl font-semibold">{scoreView}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2 md:col-span-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-xl font-semibold">{bestScore}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => jump()}
          className="w-full rounded-md border border-black/14 bg-[#f9f7f2] p-2"
        >
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="h-[210px] w-full rounded-sm border border-black/12 bg-[#f9f7f2] object-cover"
          />
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => jump()}
            className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs tracking-[0.1em] uppercase"
          >
            Прыжок
          </button>
          <button
            type="button"
            onClick={() => restart()}
            className="rounded-md border border-black/20 bg-black px-3 py-1.5 text-xs tracking-[0.1em] text-white uppercase"
          >
            Рестарт
          </button>
        </div>

        <p className={`text-sm ${isOver ? "text-red-700" : "text-black/70"}`}>{statusText}</p>
      </div>
    </MinigameShell>
  )
}
