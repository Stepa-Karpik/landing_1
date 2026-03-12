"use client"

import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

interface Gem {
  id: number
  color: number
  row: number
  col: number
  entering: boolean
}

interface Point {
  row: number
  col: number
}

type Grid = Array<Array<Gem | null>>

const SIZE = 9
const COLORS = 6
const START_MOVES = 32

const GEM_CLASSES = [
  "bg-[#ff8ea1]",
  "bg-[#ffd166]",
  "bg-[#7bd88f]",
  "bg-[#6fb8ff]",
  "bg-[#b992ff]",
  "bg-[#ff9f6a]",
]

const GEM_GLOWS = [
  "shadow-[0_0_14px_rgba(255,142,161,0.55)]",
  "shadow-[0_0_14px_rgba(255,209,102,0.52)]",
  "shadow-[0_0_14px_rgba(123,216,143,0.52)]",
  "shadow-[0_0_14px_rgba(111,184,255,0.52)]",
  "shadow-[0_0_14px_rgba(185,146,255,0.52)]",
  "shadow-[0_0_14px_rgba(255,159,106,0.52)]",
]

function randomColor() {
  return Math.floor(Math.random() * COLORS)
}

function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null))
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((gem) => (gem ? { ...gem } : null)))
}

function isAdjacent(first: Point, second: Point) {
  const rowDiff = Math.abs(first.row - second.row)
  const colDiff = Math.abs(first.col - second.col)
  return rowDiff + colDiff === 1
}

function findMatches(grid: Grid) {
  const marks = new Set<string>()

  for (let row = 0; row < SIZE; row += 1) {
    let streak = 1
    for (let col = 1; col <= SIZE; col += 1) {
      const current = col < SIZE ? grid[row][col]?.color ?? null : null
      const previous = grid[row][col - 1]?.color ?? null
      if (col < SIZE && current !== null && previous !== null && current === previous) {
        streak += 1
      } else {
        if (streak >= 3 && previous !== null) {
          for (let index = 0; index < streak; index += 1) {
            marks.add(`${row}:${col - 1 - index}`)
          }
        }
        streak = 1
      }
    }
  }

  for (let col = 0; col < SIZE; col += 1) {
    let streak = 1
    for (let row = 1; row <= SIZE; row += 1) {
      const current = row < SIZE ? grid[row][col]?.color ?? null : null
      const previous = grid[row - 1][col]?.color ?? null
      if (row < SIZE && current !== null && previous !== null && current === previous) {
        streak += 1
      } else {
        if (streak >= 3 && previous !== null) {
          for (let index = 0; index < streak; index += 1) {
            marks.add(`${row - 1 - index}:${col}`)
          }
        }
        streak = 1
      }
    }
  }

  return marks
}

function swapCells(grid: Grid, first: Point, second: Point) {
  const next = cloneGrid(grid)
  const firstGem = next[first.row][first.col]
  const secondGem = next[second.row][second.col]
  if (!firstGem || !secondGem) return next

  next[first.row][first.col] = { ...secondGem, row: first.row, col: first.col }
  next[second.row][second.col] = { ...firstGem, row: second.row, col: second.col }
  return next
}

function createResolvedGrid(startGrid: Grid, nextIdRef: React.MutableRefObject<number>) {
  let grid = cloneGrid(startGrid)
  let gainedScore = 0
  let maxCascade = 0

  while (true) {
    const matches = findMatches(grid)
    if (matches.size === 0) break

    maxCascade += 1
    gainedScore += matches.size * 18 * maxCascade

    for (const mark of matches) {
      const [rowRaw, colRaw] = mark.split(":")
      const row = Number(rowRaw)
      const col = Number(colRaw)
      grid[row][col] = null
    }

    const collapsed = createEmptyGrid()

    for (let col = 0; col < SIZE; col += 1) {
      const existing: Gem[] = []
      for (let row = SIZE - 1; row >= 0; row -= 1) {
        const gem = grid[row][col]
        if (gem) existing.push(gem)
      }

      let targetRow = SIZE - 1
      for (const gem of existing) {
        collapsed[targetRow][col] = {
          ...gem,
          row: targetRow,
          col,
          entering: false,
        }
        targetRow -= 1
      }

      while (targetRow >= 0) {
        collapsed[targetRow][col] = {
          id: nextIdRef.current,
          color: randomColor(),
          row: targetRow,
          col,
          entering: true,
        }
        nextIdRef.current += 1
        targetRow -= 1
      }
    }

    grid = collapsed
  }

  return { grid, gainedScore, maxCascade }
}

function createInitialGrid(nextIdRef: React.MutableRefObject<number>) {
  let grid = createEmptyGrid()

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      let color = randomColor()

      while (
        (col >= 2 && grid[row][col - 1]?.color === color && grid[row][col - 2]?.color === color) ||
        (row >= 2 && grid[row - 1][col]?.color === color && grid[row - 2][col]?.color === color)
      ) {
        color = randomColor()
      }

      grid[row][col] = {
        id: nextIdRef.current,
        color,
        row,
        col,
        entering: false,
      }
      nextIdRef.current += 1
    }
  }

  return grid
}

