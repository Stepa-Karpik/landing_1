"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type GameStatus = "playing" | "paused" | "lost"
type ModifierType = "expand" | "slow" | "multiball" | "life" | "shield"

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface Brick {
  x: number
  y: number
  width: number
  height: number
  hp: number
  maxHp: number
  hue: number
  active: boolean
}

interface FallingModifier {
  x: number
  y: number
  type: ModifierType
  vy: number
  active: boolean
}

interface GameState {
  paddleX: number
  paddleWidth: number
  balls: Ball[]
  bricks: Brick[]
  drops: FallingModifier[]
  score: number
  level: number
  lives: number
  combo: number
  shieldCharges: number
  expandUntilMs: number
  slowUntilMs: number
  status: GameStatus
}

const WORLD_WIDTH = 1600
const WORLD_HEIGHT = 900
const WORLD_ASPECT = WORLD_WIDTH / WORLD_HEIGHT

const PADDLE_BASE_WIDTH = 220
const PADDLE_HEIGHT = 20
const PADDLE_Y = WORLD_HEIGHT - 62
const PADDLE_SPEED = 980

const BALL_RADIUS = 10
const BASE_LIVES = 3
const MAX_BALLS = 5

const BRICK_MARGIN_X = 72
const BRICK_TOP = 92
const BRICK_GAP = 6

const MODIFIER_DROP_BASE = 0.065
const EXPAND_MULTIPLIER = 1.48

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const MODIFIER_LABELS: Record<ModifierType, string> = {
  expand: "Платформа+",
  slow: "Slow",
  multiball: "Мультишар",
  life: "Жизнь+",
  shield: "Щит",
}

const MODIFIER_COLORS: Record<ModifierType, string> = {
  expand: "#60a5fa",
  slow: "#a78bfa",
  multiball: "#f97316",
  life: "#22c55e",
  shield: "#facc15",
}

function getLevelConfig(level: number) {
  const safeLevel = Math.max(1, level)
  return {
    rows: clamp(5 + Math.floor(safeLevel / 2), 5, 14),
    cols: clamp(10 + Math.floor(safeLevel / 3), 10, 18),
    hpMax: clamp(1 + Math.floor(safeLevel / 4), 1, 5),
    ballSpeed: 430 + Math.min(safeLevel, 30) * 18,
    dropChance: clamp(MODIFIER_DROP_BASE + safeLevel * 0.0035, MODIFIER_DROP_BASE, 0.16),
  }
}

function createBricks(level: number): Brick[] {
  const config = getLevelConfig(level)
  const availableWidth = WORLD_WIDTH - BRICK_MARGIN_X * 2
  const brickWidth = (availableWidth - BRICK_GAP * (config.cols - 1)) / config.cols
  const brickHeight = config.rows <= 9 ? 30 : 25

  const bricks: Brick[] = []
  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const hpCap = Math.min(config.hpMax, 1 + Math.floor((level + row) / 5))
      const hp = randomInt(1, hpCap)
      const hue = (22 + row * 15 + col * 10 + level * 7) % 360
      bricks.push({
        x: BRICK_MARGIN_X + col * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (brickHeight + BRICK_GAP),
        width: brickWidth,
        height: brickHeight,
        hp,
        maxHp: hp,
        hue,
        active: true,
      })
    }
  }

  return bricks
}

function spawnBall(paddleX: number, paddleWidth: number, level: number): Ball {
  const speed = getLevelConfig(level).ballSpeed
  const horizontal = randomInt(70, 190) * (Math.random() < 0.5 ? -1 : 1)
  const vertical = -Math.sqrt(Math.max(0, speed * speed - horizontal * horizontal))
  return {
    x: paddleX + paddleWidth / 2,
    y: PADDLE_Y - BALL_RADIUS - 2,
    vx: horizontal,
    vy: vertical,
    radius: BALL_RADIUS,
  }
}

function pickModifier(): ModifierType {
  const roll = Math.random()
  if (roll < 0.33) return "expand"
  if (roll < 0.57) return "slow"
  if (roll < 0.78) return "multiball"
  if (roll < 0.9) return "life"
  return "shield"
}

function createInitialState(): GameState {
  const paddleX = WORLD_WIDTH / 2 - PADDLE_BASE_WIDTH / 2
  return {
    paddleX,
    paddleWidth: PADDLE_BASE_WIDTH,
    balls: [spawnBall(paddleX, PADDLE_BASE_WIDTH, 1)],
    bricks: createBricks(1),
    drops: [],
    score: 0,
    level: 1,
    lives: BASE_LIVES,
    combo: 0,
    shieldCharges: 0,
    expandUntilMs: 0,
    slowUntilMs: 0,
    status: "playing",
  }
}

