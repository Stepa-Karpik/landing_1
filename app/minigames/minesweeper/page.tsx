"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type GameStatus = "playing" | "transition" | "lost" | "won"

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

interface LevelConfig {
  size: number
  mines: number
}

const LEVELS: readonly LevelConfig[] = [
  { size: 8, mines: 10 },
  { size: 16, mines: 38 },
  { size: 25, mines: 110 },
  { size: 50, mines: 620 },
  { size: 100, mines: 1900 },
]

function createBlankBoard(size: number) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  )
}

function isInside(size: number, row: number, col: number) {
  return row >= 0 && row < size && col >= 0 && col < size
}

function neighbors(size: number, row: number, col: number) {
  const points: Array<{ row: number; col: number }> = []
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue
      const nextRow = row + rowOffset
      const nextCol = col + colOffset
      if (isInside(size, nextRow, nextCol)) {
        points.push({ row: nextRow, col: nextCol })
      }
    }
  }
  return points
}

function buildBoard(config: LevelConfig, firstRow: number, firstCol: number, safeFirstMove: boolean) {
  const board = createBlankBoard(config.size)
  const blocked = new Set<string>()
  if (safeFirstMove) {
    blocked.add(`${firstRow}:${firstCol}`)
  }

  let placed = 0
  while (placed < config.mines) {
    const row = Math.floor(Math.random() * config.size)
    const col = Math.floor(Math.random() * config.size)
    const key = `${row}:${col}`
    if (blocked.has(key) || board[row][col].mine) continue
    board[row][col].mine = true
    placed += 1
  }

  for (let row = 0; row < config.size; row += 1) {
    for (let col = 0; col < config.size; col += 1) {
      if (board[row][col].mine) continue
      board[row][col].adjacent = neighbors(config.size, row, col).reduce(
        (acc, point) => acc + (board[point.row][point.col].mine ? 1 : 0),
        0,
      )
    }
  }

  return board
}

function revealFlood(board: Cell[][], startRow: number, startCol: number) {
  const size = board.length
  const next = board.map((row) => row.map((cell) => ({ ...cell })))
  const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const cell = next[current.row][current.col]
    if (cell.revealed || cell.flagged) continue

    cell.revealed = true
    if (cell.mine || cell.adjacent > 0) continue

    for (const point of neighbors(size, current.row, current.col)) {
      const target = next[point.row][point.col]
      if (!target.revealed && !target.flagged) {
        queue.push(point)
      }
    }
  }

  return next
}

function isLevelCleared(board: Cell[][], mines: number) {
  const revealed = board.flat().reduce((acc, cell) => acc + (cell.revealed ? 1 : 0), 0)
  const size = board.length
  return revealed >= size * size - mines
}

function countFlags(board: Cell[][]) {
  return board.flat().reduce((acc, cell) => acc + (cell.flagged ? 1 : 0), 0)
}

