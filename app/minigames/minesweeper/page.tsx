"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { useProfileTracker } from "@/components/profile-provider"
import {
  clampBoardPanToViewport,
  DRAG_THRESHOLD_PX,
  getCellFontSize,
  getCellIconSize,
  getScaledCellSize,
  getVisibleCellBounds,
  normalizeUnlockedLevel,
  shouldStartBoardDrag,
  updateUnlockedLevel,
} from "./board-logic"

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

interface BoardPan {
  x: number
  y: number
}

interface DragPanState {
  active: boolean
  moved: boolean
  captured: boolean
  pointerId: number | null
  startX: number
  startY: number
  startPan: BoardPan
}

const LEVELS: readonly LevelConfig[] = [
  { size: 8, mines: 10 },
  { size: 16, mines: 38 },
  { size: 25, mines: 110 },
  { size: 50, mines: 620 },
  { size: 100, mines: 1900 },
]

const MIN_BOARD_SCALE = 1
const MAX_BOARD_SCALE = 3
const BOARD_ZOOM_SPEED = 0.0012
const CLICK_SUPPRESSION_MS = 140
const MINESWEEPER_UNLOCK_KEY = "nerior-minesweeper-unlocked-level"
const ADJACENT_NUMBER_TONES = [
  "",
  "text-[#2f6df6]",
  "text-[#27814c]",
  "text-[#d1492f]",
  "text-[#3d4fb8]",
  "text-[#8a3e83]",
  "text-[#17828b]",
  "text-[#55504a]",
  "text-[#1d1b18]",
] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

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

function createDragPanState(): DragPanState {
  return {
    active: false,
    moved: false,
    captured: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startPan: { x: 0, y: 0 },
  }
}

