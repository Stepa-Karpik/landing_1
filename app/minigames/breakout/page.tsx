"use client"

import { useEffect, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

const WIDTH = 920
const HEIGHT = 420
const PADDLE_WIDTH = 130
const PADDLE_HEIGHT = 14
const PADDLE_Y = HEIGHT - 42
const BALL_RADIUS = 8

const BRICK_ROWS = 5
const BRICK_COLS = 10
const BRICK_GAP = 6
const BRICK_HEIGHT = 20
const BRICK_TOP = 42
const BRICK_LEFT = 18
const BRICK_WIDTH = (WIDTH - BRICK_LEFT * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS

interface Brick {
  x: number
  y: number
  active: boolean
}

interface BreakoutState {
  paddleX: number
  ballX: number
  ballY: number
  vx: number
  vy: number
  bricks: Brick[]
  score: number
  status: "playing" | "won" | "lost"
}

function createBricks() {
  const list: Brick[] = []
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      list.push({
        x: BRICK_LEFT + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        active: true,
      })
    }
  }
  return list
}

function initialState(): BreakoutState {
  return {
    paddleX: WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 80,
    vx: 240,
    vy: -260,
    bricks: createBricks(),
    score: 0,
    status: "playing",
  }
}

export default function BreakoutPage() {
  const { data, recordGameResult } = useProfileTracker()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const stateRef = useRef<BreakoutState>(initialState())
  const reportedRef = useRef(false)
  const [scoreView, setScoreView] = useState(0)
  const [statusView, setStatusView] = useState<"playing" | "won" | "lost">("playing")

  const bestScore = data.gameStats.breakout.bestScore
  const wins = data.gameStats.breakout.wins

  const restart = () => {
    reportedRef.current = false
    stateRef.current = initialState()
    setScoreView(0)
    setStatusView("playing")
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = (state: BreakoutState) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.fillStyle = "#f8f6f1"
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      ctx.fillStyle = "#111111"
      ctx.fillRect(state.paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT)

      ctx.beginPath()
      ctx.arc(state.ballX, state.ballY, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()

      for (const brick of state.bricks) {
        if (!brick.active) continue
        ctx.fillStyle = "#333333"
        ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT)
      }
    }

    let previousTimestamp = 0
    const tick = (timestamp: number) => {
      const state = stateRef.current
      if (previousTimestamp === 0) previousTimestamp = timestamp
      const delta = Math.min((timestamp - previousTimestamp) / 1000, 0.05)
      previousTimestamp = timestamp

      if (state.status === "playing") {
        state.ballX += state.vx * delta
        state.ballY += state.vy * delta

        if (state.ballX - BALL_RADIUS <= 0 || state.ballX + BALL_RADIUS >= WIDTH) {
          state.vx *= -1
          state.ballX = Math.max(BALL_RADIUS, Math.min(WIDTH - BALL_RADIUS, state.ballX))
        }

        if (state.ballY - BALL_RADIUS <= 0) {
          state.vy *= -1
          state.ballY = BALL_RADIUS
        }

        const hitsPaddle =
          state.ballY + BALL_RADIUS >= PADDLE_Y &&
          state.ballY + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT + 6 &&
          state.ballX >= state.paddleX &&
          state.ballX <= state.paddleX + PADDLE_WIDTH

        if (hitsPaddle && state.vy > 0) {
          const hitOffset = (state.ballX - (state.paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)
          state.vx = 300 * hitOffset
          state.vy = -Math.max(210, Math.abs(state.vy))
          state.ballY = PADDLE_Y - BALL_RADIUS - 1
        }

        for (const brick of state.bricks) {
          if (!brick.active) continue
          const overlapX = state.ballX + BALL_RADIUS >= brick.x && state.ballX - BALL_RADIUS <= brick.x + BRICK_WIDTH
          const overlapY = state.ballY + BALL_RADIUS >= brick.y && state.ballY - BALL_RADIUS <= brick.y + BRICK_HEIGHT
          if (!overlapX || !overlapY) continue

          brick.active = false
          state.score += 20
          state.vy *= -1
          break
        }

        const leftBricks = state.bricks.filter((brick) => brick.active).length
        if (leftBricks === 0) {
          state.status = "won"
        }

        if (state.ballY - BALL_RADIUS > HEIGHT) {
          state.status = "lost"
        }
      }

      if (state.status !== "playing" && !reportedRef.current) {
        reportedRef.current = true
        recordGameResult("breakout", {
          score: state.score,
          win: state.status === "won",
        })
      }

      setScoreView(state.score)
      setStatusView(state.status)
      draw(state)
      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [recordGameResult])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
        return
      }
      const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH
      stateRef.current.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, relativeX - PADDLE_WIDTH / 2))
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
      event.preventDefault()
      const delta = event.key === "ArrowLeft" ? -44 : 44
      stateRef.current.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, stateRef.current.paddleX + delta))
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (
    <MinigameShell title="Breakout" subtitle="Арканоид: шарик + платформа, разбивай кирпичи.">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Счет</p>
            <p className="mt-0.5 text-lg font-semibold">{scoreView}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-lg font-semibold">{bestScore}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Победы</p>
            <p className="mt-0.5 text-lg font-semibold">{wins}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[920px]">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="block h-auto w-full rounded-md border border-black/14 bg-[#f8f6f1]"
          />
        </div>

        {statusView === "won" && <p className="text-sm text-emerald-700">Все кирпичи разбиты.</p>}
        {statusView === "lost" && <p className="text-sm text-red-700">Шарик упал вниз.</p>}

        <button
          type="button"
          onClick={() => restart()}
          className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
        >
          Новая игра
        </button>
      </div>
    </MinigameShell>
  )
}