export default function Match3Page() {
  const { data, recordGameResult } = useProfileTracker()

  const nextIdRef = useRef(1)
  const [grid, setGrid] = useState<Grid>(() => createInitialGrid(nextIdRef))
  const [selected, setSelected] = useState<Point | null>(null)
  const [movesLeft, setMovesLeft] = useState(START_MOVES)
  const [score, setScore] = useState(0)
  const [bestCascade, setBestCascade] = useState(0)
  const [busy, setBusy] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [boardPixels, setBoardPixels] = useState(560)

  const reportGuardRef = useRef(false)

  useEffect(() => {
    const updateBoardSize = () => {
      const nextSize = Math.min(window.innerHeight * 0.77, window.innerWidth * 0.84)
      setBoardPixels(Math.max(300, Math.floor(nextSize)))
    }

    updateBoardSize()
    window.addEventListener("resize", updateBoardSize)
    return () => window.removeEventListener("resize", updateBoardSize)
  }, [])

  useEffect(() => {
    if (movesLeft > 0 || busy || gameOver) return
    setGameOver(true)
  }, [busy, gameOver, movesLeft])

  useEffect(() => {
    if (!gameOver || reportGuardRef.current) return
    reportGuardRef.current = true

    recordGameResult("match3", {
      score,
      win: score >= 1400,
    })
  }, [gameOver, recordGameResult, score])

  const reset = () => {
    reportGuardRef.current = false
    setGrid(createInitialGrid(nextIdRef))
    setSelected(null)
    setMovesLeft(START_MOVES)
    setScore(0)
    setBestCascade(0)
    setBusy(false)
    setGameOver(false)
  }

  const onGemClick = (row: number, col: number) => {
    if (busy || gameOver) return

    const clicked = { row, col }
    if (!selected) {
      setSelected(clicked)
      return
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null)
      return
    }

    if (!isAdjacent(selected, clicked)) {
      setSelected(clicked)
      return
    }

    const first = selected
    const second = clicked
    setSelected(null)
    setBusy(true)

    setMovesLeft((previous) => Math.max(0, previous - 1))

    const swapped = swapCells(grid, first, second)
    setGrid(swapped)

    window.setTimeout(() => {
      const matchAfterSwap = findMatches(swapped)

      if (matchAfterSwap.size === 0) {
        const reverted = swapCells(swapped, first, second)
        setGrid(reverted)
        window.setTimeout(() => {
          setBusy(false)
        }, 170)
        return
      }

      const resolved = createResolvedGrid(swapped, nextIdRef)
      setGrid(resolved.grid)
      setScore((previous) => previous + resolved.gainedScore)
      setBestCascade((previous) => Math.max(previous, resolved.maxCascade))

      window.setTimeout(() => {
        setBusy(false)
      }, 200)
    }, 170)
  }

  const gems = useMemo(() => {
    const list: Gem[] = []
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const gem = grid[row][col]
        if (gem) list.push(gem)
      }
    }
    return list
  }, [grid])

  const cellSize = boardPixels / SIZE
  const bestScore = data.gameStats.match3.bestScore

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1620px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Score</p>
            <p className="mt-1 text-xl font-semibold">{score}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Moves</p>
            <p className="mt-1 text-xl font-semibold">{movesLeft}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
            <p className="mt-1 text-xl font-semibold">{bestScore}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Cascade</p>
            <p className="mt-1 text-xl font-semibold">x{bestCascade}</p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border border-black/14 bg-black px-3 py-2 text-xs tracking-[0.11em] text-white uppercase"
          >
            Restart
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="relative rounded-xl border border-black/16 bg-[#1f2430] p-2" style={{ width: boardPixels + 16, height: boardPixels + 16 }}>
            <div className="grid h-full w-full rounded-[8px] bg-black/30 p-[4px]" style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`, gap: 4 }}>
              {Array.from({ length: SIZE * SIZE }).map((_, index) => (
                <div key={`slot-${index}`} className="rounded-[5px] border border-white/[0.05] bg-black/20" />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-2">
              {gems.map((gem) => {
                const isSelected = selected?.row === gem.row && selected?.col === gem.col
                return (
                  <motion.button
                    key={gem.id}
                    type="button"
                    initial={gem.entering ? { y: -cellSize * 1.3, opacity: 0 } : false}
                    animate={{
                      x: gem.col * cellSize,
                      y: gem.row * cellSize,
                      opacity: 1,
                      scale: isSelected ? 1.08 : 1,
                    }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    onClick={() => onGemClick(gem.row, gem.col)}
                    className="pointer-events-auto absolute flex items-center justify-center rounded-[9px] border border-black/20"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      padding: Math.max(2, Math.floor(cellSize * 0.1)),
                    }}
                  >
                    <span
                      className={`h-full w-full rounded-[7px] border border-white/26 ${GEM_CLASSES[gem.color]} ${GEM_GLOWS[gem.color]} transition-transform`}
                    />
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="rounded-lg border border-red-300/70 bg-red-50/90 px-3 py-2 text-center text-xs tracking-[0.11em] text-red-800 uppercase">
            Round Complete
          </div>
        )}
      </section>
    </main>
  )
}
