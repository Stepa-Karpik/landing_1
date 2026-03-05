"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type Direction = "up" | "down" | "left" | "right"

interface Point {
  x: number
  y: number
}

const GRID_SIZE = 18
const TICK_MS = 120

function randomFood(snake: Point[]) {
  const blocked = new Set(snake.map((cell) => `${cell.x}:${cell.y}`))
  const candidates: Point[] = []
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      const key = `${x}:${y}`
      if (!blocked.has(key)) candidates.push({ x, y })
    }
  }
  return candidates[Math.floor(Math.random() * candidates.length)] ?? { x: 0, y: 0 }
}

function initialSnake() {
  return [
    { x: 7, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 9 },
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

export default function SnakePage() {
  const { data, recordGameResult } = useProfileTracker()
  const [snake, setSnake] = useState<Point[]>(() => initialSnake())
  const [direction, setDirection] = useState<Direction>("right")
  const [nextDirection, setNextDirection] = useState<Direction>("right")
  const [food, setFood] = useState<Point>(() => randomFood(initialSnake()))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const reportedRef = useRef(false)

  const bestScore = data.gameStats.snake.bestScore

  const reset = () => {
    const seed = initialSnake()
    reportedRef.current = false
    setSnake(seed)
    setDirection("right")
    setNextDirection("right")
    setFood(randomFood(seed))
    setScore(0)
    setGameOver(false)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      let desired: Direction | null = null
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") desired = "up"
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") desired = "down"
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") desired = "left"
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") desired = "right"
      if (!desired) return
      event.preventDefault()
      setNextDirection((previous) => {
        if (isOpposite(previous, desired!)) return previous
        return desired!
      })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (gameOver) return
    const timer = window.setInterval(() => {
      setSnake((previousSnake) => {
        const activeDirection = isOpposite(direction, nextDirection) ? direction : nextDirection
        setDirection(activeDirection)

        const head = previousSnake[0]
        const nextHead: Point = { ...head }
        if (activeDirection === "up") nextHead.y -= 1
        if (activeDirection === "down") nextHead.y += 1
        if (activeDirection === "left") nextHead.x -= 1
        if (activeDirection === "right") nextHead.x += 1

        const out = nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE
        const hitsSelf = previousSnake.some((part) => part.x === nextHead.x && part.y === nextHead.y)
        if (out || hitsSelf) {
          setGameOver(true)
          return previousSnake
        }

        const eats = nextHead.x === food.x && nextHead.y === food.y
        const grown = [nextHead, ...previousSnake]
        if (eats) {
          setScore((previous) => previous + 1)
          setFood(randomFood(grown))
          return grown
        }
        grown.pop()
        return grown
      })
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [direction, food, gameOver, nextDirection])

  useEffect(() => {
    if (!gameOver || reportedRef.current) return
    reportedRef.current = true
    recordGameResult("snake", {
      score,
      win: score >= 40,
    })
  }, [gameOver, recordGameResult, score])

  const cells = useMemo(() => {
    const map = new Map<string, "snake" | "food">()
    for (const part of snake) {
      map.set(`${part.x}:${part.y}`, "snake")
    }
    map.set(`${food.x}:${food.y}`, "food")
    return map
  }, [food.x, food.y, snake])

  return (
    <MinigameShell title="Змейка" subtitle="Управление: WASD или стрелки. Цель достижения: 40 очков.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Счет</p>
            <p className="mt-0.5 text-lg font-semibold">{score}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-lg font-semibold">{bestScore}</p>
          </div>
        </div>

        <div className="w-fit rounded-md border border-black/12 bg-[#faf8f3] p-2">
          <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-1">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE
              const y = Math.floor(index / GRID_SIZE)
              const key = `${x}:${y}`
              const kind = cells.get(key)
              const className =
                kind === "snake"
                  ? "bg-black"
                  : kind === "food"
                    ? "bg-red-500"
                    : "bg-white border-black/10"

              return <div key={key} className={`h-4 w-4 rounded-[2px] border ${className}`} />
            })}
          </div>
        </div>

        {gameOver && <p className="text-sm text-red-700">Столкновение. Нажми «Новая игра».</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
          >
            Новая игра
          </button>
        </div>
      </div>
    </MinigameShell>
  )
}