export default function MinesweeperPage() {
  const { recordGameResult } = useProfileTracker()

  const [levelIndex, setLevelIndex] = useState(0)
  const [selectedStartLevel, setSelectedStartLevel] = useState(0)
  const [board, setBoard] = useState<Cell[][]>(() => createBlankBoard(LEVELS[0].size))
  const [status, setStatus] = useState<GameStatus>("playing")
  const [initialized, setInitialized] = useState(false)
  const [runSeconds, setRunSeconds] = useState(0)
  const [boardScale, setBoardScale] = useState(MIN_BOARD_SCALE)
  const [boardPan, setBoardPan] = useState<BoardPan>({ x: 0, y: 0 })
  const [unlockedLevel, setUnlockedLevel] = useState(1)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  const transitionTimerRef = useRef<number | null>(null)
  const boardViewportRef = useRef<HTMLDivElement | null>(null)
  const dragPanRef = useRef<DragPanState>(createDragPanState())
  const suppressClickUntilRef = useRef(0)
  const firstMoveInLevelRef = useRef(true)
  const firstMoveMineRunRef = useRef(false)
  const reportedRef = useRef(false)

  const level = LEVELS[levelIndex]
  const bestLevel = unlockedLevel
  const highestUnlockedLevel = unlockedLevel
  const shortestViewportPx = viewportSize.width > 0 && viewportSize.height > 0 ? Math.min(viewportSize.width, viewportSize.height) : 720
  const cellSize = useMemo(() => getScaledCellSize(level.size, shortestViewportPx, boardScale), [level.size, shortestViewportPx, boardScale])
  const cellFontSize = useMemo(() => getCellFontSize(cellSize), [cellSize])
  const cellIconSize = useMemo(() => getCellIconSize(cellSize), [cellSize])
  const boardWidth = level.size * cellSize
  const boardHeight = level.size * cellSize
  const isDenseBoard = cellSize <= 14 || level.size >= 50

  const getClampedPan = (nextPan: BoardPan) => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) {
      return nextPan
    }

    return clampBoardPanToViewport(nextPan.x, nextPan.y, boardWidth, boardHeight, viewportSize.width, viewportSize.height)
  }

  const visibleBounds = useMemo(
    () =>
      getVisibleCellBounds(
        level.size,
        cellSize,
        Math.max(viewportSize.width, 1),
        Math.max(viewportSize.height, 1),
        boardPan.x,
        boardPan.y,
      ),
    [boardPan.x, boardPan.y, cellSize, level.size, viewportSize.height, viewportSize.width],
  )

  const visibleCells = useMemo(() => {
    const next: Array<{ rowIndex: number; colIndex: number; cell: Cell }> = []

    for (let rowIndex = visibleBounds.startRow; rowIndex <= visibleBounds.endRow; rowIndex += 1) {
      for (let colIndex = visibleBounds.startCol; colIndex <= visibleBounds.endCol; colIndex += 1) {
        next.push({
          rowIndex,
          colIndex,
          cell: board[rowIndex][colIndex],
        })
      }
    }

    return next
  }, [board, visibleBounds.endCol, visibleBounds.endRow, visibleBounds.startCol, visibleBounds.startRow])

  const resetBoardViewport = () => {
    dragPanRef.current = createDragPanState()
    suppressClickUntilRef.current = 0
    setBoardScale(MIN_BOARD_SCALE)
    setBoardPan({ x: 0, y: 0 })
  }

  const startRunAtLevel = (startLevel: number) => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    const nextLevel = clamp(startLevel, 0, LEVELS.length - 1)

    reportedRef.current = false
    firstMoveMineRunRef.current = false
    firstMoveInLevelRef.current = true

    setSelectedStartLevel(nextLevel)
    setLevelIndex(nextLevel)
    setBoard(createBlankBoard(LEVELS[nextLevel].size))
    setStatus("playing")
    setInitialized(false)
    setRunSeconds(0)
    resetBoardViewport()
  }

  const resetRun = () => {
    startRunAtLevel(selectedStartLevel)
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
    const savedValue = window.localStorage.getItem(MINESWEEPER_UNLOCK_KEY)
    setUnlockedLevel(normalizeUnlockedLevel(savedValue))
  }, [])

  useEffect(() => {
    window.localStorage.setItem(MINESWEEPER_UNLOCK_KEY, String(unlockedLevel))
  }, [unlockedLevel])

  useEffect(() => {
    setSelectedStartLevel((previous) => Math.min(previous, highestUnlockedLevel - 1))
  }, [highestUnlockedLevel])

  useEffect(() => {
    const viewport = boardViewportRef.current
    if (!viewport) return

    const syncViewportSize = () => {
      setViewportSize({
        width: viewport.clientWidth,
        height: viewport.clientHeight,
      })
    }

    syncViewportSize()

    const observer = new ResizeObserver(syncViewportSize)
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [])

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

  useEffect(() => {
    setBoardPan((previous) => {
      const nextPan = getClampedPan(previous)
      return nextPan.x === previous.x && nextPan.y === previous.y ? previous : nextPan
    })
  }, [boardHeight, boardWidth, viewportSize.height, viewportSize.width])

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
      setUnlockedLevel((previous) => updateUnlockedLevel(previous, LEVELS.length))
      finishRun(true, LEVELS.length)
      return
    }

    setBoard(clearedBoard)
    setStatus("transition")
    transitionTimerRef.current = window.setTimeout(() => {
      const nextLevel = levelIndex + 1
      setUnlockedLevel((previous) => updateUnlockedLevel(previous, nextLevel + 1))
      setLevelIndex(nextLevel)
      setBoard(createBlankBoard(LEVELS[nextLevel].size))
      setInitialized(false)
      setStatus("playing")
      firstMoveInLevelRef.current = true
      resetBoardViewport()
      transitionTimerRef.current = null
    }, 860)
  }

  const onReveal = (row: number, col: number) => {
    if (status !== "playing") return
    if (performance.now() < suppressClickUntilRef.current) return

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

  const onBoardWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    setBoardScale((previous) => {
      const nextScale = clamp(previous - event.deltaY * BOARD_ZOOM_SPEED, MIN_BOARD_SCALE, MAX_BOARD_SCALE)
      if (nextScale !== previous) {
        const nextCellSize = getScaledCellSize(level.size, shortestViewportPx, nextScale)
        const nextBoardWidth = level.size * nextCellSize
        const nextBoardHeight = level.size * nextCellSize

        setBoardPan((currentPan) => {
          if (viewportSize.width <= 0 || viewportSize.height <= 0) {
            return currentPan
          }

          const nextPan = clampBoardPanToViewport(
            currentPan.x,
            currentPan.y,
            nextBoardWidth,
            nextBoardHeight,
            viewportSize.width,
            viewportSize.height,
          )

          return nextPan.x === currentPan.x && nextPan.y === currentPan.y ? currentPan : nextPan
        })
      }
      return nextScale
    })
  }

  const onBoardPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return

    dragPanRef.current = {
      active: true,
      moved: false,
      captured: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: boardPan,
    }
  }

  const onBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragPanState = dragPanRef.current
    if (!dragPanState.active || dragPanState.pointerId !== event.pointerId) return
    if ((event.buttons & 1) !== 1) return

    const deltaX = event.clientX - dragPanState.startX
    const deltaY = event.clientY - dragPanState.startY
    const hasMovedEnough = shouldStartBoardDrag(deltaX, deltaY, DRAG_THRESHOLD_PX)

    if (!dragPanState.moved && !hasMovedEnough) return

    if (!dragPanState.captured) {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragPanState.captured = true
    }

    dragPanState.moved = true
    suppressClickUntilRef.current = performance.now() + CLICK_SUPPRESSION_MS
    event.preventDefault()

    setBoardPan((previous) => {
      const nextPan = getClampedPan({
        x: dragPanState.startPan.x + deltaX,
        y: dragPanState.startPan.y + deltaY,
      })

      return nextPan.x === previous.x && nextPan.y === previous.y ? previous : nextPan
    })
  }

  const finishBoardPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragPanState = dragPanRef.current
    if (!dragPanState.active || dragPanState.pointerId !== event.pointerId) return

    if (dragPanState.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (dragPanState.moved) {
      suppressClickUntilRef.current = performance.now() + CLICK_SUPPRESSION_MS
    }

    dragPanRef.current = createDragPanState()
  }

  const onBoardClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (performance.now() >= suppressClickUntilRef.current) return
    event.preventDefault()
    event.stopPropagation()
  }

  const flagsLeft = Math.max(0, level.mines - countFlags(board))

  return (
    <main className="h-screen overflow-hidden bg-[#f6f4ef] px-2 pb-3 pt-3 text-[#111111] sm:px-3">
      <section className="mx-auto flex h-full max-w-[1620px] flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Level</p>
            <p className="mt-1 text-xl font-semibold">
              {levelIndex + 1}/{LEVELS.length}
            </p>
          </div>
          <div className="rounded-xl border border-black/12 bg-white/74 px-3 py-2 text-center">
            <p className="text-[10px] tracking-[0.14em] text-black/56 uppercase">Grid</p>
            <p className="mt-1 text-xl font-semibold">
              {level.size}x{level.size}
            </p>
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

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex min-h-0 items-center justify-center rounded-2xl border border-black/14 bg-[linear-gradient(180deg,#fffdfa_0%,#f5eee3_100%)] p-2 shadow-[0_10px_36px_rgba(0,0,0,0.07)]">
            <div className="h-[min(78vh,82vw)] w-[min(78vh,82vw)] max-w-full rounded-xl border border-black/14 bg-[#ebe4d8] p-1.5 lg:h-[min(76vh,calc(100vw-24rem))] lg:w-[min(76vh,calc(100vw-24rem))]">
              <div
                ref={boardViewportRef}
                className="relative h-full w-full overflow-hidden rounded-[8px] select-none touch-none"
                onWheel={onBoardWheel}
                onPointerDownCapture={onBoardPointerDownCapture}
                onPointerMove={onBoardPointerMove}
                onPointerUp={finishBoardPan}
                onPointerCancel={finishBoardPan}
                onClickCapture={onBoardClickCapture}
              >
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${boardPan.x}px), calc(-50% + ${boardPan.y}px))`,
                  }}
                >
                  <div
                    className="relative rounded-[10px] bg-black/10 p-[1px] shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
                    style={{ width: boardWidth + 2, height: boardHeight + 2 }}
                  >
                    <div className="relative overflow-hidden rounded-[9px] bg-[#e6ddd1]" style={{ width: boardWidth, height: boardHeight }}>
                      {visibleCells.map(({ rowIndex, colIndex, cell }) => {
                        const cellStateClass = cell.revealed
                          ? isDenseBoard
                            ? "bg-[#e8e0d3]"
                            : "bg-[linear-gradient(180deg,#f4efe6_0%,#e7ddcf_100%)]"
                          : isDenseBoard
                            ? "bg-[#fbf7ef] hover:bg-[#fffaf2]"
                            : "bg-[linear-gradient(180deg,#ffffff_0%,#f3ecdf_100%)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#efe6d7_100%)]"

                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            type="button"
                            draggable={false}
                            onClick={() => onReveal(rowIndex, colIndex)}
                            onContextMenu={(event) => onToggleFlag(event, rowIndex, colIndex)}
                            className={`absolute flex items-center justify-center overflow-hidden font-semibold leading-none select-none ${cellStateClass}`}
                            style={{
                              left: colIndex * cellSize,
                              top: rowIndex * cellSize,
                              width: cellSize,
                              height: cellSize,
                              fontSize: cellFontSize,
                              boxShadow: cell.revealed
                                ? "inset 0 0 0 1px rgba(0, 0, 0, 0.07)"
                                : "inset 0 0 0 1px rgba(0, 0, 0, 0.12)",
                            }}
                          >
                            {cell.flagged && !cell.revealed && (
                              <img
                                src="/games/miner/flag.png"
                                alt=""
                                draggable={false}
                                className="object-contain"
                                style={{ width: cellIconSize, height: cellIconSize }}
                              />
                            )}
                            {cell.revealed && cell.mine && (
                              <img
                                src="/games/miner/mine.png"
                                alt=""
                                draggable={false}
                                className="object-contain"
                                style={{ width: cellIconSize, height: cellIconSize }}
                              />
                            )}
                            {cell.revealed && !cell.mine && cell.adjacent > 0 && (
                              <span className={ADJACENT_NUMBER_TONES[cell.adjacent] ?? "text-black/80"}>{cell.adjacent}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid grid-cols-2 gap-2 rounded-2xl border border-black/14 bg-white/58 p-2 shadow-[0_10px_36px_rgba(0,0,0,0.05)] lg:grid-cols-1 lg:content-start lg:p-3">
            {LEVELS.map((_, index) => {
              const unlocked = index < highestUnlockedLevel
              const selected = index === selectedStartLevel

              return (
                <button
                  key={`start-level-${index + 1}`}
                  type="button"
                  disabled={!unlocked}
                  aria-label={`Start from level ${index + 1}`}
                  onClick={() => {
                    if (!unlocked) return
                    startRunAtLevel(index)
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold tracking-[0.16em] uppercase transition-colors ${
                    unlocked
                      ? selected
                        ? "border-black/45 bg-[#111111] text-white"
                        : "border-black/16 bg-white/82 text-black hover:border-black/34"
                      : "cursor-not-allowed border-black/10 bg-black/[0.04] text-black/28"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => resetRun()}
              className="rounded-xl border border-black/16 bg-white/82 px-3 py-3 text-xs tracking-[0.11em] uppercase"
            >
              Restart Run
            </button>

            <button
              type="button"
              onClick={() => setStatus((previous) => (previous === "playing" ? "transition" : "playing"))}
              className="rounded-xl border border-black/16 bg-white/82 px-3 py-3 text-xs tracking-[0.11em] uppercase"
            >
              {status === "playing" ? "Pause" : "Resume"}
            </button>

            <div
              className={`col-span-2 rounded-xl border px-3 py-3 text-center text-xs tracking-[0.11em] uppercase lg:col-span-1 ${
                status === "lost"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : status === "won"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-black/12 bg-white/70 text-black/72"
              }`}
            >
              {status === "lost" ? "Boom" : status === "won" ? "Completed" : status === "transition" ? "Loading" : "Playing"}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
