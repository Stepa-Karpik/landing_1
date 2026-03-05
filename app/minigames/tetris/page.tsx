"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MinigameShell } from "@/components/minigame-shell"
import { useProfileTracker } from "@/components/profile-provider"

type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L"

interface Piece {
  type: PieceType
  matrix: number[][]
  row: number
  col: number
}

interface TetrisState {
  board: number[][]
  piece: Piece
  score: number
  lines: number
  gameOver: boolean
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

const SHAPES: Record<PieceType, number[][]> = {
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

const PIECE_ORDER: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"]
const LINE_SCORES = [0, 100, 300, 500, 800]
const COLORS = [
  "bg-transparent",
  "bg-cyan-500",
  "bg-yellow-400",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-orange-500",
]

function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0))
}

function cloneMatrix(matrix: number[][]) {
  return matrix.map((row) => [...row])
}

function randomPiece(): Piece {
  const type = PIECE_ORDER[Math.floor(Math.random() * PIECE_ORDER.length)]
  const matrix = cloneMatrix(SHAPES[type])
  const col = Math.floor((BOARD_WIDTH - matrix[0].length) / 2)
  return { type, matrix, row: 0, col }
}

function rotateMatrix(matrix: number[][]) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]).reverse())
}

function canPlace(board: number[][], piece: Piece) {
  for (let row = 0; row < piece.matrix.length; row += 1) {
    for (let col = 0; col < piece.matrix[row].length; col += 1) {
      if (piece.matrix[row][col] === 0) continue
      const boardRow = piece.row + row
      const boardCol = piece.col + col
      if (boardCol < 0 || boardCol >= BOARD_WIDTH || boardRow >= BOARD_HEIGHT) return false
      if (boardRow >= 0 && board[boardRow][boardCol] !== 0) return false
    }
  }
  return true
}

function mergePiece(board: number[][], piece: Piece) {
  const next = board.map((row) => [...row])
  const colorValue = PIECE_ORDER.indexOf(piece.type) + 1
  for (let row = 0; row < piece.matrix.length; row += 1) {
    for (let col = 0; col < piece.matrix[row].length; col += 1) {
      if (piece.matrix[row][col] === 0) continue
      const targetRow = piece.row + row
      const targetCol = piece.col + col
      if (targetRow >= 0 && targetRow < BOARD_HEIGHT && targetCol >= 0 && targetCol < BOARD_WIDTH) {
        next[targetRow][targetCol] = colorValue
      }
    }
  }
  return next
}

function clearFilledLines(board: number[][]) {
  const remainingRows = board.filter((row) => row.some((cell) => cell === 0))
  const cleared = BOARD_HEIGHT - remainingRows.length
  const padding = Array.from({ length: cleared }, () => Array.from({ length: BOARD_WIDTH }, () => 0))
  return {
    board: [...padding, ...remainingRows],
    cleared,
  }
}

function overlayPiece(board: number[][], piece: Piece) {
  const preview = board.map((row) => [...row])
  const value = PIECE_ORDER.indexOf(piece.type) + 1
  for (let row = 0; row < piece.matrix.length; row += 1) {
    for (let col = 0; col < piece.matrix[row].length; col += 1) {
      if (piece.matrix[row][col] === 0) continue
      const targetRow = piece.row + row
      const targetCol = piece.col + col
      if (targetRow >= 0 && targetRow < BOARD_HEIGHT && targetCol >= 0 && targetCol < BOARD_WIDTH) {
        preview[targetRow][targetCol] = value
      }
    }
  }
  return preview
}

function createInitialState(): TetrisState {
  return {
    board: createBoard(),
    piece: randomPiece(),
    score: 0,
    lines: 0,
    gameOver: false,
  }
}

