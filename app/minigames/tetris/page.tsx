"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useProfileTracker } from "@/components/profile-provider"

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L"

interface ActivePiece {
  type: PieceType
  matrix: number[][]
  row: number
  col: number
}

interface TetrisState {
  board: number[][]
  active: ActivePiece
  queue: PieceType[]
  hold: PieceType | null
  canHold: boolean
  score: number
  lines: number
  level: number
  combo: number
  b2b: boolean
  gameOver: boolean
  paused: boolean
}

const ROWS = 20
const COLS = 10
const PREVIEW_COUNT = 5

const PIECE_ORDER: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"]

const PIECES: Record<PieceType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
}

const PIECE_COLOR: Record<PieceType, string> = {
  I: "bg-cyan-400",
  O: "bg-yellow-300",
  T: "bg-violet-400",
  S: "bg-emerald-400",
  Z: "bg-rose-400",
  J: "bg-blue-500",
  L: "bg-orange-400",
}

const LINE_BASE_SCORES = [0, 100, 300, 500, 800]

function createBoard() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0))
}

function cloneMatrix(matrix: number[][]) {
  return matrix.map((row) => [...row])
}

function shuffleBag() {
  const next = [...PIECE_ORDER]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = temp
  }
  return next
}

function ensureQueue(queue: PieceType[]) {
  const next = [...queue]
  while (next.length < PREVIEW_COUNT + 1) {
    next.push(...shuffleBag())
  }
  return next
}

function consumeQueue(queue: PieceType[]) {
  const refilled = ensureQueue(queue)
  const [type, ...rest] = refilled
  return { type, queue: rest }
}

function spawnPiece(type: PieceType): ActivePiece {
  const matrix = cloneMatrix(PIECES[type])
  const col = Math.floor((COLS - matrix[0].length) / 2)
  return {
    type,
    matrix,
    row: -1,
    col,
  }
}

function rotateRight(matrix: number[][]) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]).reverse())
}

function canPlace(board: number[][], piece: ActivePiece) {
  for (let row = 0; row < piece.matrix.length; row += 1) {
    for (let col = 0; col < piece.matrix[row].length; col += 1) {
      if (piece.matrix[row][col] === 0) continue
      const targetRow = piece.row + row
      const targetCol = piece.col + col
      if (targetCol < 0 || targetCol >= COLS || targetRow >= ROWS) return false
      if (targetRow >= 0 && board[targetRow][targetCol] !== 0) return false
    }
  }
  return true
}

function mergePiece(board: number[][], piece: ActivePiece) {
  const next = board.map((row) => [...row])
  const value = PIECE_ORDER.indexOf(piece.type) + 1

  for (let row = 0; row < piece.matrix.length; row += 1) {
    for (let col = 0; col < piece.matrix[row].length; col += 1) {
      if (piece.matrix[row][col] === 0) continue
      const targetRow = piece.row + row
      const targetCol = piece.col + col
      if (targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
        next[targetRow][targetCol] = value
      }
    }
  }

  return next
}

function clearLines(board: number[][]) {
  const leftRows = board.filter((row) => row.some((cell) => cell === 0))
  const cleared = ROWS - leftRows.length
  const topPadding = Array.from({ length: cleared }, () => Array.from({ length: COLS }, () => 0))
  const nextBoard = [...topPadding, ...leftRows]
  const perfectClear = nextBoard.flat().every((cell) => cell === 0)
  return { board: nextBoard, cleared, perfectClear }
}

function getDropRow(board: number[][], piece: ActivePiece) {
  let row = piece.row
  while (canPlace(board, { ...piece, row: row + 1 })) {
    row += 1
  }
  return row
}

function createInitialState(): TetrisState {
  const first = consumeQueue([])
  return {
    board: createBoard(),
    active: spawnPiece(first.type),
    queue: first.queue,
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    b2b: false,
    gameOver: false,
    paused: false,
  }
}

