"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type Direction = "up" | "down" | "left" | "right"
type SnakeMode = "classic" | "tunnel" | "rush"

interface Point {
  x: number
  y: number
}

const GRID_SIZE = 26
const MODE_LABELS: Record<SnakeMode, string> = {
  classic: "Классика",
  tunnel: "Тоннель",
  rush: "Раш",
}

function initialSnake() {
  return [
    { x: 10, y: 13 },
    { x: 9, y: 13 },
    { x: 8, y: 13 },
  ]
}

function isOpposite(first: Direction, second: Direction) {
  return (
    (first === "up" && second === "down") ||
    (first === "down" && second === "up") ||
    (first === "left" && second === "right") ||
    (first === "right" && second === "left")
  )
}

function toKey(point: Point) {
  return `${point.x}:${point.y}`
}

function randomFood(snake: Point[], obstacles: Set<string>) {
  const blocked = new Set<string>([...snake.map(toKey), ...obstacles])
  const candidates: Point[] = []
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      const key = `${x}:${y}`
      if (!blocked.has(key)) {
        candidates.push({ x, y })
      }
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] ?? { x: 0, y: 0 }
}

function createRushObstacles(seedSnake: Point[]) {
  const blocked = new Set(seedSnake.map(toKey))
  const result = new Set<string>()

  while (result.size < 26) {
    const point = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }
    const key = toKey(point)
    if (blocked.has(key)) continue

    const nearStart = Math.abs(point.x - seedSnake[0].x) <= 2 && Math.abs(point.y - seedSnake[0].y) <= 2
    if (nearStart) continue

    result.add(key)
  }

  return result
}