function getBrickColor(brick: Brick) {
  const lightness = 52 - (brick.hp - 1) * 6
  return `hsl(${brick.hue} 85% ${clamp(lightness, 30, 58)}%)`
}

function ballRectOverlap(ball: Ball, brick: Brick) {
  return (
    ball.x + ball.radius >= brick.x &&
    ball.x - ball.radius <= brick.x + brick.width &&
    ball.y + ball.radius >= brick.y &&
    ball.y - ball.radius <= brick.y + brick.height
  )
}

export default function BreakoutPage() {
  const { data, recordGameResult } = useProfileTracker()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<GameState>(createInitialState())
  const frameRef = useRef<number | null>(null)
  const previousTimeRef = useRef(0)
  const reportedRef = useRef(false)
  const pointerXRef = useRef<number | null>(null)
  const keysRef = useRef({ left: false, right: false })
  const hudUpdateRef = useRef(0)

  const [hud, setHud] = useState(() => ({
    score: 0,
    level: 1,
    lives: BASE_LIVES,
    balls: 1,
    status: "playing" as GameStatus,
    mods: [] as string[],
  }))

  const bestScore = Math.max(data.gameStats.breakout.bestScore, hud.score)

  const reset = () => {
    reportedRef.current = false
    previousTimeRef.current = 0
    stateRef.current = createInitialState()
    setHud({
      score: 0,
      level: 1,
      lives: BASE_LIVES,
      balls: 1,
      status: "playing",
      mods: [],
    })
  }

  const updateHud = (timestamp: number, state: GameState) => {
    if (timestamp - hudUpdateRef.current < 80) return
    hudUpdateRef.current = timestamp

    const mods: string[] = []
    if (timestamp < state.expandUntilMs) mods.push(MODIFIER_LABELS.expand)
    if (timestamp < state.slowUntilMs) mods.push(MODIFIER_LABELS.slow)
    if (state.shieldCharges > 0) mods.push(`${MODIFIER_LABELS.shield} x${state.shieldCharges}`)

    setHud({
      score: state.score,
      level: state.level,
      lives: state.lives,
      balls: state.balls.length,
      status: state.status,
      mods,
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = (state: GameState, now: number) => {
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

      const bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT)
      bg.addColorStop(0, "#f9f6ef")
      bg.addColorStop(1, "#efe4d7")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

      ctx.strokeStyle = "rgba(17,17,17,0.05)"
      for (let x = 0; x <= WORLD_WIDTH; x += 80) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, WORLD_HEIGHT)
        ctx.stroke()
      }

      for (const brick of state.bricks) {
        if (!brick.active) continue
        ctx.fillStyle = getBrickColor(brick)
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)

        ctx.strokeStyle = "rgba(0,0,0,0.18)"
        ctx.lineWidth = 1
        ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.width - 1, brick.height - 1)

        if (brick.hp > 1) {
          ctx.fillStyle = "rgba(0,0,0,0.36)"
          ctx.font = "600 14px sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(String(brick.hp), brick.x + brick.width / 2, brick.y + brick.height / 2)
        }
      }

      const paddleGradient = ctx.createLinearGradient(state.paddleX, PADDLE_Y, state.paddleX, PADDLE_Y + PADDLE_HEIGHT)
      paddleGradient.addColorStop(0, "#111111")
      paddleGradient.addColorStop(1, "#3b3b3b")
      ctx.fillStyle = paddleGradient
      ctx.fillRect(state.paddleX, PADDLE_Y, state.paddleWidth, PADDLE_HEIGHT)

      for (const drop of state.drops) {
        if (!drop.active) continue
        ctx.fillStyle = MODIFIER_COLORS[drop.type]
        ctx.fillRect(drop.x - 12, drop.y - 12, 24, 24)
        ctx.strokeStyle = "rgba(0,0,0,0.2)"
        ctx.strokeRect(drop.x - 11.5, drop.y - 11.5, 23, 23)

        ctx.fillStyle = "rgba(0,0,0,0.8)"
        ctx.font = "700 11px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const symbol = drop.type === "expand" ? "E" : drop.type === "slow" ? "S" : drop.type === "multiball" ? "M" : drop.type === "life" ? "+" : "H"
        ctx.fillText(symbol, drop.x, drop.y + 0.5)
      }

      for (const ball of state.balls) {
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
        ctx.fillStyle = "#1f2937"
        ctx.fill()
      }

      if (state.shieldCharges > 0) {
        ctx.fillStyle = "rgba(250,204,21,0.26)"
        ctx.fillRect(0, WORLD_HEIGHT - 10, WORLD_WIDTH, 10)
      }

      if (state.status === "paused" || state.status === "lost") {
        ctx.fillStyle = "rgba(0,0,0,0.28)"
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "700 54px sans-serif"
        ctx.fillText(state.status === "lost" ? "Поражение" : "Пауза", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 26)

        ctx.font = "500 20px sans-serif"
        ctx.fillText(state.status === "lost" ? "Enter — новая попытка" : "P — продолжить", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 32)
      }

      updateHud(now, state)
    }

    const tick = (timestamp: number) => {
      const state = stateRef.current
      if (previousTimeRef.current === 0) previousTimeRef.current = timestamp
      const delta = Math.min((timestamp - previousTimeRef.current) / 1000, 0.045)
      previousTimeRef.current = timestamp

      if (state.status === "playing") {
        const now = timestamp

        const targetWidth = now < state.expandUntilMs ? PADDLE_BASE_WIDTH * EXPAND_MULTIPLIER : PADDLE_BASE_WIDTH
        state.paddleWidth += (targetWidth - state.paddleWidth) * Math.min(1, delta * 9)

        if (pointerXRef.current !== null) {
          state.paddleX = clamp(pointerXRef.current - state.paddleWidth / 2, 0, WORLD_WIDTH - state.paddleWidth)
        }

        const keyboardDirection = (keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0)
        if (keyboardDirection !== 0) {
          state.paddleX = clamp(state.paddleX + keyboardDirection * PADDLE_SPEED * delta, 0, WORLD_WIDTH - state.paddleWidth)
        }

        const simulationDelta = delta * (now < state.slowUntilMs ? 0.72 : 1)

        for (const drop of state.drops) {
          if (!drop.active) continue
          drop.y += drop.vy * delta

          const caught =
            drop.y + 12 >= PADDLE_Y &&
            drop.y - 12 <= PADDLE_Y + PADDLE_HEIGHT &&
            drop.x >= state.paddleX &&
            drop.x <= state.paddleX + state.paddleWidth

          if (caught) {
            drop.active = false

            if (drop.type === "expand") state.expandUntilMs = now + 12000
            if (drop.type === "slow") state.slowUntilMs = now + 9000
            if (drop.type === "life") state.lives = Math.min(9, state.lives + 1)
            if (drop.type === "shield") state.shieldCharges = Math.min(3, state.shieldCharges + 1)

            if (drop.type === "multiball") {
              const added: Ball[] = []
              for (const source of state.balls) {
                if (state.balls.length + added.length >= MAX_BALLS) break
                const speed = Math.hypot(source.vx, source.vy)
                const angle = Math.atan2(source.vy, source.vx)
                const spread = (Math.random() * 0.8 - 0.4)
                added.push({
                  x: source.x,
                  y: source.y,
                  vx: Math.cos(angle + spread) * speed,
                  vy: Math.sin(angle + spread) * speed,
                  radius: BALL_RADIUS,
                })
              }
              state.balls.push(...added)
            }
            continue
          }

          if (drop.y - 12 > WORLD_HEIGHT) {
            drop.active = false
          }
        }
        state.drops = state.drops.filter((drop) => drop.active)

        const nextBalls: Ball[] = []
        for (const ball of state.balls) {
          ball.x += ball.vx * simulationDelta
          ball.y += ball.vy * simulationDelta

          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius
            ball.vx = Math.abs(ball.vx)
          } else if (ball.x + ball.radius >= WORLD_WIDTH) {
            ball.x = WORLD_WIDTH - ball.radius
            ball.vx = -Math.abs(ball.vx)
          }

          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius
            ball.vy = Math.abs(ball.vy)
          }

          const paddleHit =
            ball.y + ball.radius >= PADDLE_Y &&
            ball.y - ball.radius <= PADDLE_Y + PADDLE_HEIGHT &&
            ball.x >= state.paddleX &&
            ball.x <= state.paddleX + state.paddleWidth &&
            ball.vy > 0

          if (paddleHit) {
            const offset = (ball.x - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2)
            const speed = Math.max(getLevelConfig(state.level).ballSpeed, Math.hypot(ball.vx, ball.vy))
            ball.vx = offset * speed * 0.92
            ball.vy = -Math.max(260, Math.sqrt(Math.max(0, speed * speed - ball.vx * ball.vx)))
            ball.y = PADDLE_Y - ball.radius - 1
          }

          let brickHit = false
          for (const brick of state.bricks) {
            if (!brick.active || !ballRectOverlap(ball, brick)) continue

            brickHit = true

            const overlapLeft = ball.x + ball.radius - brick.x
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius)
            const overlapTop = ball.y + ball.radius - brick.y
            const overlapBottom = brick.y + brick.height - (ball.y - ball.radius)
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

            if (minOverlap === overlapLeft) {
              ball.x = brick.x - ball.radius
              ball.vx = -Math.abs(ball.vx)
            } else if (minOverlap === overlapRight) {
              ball.x = brick.x + brick.width + ball.radius
              ball.vx = Math.abs(ball.vx)
            } else if (minOverlap === overlapTop) {
              ball.y = brick.y - ball.radius
              ball.vy = -Math.abs(ball.vy)
            } else {
              ball.y = brick.y + brick.height + ball.radius
              ball.vy = Math.abs(ball.vy)
            }

            if (brick.hp > 1) {
              brick.hp -= 1
              state.score += 12 + state.level
            } else {
              brick.active = false
              state.combo += 1
              state.score += 40 + state.level * 7 + state.combo * 2

              if (Math.random() < getLevelConfig(state.level).dropChance) {
                state.drops.push({
                  x: brick.x + brick.width / 2,
                  y: brick.y + brick.height / 2,
                  type: pickModifier(),
                  vy: 210 + Math.random() * 70,
                  active: true,
                })
              }
            }

            break
          }

          if (!brickHit) {
            state.combo = Math.max(0, state.combo - 1)
          }

          if (ball.y - ball.radius > WORLD_HEIGHT) {
            if (state.shieldCharges > 0) {
              state.shieldCharges -= 1
              ball.y = WORLD_HEIGHT - ball.radius - 6
              ball.vy = -Math.abs(ball.vy)
              nextBalls.push(ball)
            }
            continue
          }

          nextBalls.push(ball)
        }

        state.balls = nextBalls

        if (state.balls.length === 0) {
          state.lives -= 1
          state.combo = 0

          if (state.lives > 0) {
            state.balls = [spawnBall(state.paddleX, state.paddleWidth, state.level)]
          } else {
            state.status = "lost"
          }
        }

        const activeBricks = state.bricks.some((brick) => brick.active)
        if (activeBricks === false && state.status === "playing") {
          state.level += 1
          state.score += 300 + state.level * 45
          if (state.level % 4 === 0) {
            state.lives = Math.min(9, state.lives + 1)
          }
          state.bricks = createBricks(state.level)
          state.balls = [spawnBall(state.paddleX, state.paddleWidth, state.level)]
          state.combo = 0
        }
      }

      if (state.status === "lost" && !reportedRef.current) {
        reportedRef.current = true
        recordGameResult("breakout", {
          score: state.score,
          win: state.level >= 6,
        })
      }

      draw(state, timestamp)
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault()
        keysRef.current.left = true
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault()
        keysRef.current.right = true
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault()
        const state = stateRef.current
        if (state.status === "lost") return
        state.status = state.status === "playing" ? "paused" : "playing"
      }
      if (event.key === "Enter") {
        event.preventDefault()
        const state = stateRef.current
        if (state.status === "lost") {
          reset()
        }
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        keysRef.current.left = false
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        keysRef.current.right = false
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncPointer = (clientX: number) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0) return
      const normalized = (clientX - rect.left) / rect.width
      pointerXRef.current = clamp(normalized * WORLD_WIDTH, 0, WORLD_WIDTH)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || event.pointerType === "touch" || event.pointerType === "pen") {
        syncPointer(event.clientX)
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      syncPointer(event.clientX)
      const state = stateRef.current
      if (state.status === "paused") {
        state.status = "playing"
      }
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerLeave = () => {
      pointerXRef.current = null
    }

    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointerleave", onPointerLeave)

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [])

  const modsView = useMemo(() => {
    if (hud.mods.length === 0) return ["Без модификаторов"]
    return hud.mods
  }, [hud.mods])

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1760px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Score</p>
            <p className="mt-1 text-xl font-semibold">{hud.score}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Level</p>
            <p className="mt-1 text-xl font-semibold">{hud.level}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Lives</p>
            <p className="mt-1 text-xl font-semibold">{hud.lives}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Balls</p>
            <p className="mt-1 text-xl font-semibold">{hud.balls}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
            <p className="mt-1 text-xl font-semibold">{bestScore}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">State</p>
            <p className="mt-1 text-xl font-semibold capitalize">{hud.status}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modsView.map((label) => (
            <span key={label} className="rounded-full border border-black/12 bg-white/72 px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase">
              {label}
            </span>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="relative h-full max-h-full w-full max-w-[1700px] overflow-hidden rounded-2xl border border-black/16 bg-[#ece2d6]" style={{ aspectRatio: `${WORLD_ASPECT}` }}>
            <canvas ref={canvasRef} width={WORLD_WIDTH} height={WORLD_HEIGHT} className="h-full w-full" />
          </div>
        </div>
      </section>
    </main>
  )
}
