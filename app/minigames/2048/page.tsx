"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type Board = number[][]

const SIZE = 4

function createEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0))
}

function clone(board: Board): Board {
  return board.map((row) => [...row])
}

function getEmptyCells(board: Board) {
  const cells: Array<{ row: number; col: number }> = []
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === 0) cells.push({ row, col })
    }
  }
  return cells
}

function addRandomTile(board: Board): Board {
  const next = clone(board)
  const empty = getEmptyCells(next)
  if (empty.length === 0) return next
  const spot = empty[Math.floor(Math.random() * empty.length)]
  next[spot.row][spot.col] = Math.random() < 0.9 ? 2 : 4
  return next
}

function maxTile(board: Board) {
  return board.flat().reduce((acc, value) => Math.max(acc, value), 0)
}

function hasMoves(board: Board) {
  if (getEmptyCells(board).length > 0) return true
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = board[row][col]
      if (row + 1 < SIZE && board[row + 1][col] === value) return true
      if (col + 1 < SIZE && board[row][col + 1] === value) return true
    }
  }
  return false
}

function compressLine(line: number[]) {
  const values = line.filter((value) => value !== 0)
  const output: number[] = []
  let points = 0
  for (let index = 0; index < values.length; index += 1) {
    const current = values[index]
    const next = values[index + 1]
    if (next !== undefined && current === next) {
      const merged = current * 2
      output.push(merged)
      points += merged
      index += 1
    } else {
      output.push(current)
    }
  }
  while (output.length < SIZE) output.push(0)
  const changed = output.some((value, index) => value !== line[index])
  return { line: output, points, changed }
}

function moveLeft(board: Board) {
  const next = createEmptyBoard()
  let points = 0
  let changed = false
  for (let row = 0; row < SIZE; row += 1) {
    const result = compressLine(board[row])
    next[row] = result.line
    points += result.points
    changed = changed || result.changed
  }
  return { board: next, points, changed }
}

function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse())
}

function transpose(board: Board): Board {
  return board[0].map((_, col) => board.map((row) => row[col]))
}

function move(board: Board, direction: "left" | "right" | "up" | "down") {
  if (direction === "left") return moveLeft(board)
  if (direction === "right") {
    const reversed = reverseRows(board)
    const moved = moveLeft(reversed)
    return { ...moved, board: reverseRows(moved.board) }
  }
  if (direction === "up") {
    const transposed = transpose(board)
    const moved = moveLeft(transposed)
    return { ...moved, board: transpose(moved.board) }
  }
  const transposed = transpose(board)
  const reversed = reverseRows(transposed)
  const moved = moveLeft(reversed)
  return { ...moved, board: transpose(reverseRows(moved.board)) }
}

function getTileColor(value: number) {
  const palette: Record<number, string> = {
    0: "bg-[#f0ece2] text-black/30",
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
  }
  return palette[value] ?? "bg-black text-white"
}

function initialBoard() {
  return addRandomTile(addRandomTile(createEmptyBoard()))
}

export default function Game2048Page() {
  const { data, recordGameResult } = useProfileTracker()
  const [board, setBoard] = useState<Board>(() => initialBoard())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const reportedRef = useRef(false)
  const movedRef = useRef(false)

  const bestTile = data.gameStats.game2048.bestScore
  const currentTile = useMemo(() => maxTile(board), [board])

  const commitRound = useCallback(
    (finalBoard: Board) => {
      if (reportedRef.current) return
      reportedRef.current = true
      const tile = maxTile(finalBoard)
      recordGameResult("game2048", {
        score: tile,
        win: tile >= 2048,
      })
    },
    [recordGameResult],
  )

  const restart = () => {
    if (!reportedRef.current && movedRef.current) {
      commitRound(board)
    }
    reportedRef.current = false
    movedRef.current = false
    setBoard(initialBoard())
    setScore(0)
    setGameOver(false)
    setWon(false)
  }

  const performMove = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameOver || won) return
      setBoard((previousBoard) => {
        const result = move(previousBoard, direction)
        if (!result.changed) return previousBoard

        movedRef.current = true
        const spawned = addRandomTile(result.board)
        setScore((previous) => previous + result.points)
        const tile = maxTile(spawned)
        if (tile >= 2048) {
          setWon(true)
          commitRound(spawned)
        } else if (!hasMoves(spawned)) {
          setGameOver(true)
          commitRound(spawned)
        }
        return spawned
      })
    },
    [commitRound, gameOver, won],
  )

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

  return (
    <MinigameShell title="2048" subtitle="Поле 4×4. Цель достижения: собрать плитку 2048.">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Очки</p>
            <p className="mt-0.5 text-lg font-semibold">{score}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Текущая плитка</p>
            <p className="mt-0.5 text-lg font-semibold">{currentTile}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Рекорд</p>
            <p className="mt-0.5 text-lg font-semibold">{bestTile}</p>
          </div>
        </div>

        <div className="w-fit rounded-md border border-black/12 bg-[#bbada0] p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {board.flatMap((row, rowIndex) =>
              row.map((value, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => {
                    // Do nothing on tile click.
                  }}
                  className={`h-14 w-14 rounded-md text-lg font-semibold ${getTileColor(value)}`}
                >
                  {value === 0 ? "" : value}
                </button>
              )),
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => performMove("left")} className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs uppercase">
            ←
          </button>
          <button type="button" onClick={() => performMove("up")} className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs uppercase">
            ↑
          </button>
          <button type="button" onClick={() => performMove("down")} className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs uppercase">
            ↓
          </button>
          <button type="button" onClick={() => performMove("right")} className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs uppercase">
            →
          </button>
          <button
            type="button"
            onClick={() => restart()}
            className="rounded-md border border-black/20 bg-black px-4 py-1.5 text-xs tracking-[0.12em] text-white uppercase"
          >
            Новая игра
          </button>
        </div>

        {won && <p className="text-sm text-emerald-700">Плитка 2048 собрана.</p>}
        {gameOver && <p className="text-sm text-red-700">Ходов больше нет.</p>}
      </div>
    </MinigameShell>
  )
}