function lockPiece(state: TetrisState, dropBonus: number) {
  const merged = mergePiece(state.board, state.active)
  const { board: clearedBoard, cleared, perfectClear } = clearLines(merged)

  const nextCombo = cleared > 0 ? state.combo + 1 : -1
  const lineScore = LINE_BASE_SCORES[cleared] * state.level
  const b2bBonus = cleared === 4 && state.b2b ? Math.floor(lineScore * 0.5) : 0
  const comboBonus = cleared > 0 ? Math.max(0, nextCombo) * 50 * state.level : 0
  const perfectClearBonus = perfectClear && cleared > 0 ? 1000 * state.level : 0
  const gained = lineScore + b2bBonus + comboBonus + perfectClearBonus + dropBonus

  const nextLines = state.lines + cleared
  const nextLevel = 1 + Math.floor(nextLines / 10)

  const consumed = consumeQueue(state.queue)
  const nextActive = spawnPiece(consumed.type)
  const nextGameOver = !canPlace(clearedBoard, nextActive)

  return {
    ...state,
    board: clearedBoard,
    active: nextActive,
    queue: consumed.queue,
    canHold: true,
    score: state.score + gained,
    lines: nextLines,
    level: nextLevel,
    combo: nextCombo,
    b2b: cleared === 4 ? true : cleared > 0 ? false : state.b2b,
    gameOver: nextGameOver,
  }
}

