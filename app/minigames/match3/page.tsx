"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type Tile = number | null

interface Point {
  row: number
  col: number
}

const SIZE = 8
const COLORS = 6
const START_MOVES = 25
const TILE_STYLES = [
  "bg-red-400",
  "bg-emerald-400",
  "bg-blue-400",
  "bg-amber-400",
  "bg-fuchsia-400",
  "bg-cyan-400",
]

function randomTile(): Tile {
  return Math.floor(Math.random() * COLORS)
}

function createBoard() {
  const board: Tile[][] = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => randomTile()))
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      while (
        (col >= 2 && board[row][col] === board[row][col - 1] && board[row][col] === board[row][col - 2]) ||
        (row >= 2 && board[row][col] === board[row - 1][col] && board[row][col] === board[row - 2][col])
      ) {
        board[row][col] = randomTile()
      }
    }
  }
  return board
}

function cloneBoard(board: Tile[][]) {
  return board.map((row) => [...row])
}

function swap(board: Tile[][], first: Point, second: Point) {
  const next = cloneBoard(board)
  const temp = next[first.row][first.col]
  next[first.row][first.col] = next[second.row][second.col]
  next[second.row][second.col] = temp
  return next
}

function isAdjacent(first: Point, second: Point) {
  const rowDiff = Math.abs(first.row - second.row)
  const colDiff = Math.abs(first.col - second.col)
  return rowDiff + colDiff === 1
}

function findMatches(board: Tile[][]) {
  const marks = new Set<string>()

  for (let row = 0; row < SIZE; row += 1) {
    let streak = 1
    for (let col = 1; col <= SIZE; col += 1) {
      const current = col < SIZE ? board[row][col] : null
      const previous = board[row][col - 1]
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
      const current = row < SIZE ? board[row][col] : null
      const previous = board[row - 1][col]
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

function collapseBoard(board: Tile[][]) {
  const next = cloneBoard(board)

  for (let col = 0; col < SIZE; col += 1) {
    const stack: Tile[] = []
    for (let row = SIZE - 1; row >= 0; row -= 1) {
      if (next[row][col] !== null) {
        stack.push(next[row][col])
      }
    }

    for (let row = SIZE - 1; row >= 0; row -= 1) {
      const nextValue = stack.shift()
      next[row][col] = nextValue ?? randomTile()
    }
  }

  return next
}

function resolveMatches(board: Tile[][]) {
  let nextBoard = cloneBoard(board)
  let gainedScore = 0

  while (true) {
    const marks = findMatches(nextBoard)
    if (marks.size === 0) break

    gainedScore += marks.size * 12
    for (const mark of marks) {
      const [rowRaw, colRaw] = mark.split(":")
      const row = Number(rowRaw)
      const col = Number(colRaw)
      nextBoard[row][col] = null
    }

    nextBoard = collapseBoard(nextBoard)
  }

  return { board: nextBoard, gainedScore }
}

export default function Match3Page() {
  const { data, recordGameResult } = useProfileTracker()
  const [board, setBoard] = useState<Tile[][]>(() => createBoard())
  const [selected, setSelected] = useState<Point | null>(null)
  const [score, setScore] = useState(0)
  const [movesLeft, setMovesLeft] = useState(START_MOVES)
  const [gameOver, setGameOver] = useState(false)
  const reportGuardRef = useRef(false)

  const bestScore = data.gameStats.match3.bestScore

  const reset = () => {
    reportGuardRef.current = false
    setBoard(createBoard())
    setSelected(null)
    setScore(0)
    setMovesLeft(START_MOVES)
    setGameOver(false)
  }

  const onTileClick = (row: number, col: number) => {
    if (gameOver) return

    const point = { row, col }
    if (!selected) {
      setSelected(point)
      return
    }

    if (selected.row === row && selected.col === col) {
      setSelected(null)
      return
    }

    if (!isAdjacent(selected, point)) {
      setSelected(point)
      return
    }

    const swapped = swap(board, selected, point)
    const resolved = resolveMatches(swapped)
    const nextMoves = movesLeft - 1

    if (resolved.gainedScore === 0) {
      setMovesLeft(nextMoves)
      setSelected(null)
      if (nextMoves <= 0) {
        setGameOver(true)
      }
      return
    }

    setBoard(resolved.board)
    setScore((previous) => previous + resolved.gainedScore)
    setMovesLeft(nextMoves)
    setSelected(null)
    if (nextMoves <= 0) {
      setGameOver(true)
    }
  }

  useEffect(() => {
    if (!gameOver || reportGuardRef.current) return
    reportGuardRef.current = true
    recordGameResult("match3", {
      score,
      win: score >= 450,
    })
  }, [gameOver, recordGameResult, score])

  const headerText = useMemo(() => {
    if (gameOver) return "Ходы закончились. Запусти новый раунд."
    return "Выбери две соседние фишки для обмена. Матчи от 3 дают очки."
  }, [gameOver])

  return (
    <MinigameShell
      title="Три в ряд"
      subtitle="Ограничение: 25 ходов. Цель для достижения: 450 очков."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Счет</p>
            <p className="mt-0.5 text-lg font-semibold">{score}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Ходы</p>
            <p className="mt-0.5 text-lg font-semibold">{movesLeft}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-lg font-semibold">{bestScore}</p>
          </div>
        </div>

        <div className="w-fit rounded-md border border-black/12 bg-[#faf8f3] p-2">
          <div className="grid grid-cols-8 gap-1">
            {board.flatMap((rowItems, rowIndex) =>
              rowItems.map((tile, colIndex) => {
                const isActive = selected?.row === rowIndex && selected?.col === colIndex
                const styleClass = tile === null ? "bg-black/10" : TILE_STYLES[tile]
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => onTileClick(rowIndex, colIndex)}
                    className={`h-9 w-9 rounded-md border transition-transform ${
                      isActive ? "scale-105 border-black" : "border-black/10"
                    } ${styleClass}`}
                  />
                )
              }),
            )}
          </div>
        </div>

        <p className={`text-sm ${gameOver ? "text-red-700" : "text-black/70"}`}>{headerText}</p>

        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
        >
          Новая игра
        </button>
      </div>
    </MinigameShell>
  )
}