export default function TetrisPage() {
  const { data, recordGameResult } = useProfileTracker()
  const [game, setGame] = useState<TetrisState>(() => createInitialState())
  const reportedRef = useRef(false)

  const stepDown = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver) return previous

      const movedPiece = { ...previous.piece, row: previous.piece.row + 1 }
      if (canPlace(previous.board, movedPiece)) {
        return { ...previous, piece: movedPiece }
      }

      const merged = mergePiece(previous.board, previous.piece)
      const { board: clearedBoard, cleared } = clearFilledLines(merged)
      const nextScore = previous.score + LINE_SCORES[cleared]
      const nextLines = previous.lines + cleared
      const nextPiece = randomPiece()

      if (!canPlace(clearedBoard, nextPiece)) {
        return {
          board: clearedBoard,
          piece: nextPiece,
          score: nextScore,
          lines: nextLines,
          gameOver: true,
        }
      }

      return {
        board: clearedBoard,
        piece: nextPiece,
        score: nextScore,
        lines: nextLines,
        gameOver: false,
      }
    })
  }, [])

  const moveHorizontal = useCallback((direction: -1 | 1) => {
    setGame((previous) => {
      if (previous.gameOver) return previous
      const moved = { ...previous.piece, col: previous.piece.col + direction }
      if (!canPlace(previous.board, moved)) return previous
      return { ...previous, piece: moved }
    })
  }, [])

  const rotate = useCallback(() => {
    setGame((previous) => {
      if (previous.gameOver) return previous
      const rotatedMatrix = rotateMatrix(previous.piece.matrix)
      const basePiece = { ...previous.piece, matrix: rotatedMatrix }
      const offsets = [0, -1, 1, -2, 2]
      for (const offset of offsets) {
        const candidate = { ...basePiece, col: basePiece.col + offset }
        if (canPlace(previous.board, candidate)) {
          return { ...previous, piece: candidate }
        }
      }
      return previous
    })
  }, [])

  useEffect(() => {
    if (game.gameOver) return
    const speed = Math.max(130, 560 - game.lines * 14)
    const timer = window.setInterval(() => {
      stepDown()
    }, speed)
    return () => window.clearInterval(timer)
  }, [game.gameOver, game.lines, stepDown])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveHorizontal(-1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        moveHorizontal(1)
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        stepDown()
      } else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        event.preventDefault()
        rotate()
      } else if (event.key === " " && game.gameOver) {
        event.preventDefault()
        reportedRef.current = false
        setGame(createInitialState())
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [game.gameOver, moveHorizontal, rotate, stepDown])

  useEffect(() => {
    if (!game.gameOver || reportedRef.current) return
    reportedRef.current = true
    recordGameResult("tetris", {
      score: game.score,
      win: game.score >= 700,
    })
  }, [game.gameOver, game.score, recordGameResult])

  const visualBoard = useMemo(() => overlayPiece(game.board, game.piece), [game.board, game.piece])
  const best = data.gameStats.tetris.bestScore

  return (
    <MinigameShell
      title="Тетрис"
      subtitle="Управление: стрелки влево/вправо/вниз, вверх для поворота. Цель для достижения: 700 очков."
    >
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="w-fit rounded-md border border-black/15 bg-[#faf8f3] p-2">
          <div className="grid grid-cols-10 gap-0.5">
            {visualBoard.flatMap((row, rowIndex) =>
              row.map((value, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`h-5 w-5 rounded-[2px] border border-black/8 ${COLORS[value]}`}
                />
              )),
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] tracking-[0.12em] uppercase">
            <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
              <p className="text-black/55">Счет</p>
              <p className="mt-0.5 text-lg font-semibold">{game.score}</p>
            </div>
            <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
              <p className="text-black/55">Линии</p>
              <p className="mt-0.5 text-lg font-semibold">{game.lines}</p>
            </div>
            <div className="rounded-md border border-black/12 bg-white/65 px-2 py-2">
              <p className="text-black/55">Рекорд</p>
              <p className="mt-0.5 text-lg font-semibold">{best}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => moveHorizontal(-1)}
              className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs tracking-[0.1em] uppercase"
            >
              Влево
            </button>
            <button
              type="button"
              onClick={() => rotate()}
              className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs tracking-[0.1em] uppercase"
            >
              Поворот
            </button>
            <button
              type="button"
              onClick={() => moveHorizontal(1)}
              className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs tracking-[0.1em] uppercase"
            >
              Вправо
            </button>
            <button
              type="button"
              onClick={() => stepDown()}
              className="rounded-md border border-black/20 bg-white/75 px-3 py-1.5 text-xs tracking-[0.1em] uppercase"
            >
              Вниз
            </button>
          </div>

          {game.gameOver && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <p className="font-semibold">Игра окончена</p>
              <p className="mt-1 text-red-700/90">Пробел или кнопка ниже для рестарта.</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              reportedRef.current = false
              setGame(createInitialState())
            }}
            className="rounded-md border border-black/20 bg-black px-4 py-2 text-xs tracking-[0.12em] text-white uppercase"
          >
            Новая игра
          </button>
        </div>
      </div>
    </MinigameShell>
  )
}