export default function MinesweeperPage() {
  const { data, recordGameResult } = useProfileTracker()

  const [levelIndex, setLevelIndex] = useState(0)
  const [board, setBoard] = useState<Cell[][]>(() => createBlankBoard(LEVELS[0].size))
  const [status, setStatus] = useState<GameStatus>("playing")
  const [initialized, setInitialized] = useState(false)
  const [runSeconds, setRunSeconds] = useState(0)

  const transitionTimerRef = useRef<number | null>(null)
  const firstMoveInLevelRef = useRef(true)
  const firstMoveMineRunRef = useRef(false)
  const reportedRef = useRef(false)

  const level = LEVELS[levelIndex]
  const bestLevel = Math.max(1, data.gameStats.minesweeper.bestScore)

  const resetRun = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    reportedRef.current = false
    firstMoveMineRunRef.current = false
    firstMoveInLevelRef.current = true

    setLevelIndex(0)
    setBoard(createBlankBoard(LEVELS[0].size))
    setStatus("playing")
    setInitialized(false)
    setRunSeconds(0)
  }

  const finishRun = (won: boolean, levelReached: number) => {
    if (reportedRef.current) return
    reportedRef.current = true

    recordGameResult("minesweeper", {
      score: levelReached,
      win: won,
      timeMs: won ? runSeconds * 1000 : undefined,
      firstMoveMine: firstMoveMineRunRef.current,
    })
  }

  useEffect(() => {
    if (status !== "playing") return
    const timer = window.setInterval(() => {
      setRunSeconds((previous) => previous + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const loseRun = (boardWithMines: Cell[][]) => {
    setBoard(boardWithMines)
    setStatus("lost")
    finishRun(false, levelIndex + 1)
    transitionTimerRef.current = window.setTimeout(() => {
      resetRun()
      transitionTimerRef.current = null
    }, 900)
  }

  const advanceLevel = (clearedBoard: Cell[][]) => {
    if (levelIndex === LEVELS.length - 1) {
      setBoard(clearedBoard)
      setStatus("won")
      finishRun(true, LEVELS.length)
      return
    }

    setBoard(clearedBoard)
    setStatus("transition")
    transitionTimerRef.current = window.setTimeout(() => {
      const nextLevel = levelIndex + 1
      setLevelIndex(nextLevel)
      setBoard(createBlankBoard(LEVELS[nextLevel].size))
      setInitialized(false)
      setStatus("playing")
      firstMoveInLevelRef.current = true
      transitionTimerRef.current = null
    }, 860)
  }

  const onReveal = (row: number, col: number) => {
    if (status !== "playing") return

    setBoard((previousBoard) => {
      const currentCell = previousBoard[row][col]
      if (currentCell.revealed || currentCell.flagged) return previousBoard

      let workingBoard = previousBoard
      if (!initialized) {
        workingBoard = buildBoard(level, row, col, levelIndex > 0)
        setInitialized(true)
      }

      const clickedCell = workingBoard[row][col]

      if (clickedCell.mine) {
        if (firstMoveInLevelRef.current && levelIndex === 0) {
          firstMoveMineRunRef.current = true
        }

        const revealed = workingBoard.map((line) =>
          line.map((cell) => ({
            ...cell,
            revealed: cell.revealed || cell.mine,
          })),
        )

        firstMoveInLevelRef.current = false
        window.setTimeout(() => {
          loseRun(revealed)
        }, 0)
        return revealed
      }

      const revealed = revealFlood(workingBoard, row, col)
      firstMoveInLevelRef.current = false

      if (isLevelCleared(revealed, level.mines)) {
        window.setTimeout(() => {
          advanceLevel(revealed)
        }, 0)
      }

      return revealed
    })
  }

  const onToggleFlag = (event: MouseEvent<HTMLButtonElement>, row: number, col: number) => {
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

  const flagsLeft = Math.max(0, level.mines - countFlags(board))

  const boardStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${level.size}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${level.size}, minmax(0, 1fr))`,
    }),
    [level.size],
  )

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1620px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Level</p>
            <p className="mt-1 text-xl font-semibold">{levelIndex + 1}/5</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Grid</p>
            <p className="mt-1 text-xl font-semibold">{level.size}x{level.size}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Flags</p>
            <p className="mt-1 text-xl font-semibold">{flagsLeft}</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Time</p>
            <p className="mt-1 text-xl font-semibold">{runSeconds}s</p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best Lv</p>
            <p className="mt-1 text-xl font-semibold">{bestLevel}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="h-[min(78vh,82vw)] w-[min(78vh,82vw)] rounded-xl border border-black/14 bg-[#ebe4d8] p-1.5">
            <div className="grid h-full w-full gap-[1px] rounded-[8px] bg-black/10 p-[1px]" style={boardStyle}>
              {board.flatMap((rowCells, rowIndex) =>
                rowCells.map((cell, colIndex) => {
                  const cellStateClass = cell.revealed
                    ? "border-black/8 bg-[linear-gradient(180deg,#f4efe6_0%,#e9e1d4_100%)]"
                    : "border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#f3ecdf_100%)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#efe6d7_100%)]"

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      onClick={() => onReveal(rowIndex, colIndex)}
                      onContextMenu={(event) => onToggleFlag(event, rowIndex, colIndex)}
                      className={`relative flex items-center justify-center overflow-hidden border text-[clamp(8px,0.7vw,14px)] font-semibold ${cellStateClass}`}
                    >
                      {cell.flagged && !cell.revealed && (
                        <img src="/games/miner/flag.png" alt="" draggable={false} className="h-[72%] w-[72%] object-contain" />
                      )}
                      {cell.revealed && cell.mine && (
                        <img src="/games/miner/mine.png" alt="" draggable={false} className="h-[72%] w-[72%] object-contain" />
                      )}
                      {cell.revealed && !cell.mine && cell.adjacent > 0 && (
                        <span className="leading-none text-black/80">{cell.adjacent}</span>
                      )}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => resetRun()}
            className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            Restart Run
          </button>
          <button
            type="button"
            onClick={() => setStatus((previous) => (previous === "playing" ? "transition" : "playing"))}
            className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
          >
            {status === "playing" ? "Pause" : "Resume"}
          </button>
          <div
            className={`rounded-lg border px-3 py-2 text-center text-xs tracking-[0.11em] uppercase ${
              status === "lost"
                ? "border-red-300 bg-red-50 text-red-800"
                : status === "won"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-black/12 bg-white/70 text-black/72"
            }`}
          >
            {status === "lost" ? "Boom" : status === "won" ? "Completed" : status === "transition" ? "Loading" : "Playing"}
          </div>
        </div>
      </section>
    </main>
  )
}
