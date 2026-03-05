"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type GameStatus = "playing" | "won" | "lost"

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

const BOARD_SIZE = 9
const MINES_COUNT = 10

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  )
}

function inBounds(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function neighbors(row: number, col: number) {
  const entries: Array<{ row: number; col: number }> = []
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue
      const nextRow = row + rowOffset
      const nextCol = col + colOffset
      if (inBounds(nextRow, nextCol)) {
        entries.push({ row: nextRow, col: nextCol })
      }
    }
  }
  return entries
}

function createBoard() {
  const board = createEmptyBoard()
  let placed = 0
  while (placed < MINES_COUNT) {
    const row = Math.floor(Math.random() * BOARD_SIZE)
    const col = Math.floor(Math.random() * BOARD_SIZE)
    if (board[row][col].mine) continue
    board[row][col].mine = true
    placed += 1
  }

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col].mine) continue
      board[row][col].adjacent = neighbors(row, col).reduce(
        (acc, point) => acc + (board[point.row][point.col].mine ? 1 : 0),
        0,
      )
    }
  }
  return board
}

function revealFlood(board: Cell[][], startRow: number, startCol: number) {
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const cell = next[current.row][current.col]
    if (cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.adjacent !== 0 || cell.mine) continue
    for (const point of neighbors(current.row, current.col)) {
      const neighborCell = next[point.row][point.col]
      if (!neighborCell.revealed && !neighborCell.flagged) {
        queue.push(point)
      }
    }
  }

  return next
}

function countRevealed(board: Cell[][]) {
  return board.flat().reduce((acc, cell) => acc + (cell.revealed ? 1 : 0), 0)
}

function hasWon(board: Cell[][]) {
  const safeCells = BOARD_SIZE * BOARD_SIZE - MINES_COUNT
  return countRevealed(board) >= safeCells
}

function formatMs(value: number | null) {
  if (value === null) return "-"
  return `${(value / 1000).toFixed(1)}с`
}

export default function MinesweeperPage() {
  const { data, recordGameResult } = useProfileTracker()

  const [board, setBoard] = useState<Cell[][]>(() => createBoard())
  const [status, setStatus] = useState<GameStatus>("playing")
  const [seconds, setSeconds] = useState(0)
  const reportGuardRef = useRef(false)

  useEffect(() => {
    if (status !== "playing") return
    const timer = window.setInterval(() => {
      setSeconds((previous) => previous + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (status === "playing" || reportGuardRef.current) return
    reportGuardRef.current = true

    const revealed = countRevealed(board)
    recordGameResult("minesweeper", {
      score: revealed,
      win: status === "won",
      timeMs: status === "won" ? seconds * 1000 : undefined,
    })
  }, [board, recordGameResult, seconds, status])

  const reset = () => {
    reportGuardRef.current = false
    setBoard(createBoard())
    setStatus("playing")
    setSeconds(0)
  }

  const onCellClick = (row: number, col: number) => {
    if (status !== "playing") return
    const selected = board[row][col]
    if (selected.revealed || selected.flagged) return

    if (selected.mine) {
      const revealedAll = board.map((line) =>
        line.map((cell) => ({
          ...cell,
          revealed: cell.revealed || cell.mine,
        })),
      )
      setBoard(revealedAll)
      setStatus("lost")
      return
    }

    const revealedBoard = revealFlood(board, row, col)
    setBoard(revealedBoard)
    if (hasWon(revealedBoard)) {
      setStatus("won")
    }
  }

  const onCellRightClick = (event: MouseEvent<HTMLButtonElement>, row: number, col: number) => {
    event.preventDefault()
    if (status !== "playing") return
    setBoard((previous) =>
      previous.map((line, rowIndex) =>
        line.map((cell, colIndex) => {
          if (rowIndex !== row || colIndex !== col) return cell
          if (cell.revealed) return cell
          return { ...cell, flagged: !cell.flagged }
        }),
      ),
    )
  }

  const flagsLeft = useMemo(() => {
    const usedFlags = board.flat().reduce((acc, cell) => acc + (cell.flagged ? 1 : 0), 0)
    return MINES_COUNT - usedFlags
  }, [board])

  const bestTime = data.gameStats.minesweeper.bestTimeMs
  const wins = data.gameStats.minesweeper.wins

  return (
    <MinigameShell
      title="Сапер"
      subtitle="ЛКМ открыть клетку, ПКМ поставить флаг. Цель для достижения: хотя бы одна победа."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-center text-[11px] tracking-[0.12em] uppercase md:grid-cols-4">
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Время</p>
            <p className="mt-0.5 text-lg font-semibold">{seconds}с</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Флаги</p>
            <p className="mt-0.5 text-lg font-semibold">{flagsLeft}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Победы</p>
            <p className="mt-0.5 text-lg font-semibold">{wins}</p>
          </div>
          <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
            <p className="text-black/55">Лучшее время</p>
            <p className="mt-0.5 text-lg font-semibold">{formatMs(bestTime)}</p>
          </div>
        </div>

        <div className="w-fit rounded-md border border-black/12 bg-[#faf8f3] p-2">
          <div className="grid grid-cols-9 gap-1">
            {board.flatMap((rowCells, rowIndex) =>
              rowCells.map((cell, colIndex) => {
                let label = ""
                if (cell.revealed && cell.mine) label = "X"
                else if (cell.revealed && cell.adjacent > 0) label = String(cell.adjacent)
                else if (cell.flagged) label = "F"

                const baseClass = cell.revealed
                  ? "bg-[#ece8de] border-black/20"
                  : "bg-white border-black/16 hover:bg-[#f0ece2]"

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => onCellClick(rowIndex, colIndex)}
                    onContextMenu={(event) => onCellRightClick(event, rowIndex, colIndex)}
                    className={`h-8 w-8 rounded-sm border text-xs font-semibold ${baseClass}`}
                  >
                    {label}
                  </button>
                )
              }),
            )}
          </div>
        </div>

        {status !== "playing" && (
          <p className={`text-sm ${status === "won" ? "text-emerald-700" : "text-red-700"}`}>
            {status === "won" ? "Победа! Поле очищено." : "Подрыв. Игра окончена."}
          </p>
        )}

        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
        >
          Новая партия
        </button>
      </div>
    </MinigameShell>
  )
}
