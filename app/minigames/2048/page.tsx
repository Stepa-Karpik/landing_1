"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type Direction = "left" | "right" | "up" | "down"

interface Tile {
  id: number
  value: number
  row: number
  col: number
  spawned: boolean
}

const SIZE = 4

function maxTile(tiles: Tile[]) {
  return tiles.reduce((acc, tile) => Math.max(acc, tile.value), 0)
}

function hasMoves(tiles: Tile[]) {
  const grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0))
  for (const tile of tiles) {
    grid[tile.row][tile.col] = tile.value
  }

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = grid[row][col]
      if (value === 0) return true
      if (row + 1 < SIZE && grid[row + 1][col] === value) return true
      if (col + 1 < SIZE && grid[row][col + 1] === value) return true
    }
  }

  return false
}

function randomSpawnValue() {
  return Math.random() < 0.9 ? 2 : 4
}

function createInitialTiles(nextIdRef: React.MutableRefObject<number>) {
  const empty: Array<{ row: number; col: number }> = []
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      empty.push({ row, col })
    }
  }

  const firstIndex = Math.floor(Math.random() * empty.length)
  const first = empty.splice(firstIndex, 1)[0]
  const second = empty[Math.floor(Math.random() * empty.length)]

  const firstTile: Tile = {
    id: nextIdRef.current,
    value: randomSpawnValue(),
    row: first.row,
    col: first.col,
    spawned: true,
  }
  nextIdRef.current += 1

  const secondTile: Tile = {
    id: nextIdRef.current,
    value: randomSpawnValue(),
    row: second.row,
    col: second.col,
    spawned: true,
  }
  nextIdRef.current += 1

  return [firstTile, secondTile]
}

function moveTiles(tiles: Tile[], direction: Direction, nextIdRef: React.MutableRefObject<number>) {
  const toLocal = (row: number, col: number) => {
    if (direction === "left") return { x: col, y: row }
    if (direction === "right") return { x: SIZE - 1 - col, y: row }
    if (direction === "up") return { x: row, y: col }
    return { x: SIZE - 1 - row, y: col }
  }

  const fromLocal = (x: number, y: number) => {
    if (direction === "left") return { row: y, col: x }
    if (direction === "right") return { row: y, col: SIZE - 1 - x }
    if (direction === "up") return { row: x, col: y }
    return { row: SIZE - 1 - x, col: y }
  }

  type LocalTile = {
    tile: Tile
    x: number
    y: number
  }

  const lines: LocalTile[][] = Array.from({ length: SIZE }, () => [])
  for (const tile of tiles) {
    const local = toLocal(tile.row, tile.col)
    lines[local.y].push({ tile, x: local.x, y: local.y })
  }

  const nextTiles: Tile[] = []
  let changed = false
  let gained = 0

  for (let y = 0; y < SIZE; y += 1) {
    const line = lines[y].sort((first, second) => first.x - second.x)
    let targetX = 0

    for (let index = 0; index < line.length; ) {
      const current = line[index]
      const next = line[index + 1]

      if (next && next.tile.value === current.tile.value) {
        const mergedPos = fromLocal(targetX, y)
        nextTiles.push({
          id: nextIdRef.current,
          value: current.tile.value * 2,
          row: mergedPos.row,
          col: mergedPos.col,
          spawned: false,
        })
        nextIdRef.current += 1

        gained += current.tile.value * 2
        if (current.x !== targetX || next.x !== targetX) {
          changed = true
        }

        targetX += 1
        index += 2
      } else {
        const movedPos = fromLocal(targetX, y)
        nextTiles.push({
          ...current.tile,
          row: movedPos.row,
          col: movedPos.col,
          spawned: false,
        })
        if (current.x !== targetX) {
          changed = true
        }

        targetX += 1
        index += 1
      }
    }
  }

  if (!changed) {
    return { tiles, changed: false, gained: 0 }
  }

  const occupied = new Set(nextTiles.map((tile) => `${tile.row}:${tile.col}`))
  const empty: Array<{ row: number; col: number }> = []
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const key = `${row}:${col}`
      if (!occupied.has(key)) empty.push({ row, col })
    }
  }

  if (empty.length > 0) {
    const spawn = empty[Math.floor(Math.random() * empty.length)]
    nextTiles.push({
      id: nextIdRef.current,
      value: randomSpawnValue(),
      row: spawn.row,
      col: spawn.col,
      spawned: true,
    })
    nextIdRef.current += 1
  }

  return { tiles: nextTiles, changed: true, gained }
}

function getTileClass(value: number) {
  const palette: Record<number, string> = {
    2: "bg-[#eee4da] text-[#6b6256]",
    4: "bg-[#ede0c8] text-[#6b6256]",
    8: "bg-[#f2b179] text-white",
    16: "bg-[#f59563] text-white",
    32: "bg-[#f67c5f] text-white",
    64: "bg-[#f65e3b] text-white",
    128: "bg-[#edcf72] text-white",
    256: "bg-[#edcc61] text-white",
    512: "bg-[#edc850] text-white",
    1024: "bg-[#edc53f] text-white",
    2048: "bg-[#edc22e] text-white",
    4096: "bg-[#3f3a32] text-white",
    8192: "bg-[#1f1d19] text-white",
  }
  return palette[value] ?? "bg-black text-white"
}