export default function TetrisPage() {
  const { data, recordGameResult } = useProfileTracker()
  const [game, setGame] = useState<TetrisState>(() => createInitialState())
  const reportedRef = useRef(false)

  const restart = useCallback(() => {
    reportedRef.current = false
    setGame(createInitialState())
  }, [])

  const moveSide = useCallback((direction: -1 | 1) => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused) return previous
      const moved = { ...previous.active, col: previous.active.col + direction }
      if (!canPlace(previous.board, moved)) return previous
      return { ...previous, active: moved }
    })
  }, [])

  const rotate = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused) return previous
      const rotated = rotateRight(previous.active.matrix)
      const base = { ...previous.active, matrix: rotated }
      const kicks = [0, -1, 1, -2, 2]

      for (const offset of kicks) {
        const candidate = { ...base, col: base.col + offset }
        if (canPlace(previous.board, candidate)) {
          return { ...previous, active: candidate }
        }
      }

      return previous
    })
  }, [])

  const softDrop = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused) return previous
      const moved = { ...previous.active, row: previous.active.row + 1 }
      if (canPlace(previous.board, moved)) {
        return {
          ...previous,
          active: moved,
          score: previous.score + 1,
        }
      }
      return lockPiece(previous, 0)
    })
  }, [])

  const hardDrop = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused) return previous
      const dropRow = getDropRow(previous.board, previous.active)
      const distance = Math.max(0, dropRow - previous.active.row)
      const landed = { ...previous.active, row: dropRow }
      return lockPiece({ ...previous, active: landed }, distance * 2)
    })
  }, [])

  const hold = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused || !previous.canHold) return previous

      const activeType = previous.active.type
      if (previous.hold === null) {
        const consumed = consumeQueue(previous.queue)
        const nextActive = spawnPiece(consumed.type)
        if (!canPlace(previous.board, nextActive)) {
          return {
            ...previous,
            gameOver: true,
          }
        }
        return {
          ...previous,
          active: nextActive,
          hold: activeType,
          queue: consumed.queue,
          canHold: false,
        }
      }

      const swappedActive = spawnPiece(previous.hold)
      if (!canPlace(previous.board, swappedActive)) {
        return {
          ...previous,
          gameOver: true,
        }
      }

      return {
        ...previous,
        active: swappedActive,
        hold: activeType,
        canHold: false,
      }
    })
  }, [])

  const tickDown = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver || previous.paused) return previous
      const moved = { ...previous.active, row: previous.active.row + 1 }
      if (canPlace(previous.board, moved)) {
        return { ...previous, active: moved }
      }
      return lockPiece(previous, 0)
    })
  }, [])

  useEffect(() => {
    if (game.gameOver || game.paused) return
    const tickMs = Math.max(80, 760 - (game.level - 1) * 55)
    const timer = window.setInterval(() => {
      tickDown()
    }, tickMs)
    return () => window.clearInterval(timer)
  }, [game.gameOver, game.level, game.paused, tickDown])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveSide(-1)
        return
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        moveSide(1)
        return
      }
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "x") {
        event.preventDefault()
        rotate()
        return
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        softDrop()
        return
      }
      if (event.key === " ") {
        event.preventDefault()
        if (game.gameOver) {
          restart()
          return
        }
        hardDrop()
        return
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault()
        hold()
        return
      }
      if (event.key.toLowerCase() === "p") {
        event.preventDefault()
        setGame((previous) => ({ ...previous, paused: !previous.paused }))
        return
      }
      if (event.key === "Enter") {
        event.preventDefault()
        if (game.gameOver) {
          restart()
          return
        }
        hold()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [game.gameOver, hardDrop, hold, moveSide, restart, rotate, softDrop])

  useEffect(() => {
    if (!game.gameOver || reportedRef.current) return
    reportedRef.current = true
    recordGameResult("tetris", {
      score: game.score,
      win: game.score >= 2500,
    })
  }, [game.gameOver, game.score, recordGameResult])

  const bestScore = data.gameStats.tetris.bestScore

  const renderedBoard = useMemo(() => {
    const activeMap = new Map<string, PieceType>()
    const ghostSet = new Set<string>()

    const ghostRow = getDropRow(game.board, game.active)
    for (let row = 0; row < game.active.matrix.length; row += 1) {
      for (let col = 0; col < game.active.matrix[row].length; col += 1) {
        if (game.active.matrix[row][col] === 0) continue

        const activeRow = game.active.row + row
        const activeCol = game.active.col + col
        if (activeRow >= 0 && activeRow < ROWS && activeCol >= 0 && activeCol < COLS) {
          activeMap.set(`${activeRow}:${activeCol}`, game.active.type)
        }

        const ghostCellRow = ghostRow + row
        const ghostCellCol = game.active.col + col
        if (
          ghostCellRow >= 0 &&
          ghostCellRow < ROWS &&
          ghostCellCol >= 0 &&
          ghostCellCol < COLS &&
          game.board[ghostCellRow][ghostCellCol] === 0
        ) {
          ghostSet.add(`${ghostCellRow}:${ghostCellCol}`)
        }
      }
    }

    return { activeMap, ghostSet }
  }, [game.active, game.board])

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full w-full max-w-[1620px] flex-col gap-3 lg:flex-row">
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f7f2ea_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
          <div className="h-full max-h-[86vh] w-auto aspect-[1/2] rounded-xl border border-black/20 bg-[#1d1f28] p-1.5">
            <div className="grid h-full w-full grid-cols-10 grid-rows-20 gap-[2px] rounded-[10px] bg-black/30 p-[2px]">
              {Array.from({ length: ROWS * COLS }).map((_, index) => {
                const row = Math.floor(index / COLS)
                const col = index % COLS
                const key = `${row}:${col}`

                const activeType = renderedBoard.activeMap.get(key)
                if (activeType) {
                  return <div key={key} className={`rounded-[2px] border border-black/14 ${PIECE_COLOR[activeType]}`} />
                }

                if (renderedBoard.ghostSet.has(key)) {
                  return <div key={key} className="rounded-[2px] border border-white/20 bg-white/10" />
                }

                const value = game.board[row][col]
                if (value > 0) {
                  const type = PIECE_ORDER[value - 1]
                  return <div key={key} className={`rounded-[2px] border border-black/14 ${PIECE_COLOR[type]}`} />
                }

                return <div key={key} className="rounded-[2px] border border-white/[0.04] bg-black/22" />
              })}
            </div>
          </div>
        </div>

        <aside className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-[360px] lg:grid-cols-1 lg:gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Score</p>
              <p className="mt-1 text-xl font-semibold">{game.score}</p>
            </div>
            <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Lines</p>
              <p className="mt-1 text-xl font-semibold">{game.lines}</p>
            </div>
            <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Level</p>
              <p className="mt-1 text-xl font-semibold">{game.level}</p>
            </div>
            <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
              <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Best</p>
              <p className="mt-1 text-xl font-semibold">{bestScore}</p>
            </div>
          </div>

          <div className="rounded-xl border border-black/12 bg-white/74 p-2.5">
            <p className="text-center text-[10px] tracking-[0.14em] text-black/56 uppercase">Next</p>
            <div className="mt-2 space-y-1.5">
              {game.queue.slice(0, PREVIEW_COUNT).map((type, index) => {
                const matrix = PIECES[type]
                return (
                  <div key={`${type}-${index}`} className="rounded-lg border border-black/10 bg-[#f8f5ed] p-1.5">
                    <div className="flex justify-center">
                      <div className="inline-grid grid-cols-4 grid-rows-4 gap-[2px]">
                        {Array.from({ length: 16 }).map((_, cellIndex) => {
                          const row = Math.floor(cellIndex / 4)
                          const col = cellIndex % 4
                          const hasBlock = matrix[row]?.[col] === 1
                          return (
                            <div
                              key={`${type}-${index}-${cellIndex}`}
                              className={`h-3.5 w-3.5 rounded-[2px] border ${
                                hasBlock ? `${PIECE_COLOR[type]} border-black/16` : "border-black/[0.04] bg-black/6"
                              }`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-black/12 bg-white/74 p-2.5">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Hold</p>
            <div className="mt-2 rounded-lg border border-black/10 bg-[#f8f5ed] p-1.5">
              <div className="flex justify-center">
                <div className="inline-grid grid-cols-4 grid-rows-4 gap-[2px]">
                  {Array.from({ length: 16 }).map((_, cellIndex) => {
                    const row = Math.floor(cellIndex / 4)
                    const col = cellIndex % 4
                    const matrix = game.hold ? PIECES[game.hold] : null
                    const hasBlock = matrix ? matrix[row]?.[col] === 1 : false
                    return (
                      <div
                        key={`hold-${cellIndex}`}
                        className={`h-3.5 w-3.5 rounded-[2px] border ${
                          hasBlock && game.hold
                            ? `${PIECE_COLOR[game.hold]} border-black/16`
                            : "border-black/[0.04] bg-black/6"
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              type="button"
              onClick={() => moveSide(-1)}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => moveSide(1)}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              Right
            </button>
            <button
              type="button"
              onClick={() => rotate()}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              Rotate
            </button>
            <button
              type="button"
              onClick={() => softDrop()}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              Down
            </button>
            <button
              type="button"
              onClick={() => hardDrop()}
              className="rounded-lg border border-black/16 bg-black px-3 py-2 text-xs tracking-[0.11em] text-white uppercase"
            >
              Hard
            </button>
            <button
              type="button"
              onClick={() => hold()}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              Hold
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setGame((previous) => ({ ...previous, paused: !previous.paused }))}
              className="rounded-lg border border-black/16 bg-white/76 px-3 py-2 text-xs tracking-[0.11em] uppercase"
            >
              {game.paused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => restart()}
              className="rounded-lg border border-black/16 bg-black px-3 py-2 text-xs tracking-[0.11em] text-white uppercase"
            >
              Restart
            </button>
          </div>

          {game.gameOver && (
            <div className="rounded-xl border border-red-300/70 bg-red-50/90 px-3 py-2 text-center text-xs tracking-[0.09em] text-red-800 uppercase">
              Game Over
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}