export default function SnakePage() {
  const { data, recordGameResult } = useProfileTracker()

  const [mode, setMode] = useState<SnakeMode>("classic")
  const [snake, setSnake] = useState<Point[]>(() => initialSnake())
  const [direction, setDirection] = useState<Direction>("right")
  const [nextDirection, setNextDirection] = useState<Direction>("right")
  const [obstacles, setObstacles] = useState<Set<string>>(new Set())
  const [food, setFood] = useState<Point>(() => randomFood(initialSnake(), new Set()))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [boardPixels, setBoardPixels] = useState(560)

  const reportGuardRef = useRef(false)

  const bestScore = data.gameStats.snake.bestScore

  const reset = (nextMode: SnakeMode = mode) => {
    const seedSnake = initialSnake()
    const nextObstacles = nextMode === "rush" ? createRushObstacles(seedSnake) : new Set<string>()

    reportGuardRef.current = false
    setMode(nextMode)
    setSnake(seedSnake)
    setDirection("right")
    setNextDirection("right")
    setObstacles(nextObstacles)
    setFood(randomFood(seedSnake, nextObstacles))
    setScore(0)
    setGameOver(false)
  }

  useEffect(() => {
    const updateBoardSize = () => {
      const nextSize = Math.min(window.innerHeight * 0.77, window.innerWidth * 0.84)
      setBoardPixels(Math.max(320, Math.floor(nextSize)))
    }

    updateBoardSize()
    window.addEventListener("resize", updateBoardSize)
    return () => window.removeEventListener("resize", updateBoardSize)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      let desired: Direction | null = null
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") desired = "up"
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") desired = "down"
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") desired = "left"
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") desired = "right"
      if (!desired) return

      event.preventDefault()
      setNextDirection((previous) => (isOpposite(previous, desired!) ? previous : desired!))
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (gameOver) return

    const baseTick = mode === "rush" ? 108 : 118
    const tickMs = mode === "rush" ? Math.max(54, baseTick - score * 2) : baseTick

    const timer = window.setInterval(() => {
      setSnake((previousSnake) => {
        const activeDirection = isOpposite(direction, nextDirection) ? direction : nextDirection
        setDirection(activeDirection)

        const head = previousSnake[0]
        let nextHead: Point = { ...head }

        if (activeDirection === "up") nextHead.y -= 1
        if (activeDirection === "down") nextHead.y += 1
        if (activeDirection === "left") nextHead.x -= 1
        if (activeDirection === "right") nextHead.x += 1

        const wrap = mode === "tunnel"
        if (wrap) {
          nextHead = {
            x: (nextHead.x + GRID_SIZE) % GRID_SIZE,
            y: (nextHead.y + GRID_SIZE) % GRID_SIZE,
          }
        }

        const out = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE
        if (out) {
          setGameOver(true)
          return previousSnake
        }

        const nextKey = toKey(nextHead)
        const hitsSelf = previousSnake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
        const hitsObstacle = obstacles.has(nextKey)

        if (hitsSelf || hitsObstacle) {
          setGameOver(true)
          return previousSnake
        }

        const eats = nextHead.x === food.x && nextHead.y === food.y
        const nextSnake = [nextHead, ...previousSnake]

        if (eats) {
          setScore((previous) => previous + 1)
          setFood(randomFood(nextSnake, obstacles))
          return nextSnake
        }

        nextSnake.pop()
        return nextSnake
      })
    }, tickMs)

    return () => window.clearInterval(timer)
  }, [direction, food.x, food.y, gameOver, mode, nextDirection, obstacles, score])

  useEffect(() => {
    if (!gameOver || reportGuardRef.current) return
    reportGuardRef.current = true

    recordGameResult("snake", {
      score,
      win: score >= 60,
      mode,
    })
  }, [gameOver, mode, recordGameResult, score])

  const cellSize = boardPixels / GRID_SIZE
  const snakeSet = useMemo(() => new Set(snake.map(toKey)), [snake])

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1620px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Score</p>
            <p className="mt-1 text-xl font-semibold">{score}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
            <p className="mt-1 text-xl font-semibold">{bestScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODE_LABELS) as SnakeMode[]).map((modeKey) => (
            <button
              key={modeKey}
              type="button"
              onClick={() => reset(modeKey)}
              className={`rounded-xl border px-3 py-2 text-xs tracking-[0.12em] uppercase ${
                mode === modeKey
                  ? "border-black bg-black text-white"
                  : "border-black/14 bg-white/76 text-black"
              }`}
            >
              {MODE_LABELS[modeKey]}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="relative rounded-xl border border-black/16 bg-[#1a201d] p-2" style={{ width: boardPixels + 16, height: boardPixels + 16 }}>
            <div
              className="grid h-full w-full rounded-[8px] bg-black/35 p-[3px]"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gap: 2,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
                <div key={`slot-${index}`} className="rounded-[2px] border border-white/[0.035] bg-black/24" />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-2">
              {[...obstacles].map((key) => {
                const [xRaw, yRaw] = key.split(":")
                const x = Number(xRaw)
                const y = Number(yRaw)
                return (
                  <div
                    key={`obstacle-${key}`}
                    className="absolute rounded-[4px] border border-black/20 bg-[#5d4f3f]"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      transform: `translate(${x * cellSize}px, ${y * cellSize}px)`,
                    }}
                  />
                )
              })}

              {snake.map((part, index) => {
                const isHead = index === 0
                return (
                  <div
                    key={`snake-${part.x}-${part.y}-${index}`}
                    className={`absolute rounded-[5px] border border-black/20 ${
                      isHead ? "bg-[#41d36c] shadow-[0_0_14px_rgba(65,211,108,0.48)]" : "bg-[#2ca357]"
                    }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      transform: `translate(${part.x * cellSize}px, ${part.y * cellSize}px)`,
                    }}
                  />
                )
              })}

              {!snakeSet.has(toKey(food)) && null}

              <div
                className="absolute"
                style={{
                  width: cellSize,
                  height: cellSize,
                  transform: `translate(${food.x * cellSize}px, ${food.y * cellSize}px)`,
                }}
              >
                <img src="/games/snake/apple.png" alt="" draggable={false} className="h-full w-full object-contain p-[1px]" />
              </div>
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="rounded-lg border border-red-300/70 bg-red-50/90 px-3 py-2 text-center text-xs tracking-[0.11em] text-red-800 uppercase">
            Game Over
          </div>
        )}
      </section>
    </main>
  )
}