export default function Game2048Page() {
  const { data, recordGameResult } = useProfileTracker()

  const nextIdRef = useRef(1)
  const [tiles, setTiles] = useState<Tile[]>(() => createInitialTiles(nextIdRef))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [boardPixels, setBoardPixels] = useState(460)

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const reportedRef = useRef(false)

  const bestTile = data.gameStats.game2048.bestScore
  const currentTile = useMemo(() => maxTile(tiles), [tiles])

  const commitRound = useCallback(
    (finalTiles: Tile[]) => {
      if (reportedRef.current) return
      reportedRef.current = true
      const tile = maxTile(finalTiles)
      recordGameResult("game2048", {
        score: tile,
        win: tile >= 2048,
      })
    },
    [recordGameResult],
  )

  const restart = () => {
    if (!reportedRef.current && movedRef.current) {
      commitRound(tiles)
    }

    reportedRef.current = false
    movedRef.current = false
    setTiles(createInitialTiles(nextIdRef))
    setScore(0)
    setGameOver(false)
  }

  const performMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return

      setTiles((previous) => {
        const result = moveTiles(previous, direction, nextIdRef)
        if (!result.changed) return previous

        movedRef.current = true
        setScore((old) => old + result.gained)

        if (!hasMoves(result.tiles)) {
          setGameOver(true)
          commitRound(result.tiles)
        }

        return result.tiles
      })
    },
    [commitRound, gameOver],
  )

  useEffect(() => {
    const updateBoardSize = () => {
      const nextSize = Math.min(window.innerHeight * 0.72, window.innerWidth * 0.82)
      setBoardPixels(Math.max(280, Math.floor(nextSize)))
    }

    updateBoardSize()
    window.addEventListener("resize", updateBoardSize)
    return () => window.removeEventListener("resize", updateBoardSize)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        performMove("left")
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        performMove("right")
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        performMove("up")
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        performMove("down")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [performMove])

  const gap = Math.max(6, Math.floor(boardPixels * 0.022))
  const cell = (boardPixels - gap * (SIZE + 1)) / SIZE

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1620px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Score</p>
            <p className="mt-1 text-xl font-semibold">{score}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Tile</p>
            <p className="mt-1 text-xl font-semibold">{currentTile}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
            <p className="mt-1 text-xl font-semibold">{bestTile}</p>
          </div>
          <button
            type="button"
            onClick={() => performMove("left")}
            className="rounded-xl border border-black/14 bg-white/74 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => restart()}
            className="rounded-xl border border-black/14 bg-black px-3 py-2 text-xs tracking-[0.11em] text-white uppercase"
          >
            Restart
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            type="button"
            onClick={() => performMove("up")}
            className="rounded-lg border border-black/14 bg-white/74 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            Up
          </button>
          <button
            type="button"
            onClick={() => performMove("right")}
            className="rounded-lg border border-black/14 bg-white/74 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            Right
          </button>
          <button
            type="button"
            onClick={() => performMove("down")}
            className="rounded-lg border border-black/14 bg-white/74 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            Down
          </button>
          {gameOver && (
            <div className="col-span-2 rounded-lg border border-red-300/70 bg-red-50/90 px-3 py-2 text-center text-xs tracking-[0.11em] text-red-800 uppercase">
              No Moves
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div
            className="relative rounded-xl border border-black/16 bg-[#bbada0]"
            style={{ width: boardPixels, height: boardPixels }}
            onPointerDown={(event) => {
              pointerStartRef.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              const start = pointerStartRef.current
              pointerStartRef.current = null
              if (!start) return

              const dx = event.clientX - start.x
              const dy = event.clientY - start.y
              const absX = Math.abs(dx)
              const absY = Math.abs(dy)

              if (Math.max(absX, absY) < 24) return
              if (absX > absY) {
                performMove(dx > 0 ? "right" : "left")
              } else {
                performMove(dy > 0 ? "down" : "up")
              }
            }}
          >
            <div
              className="grid h-full w-full"
              style={{
                gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`,
                gap,
                padding: gap,
              }}
            >
              {Array.from({ length: SIZE * SIZE }).map((_, index) => (
                <div key={`slot-${index}`} className="rounded-[10px] bg-[#cdc1b4]" />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-0">
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  initial={tile.spawned ? { scale: 0.58, opacity: 0.1 } : false}
                  animate={{
                    x: gap + tile.col * (cell + gap),
                    y: gap + tile.row * (cell + gap),
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.13, ease: "easeOut" }}
                  className={`absolute flex items-center justify-center rounded-[10px] font-bold ${getTileClass(tile.value)}`}
                  style={{
                    width: cell,
                    height: cell,
                    fontSize: Math.max(18, Math.floor(cell * (tile.value >= 1024 ? 0.24 : 0.34))),
                  }}
                >
                  {tile.value}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
